import { Queue, Worker } from 'bullmq';
import { TutorProfileModel, StudentProfileModel, prisma } from 'database';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = {
  url: REDIS_URL,
  maxRetriesPerRequest: null,
};

export const profileCompletenessQueue = new Queue('profile-completeness-queue', { connection });

// Helper to calculate Tutor completeness
function calculateTutorCompleteness(profile: any, user: any): number {
  let score = 0;
  if (profile.bio && profile.bio.trim().length >= 50) score += 20;
  if (profile.subjects && profile.subjects.length > 0) score += 20;
  if (profile.qualifications && profile.qualifications.length > 0) score += 15;
  if (profile.availability && profile.availability.length > 0) score += 10;
  if (profile.languages && profile.languages.length > 0) score += 10;
  if (profile.pricing && profile.pricing.min > 0) score += 10;
  if (profile.location && profile.location.city && profile.location.area) score += 10;
  
  // Optional/Bonus items (can boost/cap at 100)
  if (user?.avatarUrl || profile.avatarUrl) score += 5;
  if (profile.introVideoUrl) score += 5;
  if (profile.qualifications && profile.qualifications.some((q: any) => q.certificateUrl)) score += 5;
  if (profile.qa && profile.qa.length >= 2) score += 10;

  return Math.min(100, score);
}

// Helper to calculate Student completeness
function calculateStudentCompleteness(profile: any, user: any): number {
  let score = 0;
  if (profile.school && profile.school.trim()) score += 20;
  if (profile.class && profile.class.trim()) score += 20;
  if (profile.preferredLanguage && profile.preferredLanguage.trim()) score += 20;
  if (profile.learningMode) score += 20;
  if (profile.city && profile.city.trim()) score += 15;
  
  // Optional/Bonus items
  if (user?.avatarUrl || profile.avatarUrl) score += 5;

  return Math.min(100, score);
}

export const profileCompletenessWorker = new Worker(
  'profile-completeness-queue',
  async (job: any) => {
    const { userId, role } = job.data;
    console.log(`[Queue] Calculating profile completeness for ${role} user: ${userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      });

      if (role === 'TUTOR') {
        const profile = await TutorProfileModel.findOne({ userId });
        if (!profile) {
          console.warn(`[Queue] Tutor profile not found for userId: ${userId}`);
          return;
        }

        const completeness = calculateTutorCompleteness(profile, user);
        profile.profileCompleteness = completeness;
        await profile.save();
        console.log(`[Queue] Updated Tutor completeness: ${completeness}%`);
      } else if (role === 'STUDENT') {
        const profile = await StudentProfileModel.findOne({ userId });
        if (!profile) {
          console.warn(`[Queue] Student profile not found for userId: ${userId}`);
          return;
        }

        const completeness = calculateStudentCompleteness(profile, user);
        profile.profileCompleteness = completeness;
        await profile.save();
        console.log(`[Queue] Updated Student completeness: ${completeness}%`);
      }
    } catch (err) {
      console.error(`[Queue] Failed to calculate completeness for user ${userId}:`, err);
      throw err;
    }
  },
  { connection }
);

profileCompletenessWorker.on('completed', (job) => {
  console.log(`[Queue] Completeness job ${job.id} completed successfully`);
});

profileCompletenessWorker.on('failed', (job, err) => {
  console.error(`[Queue] Completeness job ${job?.id} failed:`, err);
});
