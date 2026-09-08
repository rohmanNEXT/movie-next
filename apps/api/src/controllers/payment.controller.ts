import { Request, Response } from 'express';
import prisma from '@/prisma';
import type { AuthRequest } from '@/middlewares/auth.middleware';

export class PaymentController {
  // POST /api/payment/balance
  async payWithBalance(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const { packageId } = req.body;

      if (!packageId) return res.status(400).send({ success: false, message: 'packageId wajib diisi' });

      // Cari package nya
      let pkg = await prisma.package.findUnique({ where: { id: Number(packageId) } });

      // Fallback packages if not found in database
      if (!pkg) {
        const fallbackPackages: any[] = [
          { id: 1, name: 'Essential', price: 49000, durationDays: 30 },
          { id: 2, name: 'Professional', price: 79000, durationDays: 30 },
          { id: 3, name: 'Ultimate', price: 119000, durationDays: 30 },
        ];
        pkg = fallbackPackages.find(p => p.id === Number(packageId));
        if (!pkg) {
          return res.status(404).send({ success: false, message: 'Paket tidak ditemukan' });
        }
      }

      // Cari user balance
      const userBalance = await prisma.userBalance.findUnique({ where: { userId } });
      if (!userBalance || userBalance.balance < pkg.price) {
        return res.status(400).send({ success: false, message: 'Saldo tidak mencukupi' });
      }

      // Mulai transaction
      const result = await prisma.$transaction(async (tx: any) => {
        // If using fallback package, create it in database first
        if (!pkg.createdAt) {
          const createdPkg = await tx.package.create({
            data: {
              id: pkg.id,
              name: pkg.name,
              price: pkg.price,
              durationDays: pkg.durationDays,
              features: 'Kualitas HD|Tonton di 2 perangkat|Bebas iklan',
              isActive: true,
            },
          });
          pkg.id = createdPkg.id;
        }

        // Potong balance (Deduct)
        const updatedBalance = await tx.userBalance.update({
          where: { userId },
          data: { balance: { decrement: pkg.price } },
        });

        // Buat transaction history
        await tx.transactionHistory.create({
          data: {
            userId,
            amount: pkg.price,
            type: 'SUBSCRIBE',
            status: 'SUCCESS',
            description: `Pembelian paket ${pkg.name}`,
          },
        });

        // Matikan existing subs
        await tx.userSubscription.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        });

        // Buat new subscription
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1); // Wajib sebulan (1 bulan)

        const subscription = await tx.userSubscription.create({
          data: {
            userId,
            packageId: pkg.id,
            startDate,
            endDate,
            isActive: true,
          },
        });

        // Handle referral commission
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (user?.referredById) {
          const referrer = await tx.user.findUnique({ where: { id: user.referredById } });
          // Only pay commission if referrer is a regular user (not admin/superadmin)
          if (referrer && referrer.role === 'user') {
            // Anggap commission 10%
            const commissionAmount = pkg.price * 0.1;
            
            // buat commission record 
            await tx.referralCommission.create({
              data: {
                referrerId: user.referredById,
                refereeId: userId,
                amount: commissionAmount,
              },
            });

            // Update referrer balance
            await tx.userBalance.upsert({
              where: { userId: user.referredById },
              update: { balance: { increment: commissionAmount } },
              create: { userId: user.referredById, balance: commissionAmount },
            });

            // Buat transaction history buat referrer
            await tx.transactionHistory.create({
              data: {
                userId: user.referredById,
                amount: commissionAmount,
                type: 'REFERRAL_COMMISSION',
                status: 'SUCCESS',
                description: `Komisi referral dari pembelian ${user.username}`,
              },
            });
          }
        }

        return { updatedBalance, subscription };
      });

      return res.status(200).send({
        success: true,
        message: 'Pembelian paket berhasil',
        data: {
          balance: result.updatedBalance.balance,
          subscription: result.subscription,
        }
      });
    } catch (err: any) {
      console.error('Pay With Balance Error:', err);
      return res.status(500).send({ success: false, message: 'Gagal memproses pembayaran' });
    }
  }

  // POST /api/payment/topup
  async topup(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const { amount } = req.body;

      let parsedAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[.,]/g, '')) : amount;

      const MIN_TOPUP = 10000;
      const MAX_TOPUP = 10000000; // 10 juta
      const MAX_BALANCE = 10000000000; // 10 meliar
      const APP_FEE = 2500;
      const TAX_RATE = 0.11; // 11% pajak

      if (!parsedAmount || parsedAmount < MIN_TOPUP) {
        return res.status(400).send({ 
          success: false, 
          message: `Minimum topup adalah Rp ${MIN_TOPUP.toLocaleString('id-ID')}` 
        });
      }

      if (parsedAmount > MAX_TOPUP) {
        return res.status(400).send({ 
          success: false, 
          message: `Maksimum topup adalah Rp ${MAX_TOPUP.toLocaleString('id-ID')}` 
        });
      }

      const taxFee = Math.round(parsedAmount * TAX_RATE);
      const totalPayment = parsedAmount + APP_FEE + taxFee;

      const result = await prisma.$transaction(async (tx: any) => {
        // Cek current balance
        const currentBalanceObj = await tx.userBalance.findUnique({
          where: { userId },
        });
        
        const currentBalance = currentBalanceObj?.balance || 0;
        
        if (currentBalance + parsedAmount > MAX_BALANCE) {
          throw new Error(`Maksimum saldo adalah Rp ${MAX_BALANCE.toLocaleString('id-ID')}`);
        }

        // Update atau create balancenya
        const updatedBalance = await tx.userBalance.upsert({
          where: { userId },
          update: { balance: { increment: parsedAmount } },
          create: { userId, balance: parsedAmount },
        });

        // Create transaction history nya
        await tx.transactionHistory.create({
          data: {
            userId,
            amount: parsedAmount,
            type: 'TOPUP',
            status: 'SUCCESS',
            description: `Topup saldo (Pokok: Rp ${parsedAmount.toLocaleString('id-ID')}, Fee: Rp ${APP_FEE.toLocaleString('id-ID')}, Pajak: Rp ${taxFee.toLocaleString('id-ID')})`,
          },
        });

        return updatedBalance;
      });

      return res.status(200).send({
        success: true,
        message: 'Topup berhasil',
        data: {
          balance: result.balance,
        }
      });
    } catch (err: any) {
      console.error('Topup Error:', err);
      if (err.message && err.message.startsWith('Maksimum saldo')) {
        return res.status(400).send({ success: false, message: err.message });
      }
      return res.status(500).send({ success: false, message: 'Gagal memproses topup' });
    }
  }

  // GET /api/payment/transactions
  async getTransactions(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 6;
      const skip = (page - 1) * limit;

      const total = await prisma.transactionHistory.count({ where: { userId } });
      
      const transactions = await prisma.transactionHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return res.status(200).send({ 
        success: true, 
        data: transactions, 
        meta: {
          total,
          page,
          limit,
          totalPages
        },
        message: 'success' 
      });
    } catch (err) {
      console.error('Get transactions error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengambil data transaksi' });
    }
  }

  // GET /api/packages — list available packages
  async getPackages(_req: Request, res: Response) {
    try {
      const packages = await prisma.package.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });
      return res.status(200).send({ success: true, data: packages, message: 'success' });
    } catch (err) {
      console.error('Get packages error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengambil data paket' });
    }
  }

  // POST /api/payment/withdraw
  async withdraw(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const { amount } = req.body;

      const MIN_WITHDRAW = 10000;
      const MAX_WITHDRAW = 10000000;

      if (!amount || amount <= 0) {
        return res.status(400).send({ success: false, message: 'Jumlah penarikan harus lebih dari 0' });
      }

      if (amount < MIN_WITHDRAW) {
        return res.status(400).send({ success: false, message: `Minimum penarikan adalah Rp ${MIN_WITHDRAW.toLocaleString('id-ID')}` });
      }

      if (amount > MAX_WITHDRAW) {
        return res.status(400).send({ success: false, message: `Maksimum penarikan adalah Rp ${MAX_WITHDRAW.toLocaleString('id-ID')}` });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { balance: true }
      });

      if (!user?.balance) {
        return res.status(400).send({ success: false, message: 'Balance tidak ditemukan' });
      }

      if (user.balance.balance < amount) {
        return res.status(400).send({ success: false, message: 'Saldo tidak mencukupi' });
      }

      await prisma.$transaction(async (tx: any) => {
        // Deduct from balance
        await tx.userBalance.update({
          where: { userId },
          data: { balance: { decrement: amount } }
        });

        // Record transaction
        await tx.transactionHistory.create({
          data: {
            userId,
            amount,
            type: 'WITHDRAW',
            status: 'SUCCESS',
            description: `Penarikan saldo Rp ${amount.toLocaleString('id-ID')}`
          }
        });
      });

      return res.status(200).send({ success: true, message: 'Penarikan berhasil' });
    } catch (err) {
      console.error('Withdraw error:', err);
      return res.status(500).send({ success: false, message: 'Gagal melakukan penarikan' });
    }
  }
}
