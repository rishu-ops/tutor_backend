/* eslint-disable @typescript-eslint/no-explicit-any */
import { StudentRepository } from './student.repository.js';
import { prisma, StudentProfileModel, RequirementModel } from 'database';
import { profileCompletenessQueue } from '../onboarding/profile.queue.js';
import { notificationQueue } from '../notifications/notification.queue.js';

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
      select: { name: true, email: true, avatarUrl: true },
    });

    let completeness = profile.profileCompleteness;
    if (!completeness || completeness === 0) {
      completeness = 0;
      if (profile.school && profile.school.trim()) completeness += 20;
      if (profile.class && profile.class.trim()) completeness += 20;
      if (profile.preferredLanguage && profile.preferredLanguage.trim()) completeness += 20;
      if (profile.learningMode) completeness += 20;
      if (profile.city && profile.city.trim()) completeness += 15;
      if (user?.avatarUrl || profile.avatarUrl) completeness += 5;
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
    const profile = await StudentProfileModel.findOne({ userId });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, city: true, avatarUrl: true },
    });

    const activeRequirements = await RequirementModel.find({
      studentUserId: userId,
      status: 'OPEN',
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    let completeness = profile?.profileCompleteness || 0;
    if (profile && (!completeness || completeness === 0)) {
      completeness = 0;
      if (profile.school && profile.school.trim()) completeness += 20;
      if (profile.class && profile.class.trim()) completeness += 20;
      if (profile.preferredLanguage && profile.preferredLanguage.trim()) completeness += 20;
      if (profile.learningMode) completeness += 20;
      if (profile.city && profile.city.trim()) completeness += 15;
      if (user?.avatarUrl) completeness += 5;
      completeness = Math.min(100, completeness);

      profile.profileCompleteness = completeness;
      await profile.save();
    }

    return {
      userId,
      name: user?.name || 'Anonymous Student',
      email: user?.email || null,
      phone: user?.phone || null,
      city: user?.city || profile?.city || null,
      avatarUrl: user?.avatarUrl || null,
      school: profile?.school || null,
      class: profile?.class || null,
      preferredLanguage: profile?.preferredLanguage || null,
      learningMode: profile?.learningMode || null,
      profileCompleteness: completeness,
      activeRequirements,
    };
  }

  async updateProfile(userId: string, data: any) {
    const { name, city, avatarUrl, ...profileFields } = data;

    // 1. Update PostgreSQL User name/city/avatarUrl if changed
    const userUpdateData: any = {};
    if (name !== undefined) userUpdateData.name = name;
    if (city !== undefined) userUpdateData.city = city;
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;

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

    profileCompletenessQueue.add('calculate-completeness', { userId, role: 'STUDENT' }).catch(err => {
      console.error('Failed to queue student completeness task on update:', err);
    });

    notificationQueue.add('profile-completeness-reminder', {
      type: 'PROFILE_COMPLETENESS_REMINDER',
      data: { userId, role: 'STUDENT' }
    }, { delay: 15000 }).catch(err => {
      console.error('Failed to queue student completeness reminder on update:', err);
    });

    // Return merged profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, avatarUrl: true },
    });

    return {
      ...profile.toObject(),
      name: user?.name || null,
      email: user?.email || null,
      avatarUrl: user?.avatarUrl || null,
    };
  }
}
