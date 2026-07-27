/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, StudentProfileModel, TutorProfileModel } from 'database';
import { profileCompletenessQueue } from './profile.queue.js';
import { notificationQueue } from '../notifications/notification.queue.js';
import { OnboardingInput } from './onboarding.validation.js';

export class OnboardingService {
  // Calculate completeness for tutor profile
  private calculateTutorCompleteness(input: any): number {
    let completeness = 0;
    if (input.bio && input.bio.length >= 50) completeness += 20;
    if (input.subjects && input.subjects.length > 0) completeness += 20;
    if (input.qualifications && input.qualifications.length > 0) completeness += 15;
    if (input.availability && input.availability.length > 0) completeness += 10;
    if (input.languages && input.languages.length > 0) completeness += 10;
    if (input.pricing && input.pricing.min > 0) completeness += 10;
    if (input.location && input.location.city && input.location.area) completeness += 10;
    if (input.avatarUrl) completeness += 5;
    if (input.introVideoUrl) completeness += 5;
    if (input.qualifications && input.qualifications.some((q: any) => q.certificateUrl)) completeness += 5;
    return Math.min(100, completeness);
  }

  async onboardUser(userId: string, input: OnboardingInput) {
    // 1. Fetch user from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const err = new Error('User not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (user.role) {
      const err = new Error('Onboarding has already been completed for this user');
      (err as any).statusCode = 409;
      throw err;
    }

    if (input.role === 'STUDENT') {
      // 2. Check if student profile exists
      const existingProfile = await StudentProfileModel.findOne({ userId });
      if (existingProfile) {
        const err = new Error('Student profile already exists');
        (err as any).statusCode = 409;
        throw err;
      }

      // 3. Create Student Profile in MongoDB
      const profile = new StudentProfileModel({
        userId,
        school: input.school,
        class: input.class,
        preferredLanguage: input.preferredLanguage,
        learningMode: input.learningMode,
        city: input.city,
      });
      await profile.save();

      // 4. Update user in PostgreSQL
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: 'STUDENT',
          name: input.name,
          city: input.city,
          avatarUrl: input.avatarUrl,
        },
      });

      profileCompletenessQueue.add('calculate-completeness', { userId, role: 'STUDENT' }).catch(err => {
        console.error('Failed to queue student completeness task:', err);
      });

      notificationQueue.add('profile-completeness-reminder', {
        type: 'PROFILE_COMPLETENESS_REMINDER',
        data: { userId, role: 'STUDENT' }
      }, { delay: 15000 }).catch(err => {
        console.error('Failed to queue student completeness reminder:', err);
      });

      return { profile };
    } else if (input.role === 'TUTOR') {
      // 2. Check if tutor profile exists
      const existingProfile = await TutorProfileModel.findOne({ userId });
      if (existingProfile) {
        const err = new Error('Tutor profile already exists');
        (err as any).statusCode = 409;
        throw err;
      }

      const completeness = this.calculateTutorCompleteness(input);

      // 3. Create Tutor Profile in MongoDB
      const profile = new TutorProfileModel({
        userId,
        bio: input.bio,
        subjects: input.subjects,
        qualifications: (input as any).qualifications || [],
        teachingModes: input.teachingModes,
        languages: input.languages,
        pricing: input.pricing,
        location: {
          city: input.location.city,
          area: input.location.area,
        },
        availability: (input as any).availability || [],
        introVideoUrl: (input as any).introVideoUrl || undefined,
        profileCompleteness: completeness,
        verificationStatus: 'PENDING',
        visibilityTier: 'FREE',
      });
      await profile.save();

      // 4. Update user in PostgreSQL
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: 'TUTOR',
          name: input.name,
          city: input.location.city,
          avatarUrl: input.avatarUrl || null,
        },
      });

      profileCompletenessQueue.add('calculate-completeness', { userId, role: 'TUTOR' }).catch(err => {
        console.error('Failed to queue tutor completeness task:', err);
      });

      notificationQueue.add('profile-completeness-reminder', {
        type: 'PROFILE_COMPLETENESS_REMINDER',
        data: { userId, role: 'TUTOR' }
      }, { delay: 15000 }).catch(err => {
        console.error('Failed to queue tutor completeness reminder:', err);
      });

      notificationQueue.add('new-requirements-match', {
        type: 'NEW_REQUIREMENTS_MATCH',
        data: { tutorUserId: userId }
      }, { delay: 10000 }).catch(err => {
        console.error('Failed to enqueue matched requirements check:', err);
      });

      notificationQueue.add('new-tutor-registered-match', {
        type: 'NEW_TUTOR_REGISTERED_MATCH',
        data: { tutorUserId: userId }
      }, { delay: 10000 }).catch(err => {
        console.error('Failed to enqueue new tutor matched check:', err);
      });

      return { profile };
    } else {
      const err = new Error('Invalid onboarding role');
      (err as any).statusCode = 400;
      throw err;
    }
  }
}
