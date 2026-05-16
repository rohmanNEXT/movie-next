import prisma from '@/prisma';

export class AuthService {
  async getMe(userId: number) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        profile: true,
        subscriptions: { where: { isActive: true }, include: { package: true }, take: 1 },
        balance: true,
        commissionsEarned: true,
      },
    });
  }
}

export const authService = new AuthService();
