import { Queue, Worker } from 'bullmq';
import { TutorProfileModel, StudentProfileModel, prisma, NotificationModel, ConversationModel, MessageModel, RequirementModel } from 'database';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = {
  url: REDIS_URL,
  maxRetriesPerRequest: null,
};

export const notificationQueue = new Queue('notification-queue', { connection });

export const notificationWorker = new Worker(
  'notification-queue',
  async (job: any) => {
    const { type, data } = job.data;
    console.log(`[NotificationQueue] Processing job: ${type} for data:`, data);

    try {
      if (type === 'PROFILE_COMPLETENESS_REMINDER') {
        const { userId, role } = data;

        // 1. Fetch user to check role & avatar
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { avatarUrl: true },
        });
        if (!user) return;

        // 2. Fetch and check completeness
        let completeness = 0;
        let targetText = 'tutors';

        if (role === 'TUTOR') {
          const profile = await TutorProfileModel.findOne({ userId });
          if (!profile) return;
          completeness = profile.profileCompleteness || 0;
          targetText = 'students';
        } else if (role === 'STUDENT') {
          const profile = await StudentProfileModel.findOne({ userId });
          if (!profile) return;
          completeness = profile.profileCompleteness || 0;
          targetText = 'tutors';
        }

        // 3. Skip if already completed to 100%!
        if (completeness >= 100) {
          console.log(`[NotificationQueue] User ${userId} has already completed profile. Skipping completeness notification.`);
          return;
        }

        // 4. Create Notification
        const leftPercent = 100 - completeness;
        await NotificationModel.create({
          userId,
          title: 'Complete your profile!',
          content: `Complete your profile, only ${leftPercent}% left! Get more chance of getting ${targetText}.`,
          type: 'PROFILE_COMPLETENESS',
          data: { completeness, leftPercent }
        });
        console.log(`[NotificationQueue] Dispatched completeness notification to user ${userId}`);

      } else if (type === 'MATCHED_CHAT_REMINDER') {
        const { requirementId, studentUserId, tutorUserId } = data;

        // 1. Look up conversation for this requirement
        const conversation = await ConversationModel.findOne({ requirementId });
        let hasMessages = false;

        if (conversation) {
          const msgCount = await MessageModel.countDocuments({ conversationId: conversation._id });
          if (msgCount > 0) {
            hasMessages = true;
          }
        }

        // 2. Skip if they already started chatting!
        if (hasMessages) {
          console.log(`[NotificationQueue] Conversation for requirement ${requirementId} already has messages. Skipping chat reminder.`);
          return;
        }

        // 3. Send notification to student
        await NotificationModel.create({
          userId: studentUserId,
          title: 'Start the conversation!',
          content: 'Message your accepted tutor now to schedule your first class!',
          type: 'CHAT_REMINDER',
          data: { requirementId, otherPartyId: tutorUserId }
        });

        // 4. Send notification to tutor
        await NotificationModel.create({
          userId: tutorUserId,
          title: 'Start the conversation!',
          content: 'Message your accepted student now to schedule your first class!',
          type: 'CHAT_REMINDER',
          data: { requirementId, otherPartyId: studentUserId }
        });

        console.log(`[NotificationQueue] Sent chat reminder notifications to student ${studentUserId} and tutor ${tutorUserId}`);

      } else if (type === 'NEW_REQUIREMENTS_MATCH') {
        const { tutorUserId } = data;

        // 1. Fetch tutor profile
        const tutorProfile = await TutorProfileModel.findOne({ userId: tutorUserId });
        if (!tutorProfile || !tutorProfile.subjects || tutorProfile.subjects.length === 0) return;

        // 2. Query matching requirements
        const matches = await RequirementModel.countDocuments({
          status: 'OPEN',
          'curriculum.subject': { $in: tutorProfile.subjects },
          studentUserId: { $ne: tutorUserId },
          isDeleted: { $ne: true }
        });

        if (matches === 0) {
          console.log(`[NotificationQueue] No new matching requirements for tutor ${tutorUserId}. Skipping.`);
          return;
        }

        // 3. Send notification to tutor
        await NotificationModel.create({
          userId: tutorUserId,
          title: 'New match requirements!',
          content: `${matches} new student requirements match your job profile. Apply now to get hired!`,
          type: 'NEW_REQUIREMENTS',
          data: { matches }
        });

        console.log(`[NotificationQueue] Sent matched requirements notification to tutor ${tutorUserId}`);

      } else if (type === 'NEW_TUTOR_REGISTERED_MATCH') {
        const { tutorUserId } = data;

        // 1. Fetch tutor name
        const tutorUser = await prisma.user.findUnique({
          where: { id: tutorUserId },
          select: { name: true }
        });
        if (!tutorUser) return;

        // 2. Fetch tutor profile
        const tutorProfile = await TutorProfileModel.findOne({ userId: tutorUserId });
        if (!tutorProfile || !tutorProfile.subjects || tutorProfile.subjects.length === 0) return;

        // 3. Find matching open requirements
        const matchingReqs = await RequirementModel.find({
          status: 'OPEN',
          'curriculum.subject': { $in: tutorProfile.subjects },
          studentUserId: { $ne: tutorUserId },
          isDeleted: { $ne: true }
        });

        // 4. Notify each requirement student owner
        for (const req of matchingReqs) {
          const subjectName = req.curriculum?.subject || req.category;
          await NotificationModel.create({
            userId: req.studentUserId,
            title: 'New matching tutor available!',
            content: `A new tutor, ${tutorUser.name}, matches your requirement for ${subjectName}. View their profile and invite them now!`,
            type: 'NEW_TUTOR_MATCH',
            data: { tutorUserId, requirementId: req._id }
          });
        }
        console.log(`[NotificationQueue] Dispatched matches notification for new tutor ${tutorUserId} to ${matchingReqs.length} students`);
      }
    } catch (err) {
      console.error(`[NotificationQueue] Failed processing job:`, err);
      throw err;
    }
  },
  { connection }
);

notificationWorker.on('completed', (job) => {
  console.log(`[NotificationQueue] Job ${job.id} completed successfully`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[NotificationQueue] Job ${job?.id} failed:`, err);
});
