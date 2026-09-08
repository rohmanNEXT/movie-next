import prisma from '@/prisma';
import { GOOGLE_CLIENT_ID } from '@/config';
import { generateCryptoToken, hashPassword } from '@/utils/crypto';
import * as fs from 'fs';
import * as path from 'path';

export class AuthService {
  async getMe(userId: number) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscriptions: {
          where: { isActive: true },
          include: { package: true },
          take: 1,
        },
        balance: true,
        commissionsEarned: true,
      },
    });
  }

  async handleGoogleAuth(idToken: string, isRegister: boolean) {
    if (!idToken) {
      throw new Error('Google ID Token diperlukan');
    }

    // Verify Google token lewat Google's token informasi endpoint
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );
    if (!response.ok) {
      throw new Error('Token Google tidak valid');
    }

    const payload = (await response.json()) as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
      aud?: string;
    };

    if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
      throw new Error('Client ID tidak cocok');
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
        throw new Error(
          'Akun sudah terdaftar. Silakan pindah ke halaman Login.',
        );
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
                avatar: avatarPath || undefined,
              },
            },
          },
          include: { profile: true },
        });
      }
    } else {
      if (!isRegister) {
        throw new Error(
          'Akun belum terdaftar. Silakan mendaftar terlebih dahulu.',
        );
      }
      // Buat user baru, follow google username
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      const targetRole = 'user';
      const myReferralCode =
        targetRole === 'user'
          ? Math.random().toString(36).substring(2, 8).toUpperCase()
          : null;

      user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashPassword(generateCryptoToken(16)), // random password
          googleId,
          isVerified: true,
          role: targetRole,
          referralCode: myReferralCode,
          profile: {
            create: {
              fullName: name,
              avatar: avatarPath || undefined,
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
    }

    return user;
  }
}

export const authService = new AuthService();
