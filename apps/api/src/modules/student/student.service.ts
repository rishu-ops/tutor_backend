/* eslint-disable @typescript-eslint/no-explicit-any */
import { StudentRepository } from './student.repository.js';
import { prisma, StudentProfileModel, RequirementModel } from 'database';

export class StudentService {
  private repository = new StudentRepository();

  async getProfile(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Student profile not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Load user name and email from PostgreSQL for full profile view
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    return {
      ...profile.toObject(),
      name: user?.name || null,
      email: user?.email || null,
    };
  }

  async getPublicProfile(userId: string) {
    const profile = await StudentProfileModel.findOne({ userId });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, city: true },
    });

    const activeRequirements = await RequirementModel.find({
      studentUserId: userId,
      status: 'OPEN',
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    return {
      userId,
      name: user?.name || 'Anonymous Student',
      email: user?.email || null,
      phone: user?.phone || null,
      city: user?.city || profile?.city || null,
      school: profile?.school || null,
      class: profile?.class || null,
      preferredLanguage: profile?.preferredLanguage || null,
      learningMode: profile?.learningMode || null,
      activeRequirements,
    };
  }

  async updateProfile(userId: string, data: any) {
    const { name, city, ...profileFields } = data;

    // 1. Update PostgreSQL User name/city if changed
    const userUpdateData: any = {};
    if (name !== undefined) userUpdateData.name = name;
    if (city !== undefined) userUpdateData.city = city;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // 2. Update MongoDB Student Profile fields
    const updateData = { ...profileFields };
    if (city !== undefined) updateData.city = city;

    const profile = await this.repository.updateByUserId(userId, updateData);
    if (!profile) {
      const err = new Error('Student profile not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Return merged profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    return {
      ...profile.toObject(),
      name: user?.name || null,
      email: user?.email || null,
    };
  }
}
