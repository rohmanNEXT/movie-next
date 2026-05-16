import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { createToken } from '@/helpers/jwt';
import { sendEmail } from '@/helpers/email';
import prisma from '@/prisma';
import { BASE_URL, FE_URL, GOOGLE_CLIENT_ID } from '@/config';
import { generateCryptoToken } from '@/helpers/crypto';
import { authService } from '@/services/auth.service';
import * as fs from 'fs';
import * as path from 'path';

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
    createdAt: user.createdAt
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
      message: 'success'
    });
  }

  // POST /api/register
  async register(req: Request, res: Response) {
    try {
      const { fullName, username, email, password, role, referralCode } = req.body;

      if (!fullName || !username || !email || !password) {
        return res.status(400).send({ success: false, message: 'Semua field wajib diisi' });
      }

      const existingEmail = await prisma.user.findFirst({
        where: { email },
      });
      if (existingEmail) {
        return res.status(409).send({ success: false, message: 'Email sudah terdaftar' });
      }

      const existingUsername = await prisma.user.findFirst({
        where: { username },
      });
      if (existingUsername) {
        return res.status(409).send({ success: false, message: 'Username sudah terdaftar' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verifyToken = generateCryptoToken();

      // Generate unique referral code buat user baru
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Check kalo referral code nya ada dan valid
      let referredById = null;
      if (referralCode) {
        const referrer = await prisma.user.findUnique({ where: { referralCode } });
        if (referrer) {
          referredById = referrer.id;
        }
      }

      const user = await prisma.user.create({
        data: {
          username, 
          email,
          password: hashedPassword,
          isVerified: false,
          token: verifyToken,
          verifyTokenExpiry: new Date(Date.now() + 20 * 60 * 1000), // Kadaluarsa dalam 20 menit
          role: role === 'admin' ? 'admin' : 'user',
          referralCode: myReferralCode,
          referredById,
          profile: {
            create: {
              fullName,
            }
          },
          balance: {
            create: {
              balance: 0
            }
          }
        },
        include: { profile: true }
      });

      const verifyLink = `${BASE_URL}/api/verify-email?token=${verifyToken}`;
      console.log('Verification link:', verifyLink);

      await sendEmail(email, 'Verifikasi Email - Chill Movie', 'verifyEmail', { 
        email: user.email, 
        token: verifyToken 
      });


      return res.status(201).send({
        success: true,
        message: 'Registrasi berhasil! Silakan cek email untuk verifikasi.',
        data: userResponse(user)
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mendaftar' });
    }
  }

  // GET /api/verify-email?token=xxx
  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).send({ success: false, message: 'Token tidak valid' });
      }

      const user = await prisma.user.findFirst({ where: { token } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Token tidak ditemukan atau sudah digunakan' });
      }

      // Cek apakah token sudah kadaluarsa (20 menit)
      if (user.verifyTokenExpiry && user.verifyTokenExpiry < new Date()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Link verifikasi sudah kadaluarsa (melebihi 20 menit). Silakan register ulang.' 
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          token: null,
          verifyTokenExpiry: null,
        }
      });

      // Redirect ke FE login page abis verification
      return res.redirect(`${FE_URL}/login?verified=true`);
    } catch (err) {
      console.error('Verify error:', err);
      return res.status(500).send({ success: false, message: 'Gagal memverifikasi email' });
    }
  }

  // POST /api/login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).send({ success: false, message: 'Email dan password wajib diisi' });
      }

      const user = await prisma.user.findFirst({
        where: { email: email },
        include: { profile: true }
      });
      if (!user) {
        return res.status(404).send({ success: false, message: 'Email tidak ditemukan' });
      }

      // Check kalo account nya ke-locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const diffMs = user.lockedUntil.getTime() - Date.now();
        const hoursLeft = Math.floor(diffMs / (60 * 60 * 1000));
        const minutesLeft = Math.ceil((diffMs % (60 * 60 * 1000)) / 60000);
        
        const timeStr = hoursLeft > 0 
          ? `${hoursLeft} jam ${minutesLeft} menit` 
          : `${minutesLeft} menit`;

        return res.status(429).send({ 
          success: false, 
          message: `Akun Anda sedang ditangguhkan karena terlalu banyak percobaan gagal. Silakan coba lagi dalam ${timeStr}.` 
        });
      }

      // Check password nya
      const isMatch = await bcrypt.compare(password, user.password);
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
          return res.status(429).send({ success: false, message: 'Terlalu banyak percobaan gagal. Akun Anda ditangguhkan selama 1 menit demi keamanan.' });
        }
        const remaining = 10 - newAttempts;
        return res.status(401).send({ success: false, message: `Email atau password salah. Sisa percobaan: ${remaining}` });
      }

      if (!user.isVerified) {
        return res.status(403).send({ success: false, message: 'Akun belum diverifikasi. Cek email Anda.' });
      }

      // Reset attempts pas successful login
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null },
      });

      const jwtToken = createToken({ id: user.id, email: user.email, username: user.username, role: user.role });

      return res.status(200).send({
        success: true,
        message: 'Login berhasil',
        data: {
          token: jwtToken,
          user: userResponse(user),
        }
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
      if (!email) return res.status(400).send({ success: false, message: 'Email wajib diisi' });

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(404).send({ success: false, message: 'Email tidak ditemukan' });
      }

      const resetToken = generateCryptoToken();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 jam doang

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      const resetLink = `${FE_URL}/reset-password?token=${resetToken}`;
      await sendEmail(email, 'Reset Password - CHILL', 'resetPass', { 
        email: user.email, 
        token: resetToken,
        urlLink: resetLink
      });

      return res.status(200).send({ success: true, data: null, message: 'Jika email terdaftar, instruksi reset telah dikirim.' });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengirim email reset' });
    }
  }

  // POST /api/reset-password
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).send({ success: false, message: 'Token dan password baru wajib diisi' });
      }

      if (password.length < 6) {
        return res.status(400).send({ success: false, message: 'Password minimal 6 karakter' });
      }

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        return res.status(400).send({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

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

      return res.status(200).send({ success: true, data: null, message: 'Kata sandi berhasil direset! Silakan login.' });
    } catch (err) {
      console.error('Reset password error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mereset password' });
    }
  }

  // POST /api/auth/google
  async googleAuth(req: Request, res: Response) {
    try {
      const { idToken, isRegister } = req.body;
      if (!idToken) return res.status(400).send({ success: false, message: 'Google ID Token diperlukan' });

      // Verify Google token lewat Google's token informasi endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!response.ok) {
        return res.status(401).send({ success: false, message: 'Token Google tidak valid' });
      }

      const payload = await response.json() as { sub: string; email: string; name: string; picture?: string; aud?: string };

      if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
        return res.status(401).send({ success: false, message: 'Client ID tidak cocok' });
      }

      const { sub: googleId, email, name, picture } = payload;

      // Download avatar if available
      let avatarPath = picture || null;
      if (picture) {
        try {
          const imgResponse = await fetch(picture);
          const arrayBuffer = await imgResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const filename = `avatar-${googleId}-${Date.now()}.jpg`;
          const uploadDir = path.resolve(__dirname, '../../public/uploads');
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          fs.writeFileSync(path.join(uploadDir, filename), buffer);
          avatarPath = `/uploads/${filename}`;
        } catch (error) {
          console.error('Failed to download Google avatar:', error);
        }
      }

      // Cari atau buat user
      let user = await prisma.user.findFirst({
        where: { OR: [{ googleId }, { email }] },
      });

      if (user) {
        if (isRegister) {
          return res.status(400).send({ success: false, message: 'Akun sudah terdaftar. Silakan pindah ke halaman Login.' });
        }
        // Link Google ID kalo belom linked
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { 
              googleId, 
              isVerified: true,
              profile: {
                update: {
                  avatar: avatarPath || undefined
                }
              }
            },
            include: { profile: true }
          });
        }
      } else {
        if (!isRegister) {
          return res.status(400).send({ success: false, message: 'Akun belum terdaftar. Silakan mendaftar terlebih dahulu.' });
        }
        // Buat user baru, follow google username
        let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        let username = baseUsername;
        let counter = 1;
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }
        
        // Generate unique referral code buat user baru
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        user = await prisma.user.create({
          data: {
            username,
            email,
            password: await bcrypt.hash(generateCryptoToken(16), 10), // random password
            isVerified: true,
            googleId,
            referralCode: myReferralCode,
            profile: {
              create: {
                fullName: name,
                avatar: avatarPath || null,
              }
            },
            balance: {
              create: {
                balance: 0
              }
            }
          },
          include: { profile: true }
        });
      }

      const jwtToken = createToken({ id: user.id, email: user.email, username: user.username, role: user.role });
      return res.status(200).send({
        success: true,
        message: 'Login Google berhasil',
        data: {
          token: jwtToken,
          user: userResponse(user),
        }
      });
    } catch (err) {
      console.error('Google auth error:', err);
      return res.status(500).send({ success: false, message: 'Gagal login dengan Google' });
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
        return res.status(400).json({ success: false, message: 'ID tidak valid' });
      }
      // Cek apakah user ada
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

      // Hapus user (Data terkait seperti Profile, Wishlist, dll akan terhapus otomatis karena onDelete: Cascade di Prisma)
      await prisma.user.delete({
        where: { id: userId }
      });

      return res.status(200).json({ success: true, message: 'Akun berhasil dihapus selamanya' });
    } catch (err) {
      console.error('Delete account error:', err);
      return res.status(500).json({ success: false, message: 'Gagal menghapus akun' });
    }
  }


  // GET /api/me — get current authenticated user
  async getMe(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // const authReq = req as any;
      // const userId = authReq.user?.id;
      // if (!userId) return res.status(401).send({ success: false, message: 'Unauthorized' });

      const userId = parseInt(id);
      const user = await authService.getMe(userId);
      // Gunakan id dari URL jika ada, kalau tidak ada pakai userId dari token
      // const user = await authService.getMe(id || userId);
      if (!user) return res.status(404).send({ success: false, message: 'User tidak ditemukan' });

      return res.status(200).send({
        success: true,
        message: 'success',
        data: {
          ...userResponse(user),
          subscription: user.subscriptions[0] || null,
          balance: user.balance?.balance || 0,
          referralCode: user.referralCode,
          commissions: user.commissionsEarned,
        }
      });
    } catch (err) {
      console.error('Get me error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengambil data user' });
    }}}
