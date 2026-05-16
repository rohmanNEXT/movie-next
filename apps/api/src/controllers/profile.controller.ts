import { Request, Response } from 'express';
import prisma from '@/prisma';
import type { AuthRequest } from '@/middlewares/auth.middleware';

export class ProfileController {
  // GET /api/profile
  async getProfile(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });

      if (!user) return res.status(404).send({ success: false, message: 'User tidak ditemukan' });

      // Format response to flat structure for frontend convenience
      const data = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.profile?.fullName,
        city: user.profile?.city,
        country: user.profile?.country,
        phoneNumber: user.profile?.phoneNumber,
        avatar: user.profile?.avatar,
        role: user.role,
      };

      return res.status(200).send({ success: true, data, message: 'success' });
    } catch (err) {
      console.error('Get profile error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengambil data profil' });
    }
  }

  // PATCH /api/profile
  async updateProfile(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const { fullName, username, city, country, email, avatar, phoneNumber } = req.body;

      const avatarPath = req.file ? `/uploads/${req.file.filename}` : avatar;

      // Check if username/email already taken by another user
      if (username || email) {
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              username ? { username } : {},
              email ? { email } : {},
            ],
            NOT: { id: userId }
          }
        });

        if (existing) {
          return res.status(409).send({ success: false, message: 'Username atau Email sudah digunakan' });
        }
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          username,
          email,
          profile: {
            upsert: {
              create: { fullName, city, country, avatar: avatarPath, phoneNumber },
              update: { fullName, city, country, avatar: avatarPath, phoneNumber }
            }
          }
        },
        include: { profile: true }
      });

      const data = {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        fullName: updated.profile?.fullName,
        city: updated.profile?.city,
        country: updated.profile?.country,
        phoneNumber: updated.profile?.phoneNumber,
        avatar: updated.profile?.avatar,
        role: updated.role,
      };

      return res.status(200).send({ success: true, data, message: 'Profil berhasil diperbarui' });
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).send({ success: false, message: 'Gagal memperbarui profil' });
    }
  }
}
