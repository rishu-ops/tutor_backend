/* eslint-disable @typescript-eslint/no-explicit-any */
import { TutorRepository } from './tutor.repository.js';
import { prisma } from 'database';
import { profileCompletenessQueue } from '../onboarding/profile.queue.js';
import { notificationQueue } from '../notifications/notification.queue.js';

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
    if (profile.avatarUrl) completeness += 5;
    if (profile.introVideoUrl) completeness += 5;
    if (profile.qualifications && profile.qualifications.some((q: any) => q.certificateUrl)) completeness += 5;
    return Math.min(100, completeness);
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
      select: { name: true, email: true, avatarUrl: true },
    });

    let completeness = profile.profileCompleteness;
    if (!completeness || completeness === 0) {
      completeness = 0;
      if (profile.bio && profile.bio.trim().length >= 50) completeness += 20;
      if (profile.subjects && profile.subjects.length > 0) completeness += 20;
      if (profile.qualifications && profile.qualifications.length > 0) completeness += 15;
      if (profile.availability && profile.availability.length > 0) completeness += 10;
      if (profile.languages && profile.languages.length > 0) completeness += 10;
      if (profile.pricing && profile.pricing.min > 0) completeness += 10;
      if (profile.location && profile.location.city && profile.location.area) completeness += 10;
      if (user?.avatarUrl || profile.avatarUrl) completeness += 5;
      if (profile.introVideoUrl) completeness += 5;
      if (profile.qualifications && profile.qualifications.some((q: any) => q.certificateUrl)) completeness += 5;
      if (profile.qa && profile.qa.length >= 2) completeness += 10;
      completeness = Math.min(100, completeness);

      profile.profileCompleteness = completeness;
      await profile.save();
    }

    return {
      ...profile.toObject(),
      profileCompleteness: completeness,
      name: user?.name || null,
      email: user?.email || null,
      avatarUrl: user?.avatarUrl || null,
    };
  }

  async getPublicProfile(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Tutor profile not found');
      (err as any).statusCode = 404;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, avatarUrl: true },
    });

    return {
      userId,
      name: user?.name || 'Anonymous Tutor',
      avatarUrl: user?.avatarUrl || null,
      bio: profile.bio || '',
      subjects: profile.subjects || [],
      qualifications: profile.qualifications || [],
      experience: profile.experience || [],
      availability: profile.availability || [],
      languages: profile.languages || [],
      teachingModes: profile.teachingModes || [],
      pricing: profile.pricing || { min: 0, max: 0 },
      location: profile.location || { city: '', area: '' },
      ratingAvg: profile.ratingAvg || 5.0,
      profileCompleteness: profile.profileCompleteness || 0,
      introVideoUrl: profile.introVideoUrl || null,
    };
  }

  async updateProfile(userId: string, data: any) {
    const { name, avatarUrl, ...profileFields } = data;

    // 1. Update PostgreSQL User name/city/avatarUrl if changed
    const userUpdateData: any = {};
    if (name !== undefined) userUpdateData.name = name;
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, avatarUrl: true },
    });

    const completeness = this.calculateCompleteness({
      ...mergedProfileData,
      avatarUrl: user?.avatarUrl,
    });

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

    profileCompletenessQueue.add('calculate-completeness', { userId, role: 'TUTOR' }).catch(err => {
      console.error('Failed to queue tutor completeness task on update:', err);
    });

    notificationQueue.add('profile-completeness-reminder', {
      type: 'PROFILE_COMPLETENESS_REMINDER',
      data: { userId, role: 'TUTOR' }
    }, { delay: 15000 }).catch(err => {
      console.error('Failed to queue tutor completeness reminder on update:', err);
    });

    return {
      ...profile.toObject(),
      name: user?.name || null,
      email: user?.email || null,
      avatarUrl: user?.avatarUrl || null,
    };
  }
}
