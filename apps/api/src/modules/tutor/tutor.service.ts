/* eslint-disable @typescript-eslint/no-explicit-any */
import { TutorRepository } from './tutor.repository.js';
import { prisma } from 'database';

export class TutorService {
  private repository = new TutorRepository();

  private calculateCompleteness(profile: any): number {
    let completeness = 0;
    if (profile.bio && profile.bio.length >= 50) completeness += 20;
    if (profile.subjects && profile.subjects.length > 0) completeness += 20;
    if (profile.qualifications && profile.qualifications.length > 0) completeness += 15;
    if (profile.availability && profile.availability.length > 0) completeness += 10;
    if (profile.languages && profile.languages.length > 0) completeness += 10;
    if (profile.pricing && profile.pricing.min > 0) completeness += 10;
    if (profile.location && profile.location.city && profile.location.area) completeness += 10;
    // Profile photo: future (5%)
    return completeness;
  }

  async getProfile(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Tutor profile not found');
      (err as any).statusCode = 404;
      throw err;
    }

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

  async updateProfile(userId: string, data: any) {
    const { name, ...profileFields } = data;

    // 1. Update PostgreSQL User name/city if changed
    const userUpdateData: any = {};
    if (name !== undefined) userUpdateData.name = name;
    if (profileFields.location?.city !== undefined) {
      userUpdateData.city = profileFields.location.city;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // 2. Load current profile first to recalculate completeness accurately
    const currentProfile = await this.repository.findByUserId(userId);
    if (!currentProfile) {
      const err = new Error('Tutor profile not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // 3. Prepare updated data (merging inputs)
    const mergedProfileData = {
      ...currentProfile.toObject(),
      ...profileFields,
    };

    const completeness = this.calculateCompleteness(mergedProfileData);

    const updateData = {
      ...profileFields,
      profileCompleteness: completeness,
    };

    const profile = await this.repository.updateByUserId(userId, updateData);
    if (!profile) {
      const err = new Error('Tutor profile not found');
      (err as any).statusCode = 404;
      throw err;
    }

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
