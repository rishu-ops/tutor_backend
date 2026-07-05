import { prisma } from 'database';

export class AuthRepository {
  async findUserByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  async createUser(phone: string) {
    return prisma.user.create({
      data: {
        phone,
        isPhoneVerified: true,
      },
    });
  }

  async createSession(data: {
    userId: string;
    refreshTokenHash: string;
    deviceName?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresAt: Date;
  }) {
    return prisma.session.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        deviceName: data.deviceName,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findSessionByHash(refreshTokenHash: string) {
    return prisma.session.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });
  }

  async revokeSessionByHash(refreshTokenHash: string) {
    return prisma.session.update({
      where: { refreshTokenHash },
      data: { revokedAt: new Date() },
    });
  }
}
