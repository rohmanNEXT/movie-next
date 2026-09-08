import { Request, Response } from 'express';
import { createToken } from '@/utils/jwt';
import { sendEmail } from '@/utils/email';
import prisma from '@/prisma';
import { BASE_URL, FE_URL } from '@/config';
import {
  generateCryptoToken,
  hashPassword,
  comparePassword,
} from '@/utils/crypto';
import { authService } from '@/services/auth.service';

function userResponse(user: any) {
  const profile = user.profile || {};
  return {
    id: user.id,
    fullName: profile.fullName || null,
    username: user.username,
    email: user.email,
    password: user.password,
    role: user.role,
    avatar: profile.avatar || null,
    phoneNumber: profile.phoneNumber || null,
    city: profile.city || null,
    country: profile.country || null,
    referralCode: user.referralCode || null,
    createdAt: user.createdAt,
  };
}

export class AuthController {
  // GET /api/config
  async getConfig(req: Request, res: Response) {
    return res.status(200).send({
      success: true,
      data: {
        googleClientId: process.env.GOOGLE_CLIENT_ID || '',
        microsoftClientId: process.env.MICROSOFT_CLIENT_ID || '',
      },
      message: 'success',
    });
  }

  // POST /api/register
  async register(req: Request, res: Response) {
    try {
      const { fullName, username, email, password, role, referralCode } =
        req.body;

      if (!fullName || !username || !email || !password) {
        return res
          .status(400)
          .send({ success: false, message: 'Semua field wajib diisi' });
      }

      const existingEmail = await prisma.user.findFirst({
        where: { email },
      });
      if (existingEmail) {
        return res
          .status(409)
          .send({ success: false, message: 'Email sudah terdaftar' });
      }

      const existingUsername = await prisma.user.findFirst({
        where: { username },
      });
      if (existingUsername) {
        return res
          .status(409)
          .send({ success: false, message: 'Username sudah terdaftar' });
      }

      const hashedPassword = hashPassword(password);
      const targetRole = role === 'admin' ? 'admin' : 'user';

      // Generate unique referral code buat user baru (hanya untuk role 'user')
      let myReferralCode = null;
      if (targetRole === 'user') {
        myReferralCode = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
      }

      // Check kalo referral code nya ada dan valid (hanya untuk role 'user')
      let referredById = null;
      if (referralCode && targetRole === 'user') {
        const referrer = await prisma.user.findUnique({
          where: { referralCode },
        });
        if (referrer && referrer.role === 'user') {
          referredById = referrer.id;
        }
      }

      const verifyToken = generateCryptoToken();
      const verifyTokenExpiry = new Date(Date.now() + 20 * 60 * 1000); // 20 menit

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          isVerified: true, // Auto-verify on register for immediate login
          role: targetRole,
          referralCode: myReferralCode,
          referredById,
          token: verifyToken,
          verifyTokenExpiry,
          profile: {
            create: {
              fullName,
            },
          },
          balance: {
            create: {
              balance: 0,
            },
          },
        },
        include: { profile: true },
      });

      const verifyLink = `${BASE_URL}/api/verify-email?token=${verifyToken}`;
      console.log('Verification link:', verifyLink);

      await sendEmail(email, 'Verifikasi Email - Chill Movie', 'VerifyEmail', {
        email: user.email,
        token: verifyToken,
      });

      return res.status(201).send({
        success: true,
        message:
          'Registrasi berhasil! Anda dapat langsung login. Silakan cek email untuk informasi akun.',
        data: userResponse(user),
      });
    } catch (err) {
      console.error('Register error:', err);
      return res
        .status(500)
        .send({ success: false, message: 'Gagal mendaftar' });
    }
  }

  // GET /api/verify-email?token=xxx
  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res
          .status(400)
          .send({ success: false, message: 'Token tidak valid' });
      }

      const user = await prisma.user.findFirst({ where: { token } });
      if (!user) {
        return res
          .status(404)
          .json({
            success: false,
            message: 'Token tidak ditemukan atau sudah digunakan',
          });
      }

      // Cek apakah token sudah kadaluarsa (20 menit)
      if (user.verifyTokenExpiry && user.verifyTokenExpiry < new Date()) {
        return res.status(400).json({
          success: false,
          message:
            'Link verifikasi sudah kadaluarsa (melebihi 20 menit). Silakan register ulang.',
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          token: null,
          verifyTokenExpiry: null,
        },
      });

      // Redirect ke FE login page abis verification
      return res.redirect(`${FE_URL}/login?verified=true`);
    } catch (err) {
      console.error('Verify error:', err);
      return res
        .status(500)
        .send({ success: false, message: 'Gagal memverifikasi email' });
    }
  }

  // POST /api/login
  async login(req: Request, res: Response) {
    try {
      const { email, password, keepLogin } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .send({ success: false, message: 'Email dan password wajib diisi' });
      }

      const user = await prisma.user.findFirst({
        where: { email: email },
        include: { profile: true },
      });
      if (!user) {
        return res
          .status(404)
          .send({ success: false, message: 'Email tidak ditemukan' });
      }

      // Check kalo account nya ke-locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const diffMs = user.lockedUntil.getTime() - Date.now();
        const hoursLeft = Math.floor(diffMs / (60 * 60 * 1000));
        const minutesLeft = Math.ceil((diffMs % (60 * 60 * 1000)) / 60000);

        const timeStr =
          hoursLeft > 0
            ? `${hoursLeft} jam ${minutesLeft} menit`
            : `${minutesLeft} menit`;

        return res.status(429).send({
          success: false,
          message: `Akun Anda sedang ditangguhkan karena terlalu banyak percobaan gagal. Silakan coba lagi dalam ${timeStr}.`,
        });
      }

      // Check password nya
      const isMatch = comparePassword(password, user.password);
      if (!isMatch) {
        const newAttempts = user.loginAttempts + 1;
        const updateData: any = { loginAttempts: newAttempts };

        // Lock abis 10 failed attempts selama 1 menit
        if (newAttempts >= 10) {
          updateData.lockedUntil = new Date(Date.now() + 1 * 60 * 1000);
          updateData.loginAttempts = 0;
        }

        await prisma.user.update({ where: { id: user.id }, data: updateData });

        if (newAttempts >= 10) {
          return res
            .status(429)
            .send({
              success: false,
              message:
                'Terlalu banyak percobaan gagal. Akun Anda ditangguhkan selama 1 menit demi keamanan.',
            });
        }
        const remaining = 10 - newAttempts;
        return res
          .status(401)
          .send({
            success: false,
            message: `Email atau password salah. Sisa percobaan: ${remaining}`,
          });
      }

      // Email verification check removed - users can login without verification
      // if (!user.isVerified) {
      //   return res.status(403).send({ success: false, message: 'Akun belum diverifikasi. Cek email Anda.' });
      // }

      // Reset attempts pas successful login & auto-verify email
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null, isVerified: true },
      });

      const jwtToken = createToken(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        keepLogin,
      );

      return res.status(200).send({
        success: true,
        message: 'Login berhasil',
        data: {
          token: jwtToken,
          user: userResponse(user),
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).send({ success: false, message: 'Gagal login' });
    }
  }

  // POST /api/forgot-password
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email)
        return res
          .status(400)
          .send({ success: false, message: 'Email wajib diisi' });

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res
          .status(404)
          .send({ success: false, message: 'Email tidak ditemukan' });
      }

      const resetToken = generateCryptoToken();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 jam doang

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      const resetLink = `${FE_URL}/reset-password?token=${resetToken}`;
      await sendEmail(email, 'Reset Password - Chill', 'ResetPass', {
        email: user.email,
        token: resetToken,
        urlLink: resetLink,
      });

      return res
        .status(200)
        .send({
          success: true,
          data: null,
          message: 'Jika email terdaftar, instruksi reset telah dikirim.',
        });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res
        .status(500)
        .send({ success: false, message: 'Gagal mengirim email reset' });
    }
  }

  // POST /api/reset-password
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res
          .status(400)
          .send({
            success: false,
            message: 'Token dan password baru wajib diisi',
          });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .send({ success: false, message: 'Password minimal 6 karakter' });
      }

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        return res
          .status(400)
          .send({
            success: false,
            message: 'Token tidak valid atau sudah kedaluwarsa',
          });
      }

      const hashedPassword = hashPassword(password);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          loginAttempts: 0,
          lockedUntil: null,
        },
      });

      return res
        .status(200)
        .send({
          success: true,
          data: null,
          message: 'Kata sandi berhasil direset! Silakan login.',
        });
    } catch (err) {
      console.error('Reset password error:', err);
      return res
        .status(500)
        .send({ success: false, message: 'Gagal mereset password' });
    }
  }

  // POST /api/auth/google
  async googleAuth(req: Request, res: Response) {
    try {
      const { idToken, isRegister, keepLogin } = req.body;

      const user = await authService.handleGoogleAuth(idToken, isRegister);

      const jwtToken = createToken(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        keepLogin,
      );
      return res.status(200).send({
        success: true,
        message: 'Login Google berhasil',
        data: {
          token: jwtToken,
          user: userResponse(user),
        },
      });
    } catch (err: any) {
      console.error('Google auth error:', err);
      const message = err.message || 'Gagal login dengan Google';
      return res.status(400).send({ success: false, message });
    }
  }

  // POST /api/keep-login
  async keepLogin(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const decoded = authReq.user;

      if (!decoded || !decoded.id) {
        return res
          .status(401)
          .send({ success: false, message: 'Invalid token payload.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          profile: true,
          subscriptions: {
            where: { isActive: true },
            include: { package: true },
            take: 1,
          },
          balance: true,
        },
      });

      if (!user) {
        return res
          .status(404)
          .send({ success: false, message: 'User tidak ditemukan.' });
      }

      // Refresh token with 8 hour expiry
      const token = createToken(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        true, // keepLogin = true for 8 hour expiry
      );

      return res.status(200).send({
        success: true,
        message: 'Token berhasil di-refresh',
        data: {
          token,
          user: userResponse(user),
          subscription: user.subscriptions[0] || null,
          balance: user.balance?.balance || 0,
        },
      });
    } catch (err: any) {
      console.error('Keep login error:', err);
      return res
        .status(500)
        .send({ success: false, message: 'Gagal refresh token' });
    }
  }

  // DELETE /api/delete-account
  async deleteAccount(req: Request, res: Response) {
    try {
      // const authReq = req as any;

      const { id } = req.body;
      // const userId = typeof id === 'string' ? parseInt(id, 10) : id;

      // if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        return res
          .status(400)
          .json({ success: false, message: 'ID tidak valid' });
      }
      // Cek apakah user ada
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: 'User tidak ditemukan' });

      // Hapus user (Data terkait seperti Profile, Wishlist, dll akan terhapus otomatis karena onDelete: Cascade di Prisma)
      await prisma.user.delete({
        where: { id: userId },
      });

      return res
        .status(200)
        .json({ success: true, message: 'Akun berhasil dihapus selamanya' });
    } catch (err) {
      console.error('Delete account error:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Gagal menghapus akun' });
    }
  }

  // GET /api/me — get current authenticated user
  async getMe(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const userId = authReq.user?.id;
      if (!userId)
        return res
          .status(401)
          .send({ success: false, message: 'Unauthorized' });

      const user = await authService.getMe(userId);
      if (!user)
        return res
          .status(404)
          .send({ success: false, message: 'User tidak ditemukan' });

      return res.status(200).send({
        success: true,
        message: 'success',
        data: {
          ...userResponse(user),
          subscription: user.subscriptions[0] || null,
          balance: user.balance?.balance || 0,
          referralCode: user.referralCode,
          commissions: user.commissionsEarned,
        },
      });
    } catch (err) {
      console.error('Get me error:', err);
      return res
        .status(500)
        .send({ success: false, message: 'Gagal mengambil data user' });
    }
  }
}
