import { Queue, Worker } from 'bullmq';
import {
  TutorProfileModel,
  StudentProfileModel,
  prisma,
  NotificationModel,
  ConversationModel,
  MessageModel,
  RequirementModel,
  BookingModel,
  ContractModel,
} from 'database';
import { getIO } from '../../socket/socket.gateway.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = {
  url: REDIS_URL,
  maxRetriesPerRequest: null,
};

export const notificationQueue = new Queue('notification-queue', { connection });

// Schedule repeatable job to run every 5 minutes
notificationQueue
  .add(
    'check-upcoming-classes',
    { type: 'CHECK_UPCOMING_CLASSES', data: {} },
    {
      repeat: { every: 5 * 60 * 1000 }, // every 5 minutes
      jobId: 'check-upcoming-classes-job',
    }
  )
  .then(() => {
    console.log('[NotificationQueue] Repeatable class reminders check registered.');
  })
  .catch((err) => {
    console.error('[NotificationQueue] Failed to register class reminders check:', err);
  });

// Schedule repeatable job to surface sessions left unconfirmed past their scheduled end time
notificationQueue
  .add(
    'check-overdue-sessions',
    { type: 'CHECK_OVERDUE_SESSIONS', data: {} },
    {
      repeat: { every: 15 * 60 * 1000 }, // every 15 minutes
      jobId: 'check-overdue-sessions-job',
    }
  )
  .then(() => {
    console.log('[NotificationQueue] Repeatable overdue session check registered.');
  })
  .catch((err) => {
    console.error('[NotificationQueue] Failed to register overdue session check:', err);
  });

// Schedule repeatable job to finalize contract terminations once their notice period elapses
notificationQueue
  .add(
    'check-contract-terminations',
    { type: 'CHECK_CONTRACT_TERMINATIONS', data: {} },
    {
      repeat: { every: 15 * 60 * 1000 }, // every 15 minutes
      jobId: 'check-contract-terminations-job',
    }
  )
  .then(() => {
    console.log('[NotificationQueue] Repeatable contract termination check registered.');
  })
  .catch((err) => {
    console.error('[NotificationQueue] Failed to register contract termination check:', err);
  });

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
          console.log(
            `[NotificationQueue] User ${userId} has already completed profile. Skipping completeness notification.`
          );
          return;
        }

        // 4. Create Notification
        const leftPercent = 100 - completeness;
        await NotificationModel.create({
          userId,
          title: 'Complete your profile!',
          content: `Complete your profile, only ${leftPercent}% left! Get more chance of getting ${targetText}.`,
          type: 'PROFILE_COMPLETENESS',
          data: { completeness, leftPercent },
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
          console.log(
            `[NotificationQueue] Conversation for requirement ${requirementId} already has messages. Skipping chat reminder.`
          );
          return;
        }

        // 3. Send notification to student
        await NotificationModel.create({
          userId: studentUserId,
          title: 'Start the conversation!',
          content: 'Message your accepted tutor now to schedule your first class!',
          type: 'CHAT_REMINDER',
          data: { requirementId, otherPartyId: tutorUserId },
        });

        // 4. Send notification to tutor
        await NotificationModel.create({
          userId: tutorUserId,
          title: 'Start the conversation!',
          content: 'Message your accepted student now to schedule your first class!',
          type: 'CHAT_REMINDER',
          data: { requirementId, otherPartyId: studentUserId },
        });

        console.log(
          `[NotificationQueue] Sent chat reminder notifications to student ${studentUserId} and tutor ${tutorUserId}`
        );
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
          isDeleted: { $ne: true },
        });

        if (matches === 0) {
          console.log(
            `[NotificationQueue] No new matching requirements for tutor ${tutorUserId}. Skipping.`
          );
          return;
        }

        // 3. Send notification to tutor
        await NotificationModel.create({
          userId: tutorUserId,
          title: 'New match requirements!',
          content: `${matches} new student requirements match your job profile. Apply now to get hired!`,
          type: 'NEW_REQUIREMENTS',
          data: { matches },
        });

        console.log(
          `[NotificationQueue] Sent matched requirements notification to tutor ${tutorUserId}`
        );
      } else if (type === 'NEW_TUTOR_REGISTERED_MATCH') {
        const { tutorUserId } = data;

        // 1. Fetch tutor name
        const tutorUser = await prisma.user.findUnique({
          where: { id: tutorUserId },
          select: { name: true },
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
          isDeleted: { $ne: true },
        });

        // 4. Notify each requirement student owner
        for (const req of matchingReqs) {
          const subjectName = req.curriculum?.subject || req.category;
          await NotificationModel.create({
            userId: req.studentUserId,
            title: 'New matching tutor available!',
            content: `A new tutor, ${tutorUser.name}, matches your requirement for ${subjectName}. View their profile and invite them now!`,
            type: 'NEW_TUTOR_MATCH',
            data: { tutorUserId, requirementId: req._id },
          });
        }
        console.log(
          `[NotificationQueue] Dispatched matches notification for new tutor ${tutorUserId} to ${matchingReqs.length} students`
        );
      } else if (type === 'CHECK_UPCOMING_CLASSES') {
        console.log('[NotificationQueue] Running upcoming class reminders check...');
        const now = new Date();
        const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

        // Find all accepted sessions scheduled within the next 30 minutes
        const upcomingBookings = await BookingModel.find({
          status: 'ACCEPTED',
          scheduledAt: { $gte: now, $lte: thirtyMinutesLater },
        });

        console.log(
          `[NotificationQueue] Found ${upcomingBookings.length} confirmed classes scheduled within the next 30 minutes.`
        );

        for (const booking of upcomingBookings) {
          const bookingId = booking._id.toString();

          // Check if we have already sent reminders for this class
          const exists = await NotificationModel.exists({
            type: 'CLASS_REMINDER',
            'data.bookingId': bookingId,
          });

          if (exists) {
            console.log(
              `[NotificationQueue] Reminders for class ${bookingId} already dispatched. Skipping.`
            );
            continue;
          }

          // Fetch student and tutor details to construct the messages
          const studentUser = await prisma.user.findUnique({
            where: { id: booking.studentUserId },
            select: { name: true },
          });

          const tutorUser = await prisma.user.findUnique({
            where: { id: booking.tutorUserId },
            select: { name: true },
          });

          const formattedTime = new Date(booking.scheduledAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const linkText =
            booking.sessionMode === 'ONLINE' && booking.meetingLink
              ? ` Join here: ${booking.meetingLink}`
              : '';

          // Create notification for student
          await NotificationModel.create({
            userId: booking.studentUserId,
            title: 'Upcoming Class Reminder',
            content: `Your class with tutor ${tutorUser?.name || 'your tutor'} is starting soon at ${formattedTime}!${linkText}`,
            type: 'CLASS_REMINDER',
            data: { bookingId },
          });

          // Create notification for tutor
          await NotificationModel.create({
            userId: booking.tutorUserId,
            title: 'Upcoming Class Reminder',
            content: `Your class with student ${studentUser?.name || 'your student'} is starting soon at ${formattedTime}!${linkText}`,
            type: 'CLASS_REMINDER',
            data: { bookingId },
          });

          console.log(
            `[NotificationQueue] Dispatched class reminders for booking ${bookingId} to student and tutor.`
          );
        }
      } else if (type === 'CHECK_OVERDUE_SESSIONS') {
        console.log('[NotificationQueue] Running overdue session check...');
        const now = new Date();
        // Accepted sessions can be marked complete anytime once started; give a grace window
        // past the scheduled start before nudging both parties to confirm or report a no-show.
        const graceCutoff = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour grace

        const overdueBookings = await BookingModel.find({
          status: 'ACCEPTED',
          scheduledAt: { $lte: graceCutoff },
        });

        console.log(
          `[NotificationQueue] Found ${overdueBookings.length} overdue ACCEPTED sessions.`
        );

        for (const booking of overdueBookings) {
          const bookingId = booking._id.toString();

          const exists = await NotificationModel.exists({
            type: 'SESSION_CONFIRMATION_NEEDED',
            'data.bookingId': bookingId,
          });
          if (exists) continue;

          const sessionLabel = booking.isFirstSession ? 'Trial Class' : 'Regular Session';
          const content = `Your ${sessionLabel} scheduled on ${new Date(booking.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} has passed. Please mark it complete, or report a no-show if it didn't happen.`;

          await NotificationModel.create({
            userId: booking.studentUserId,
            title: 'Confirm Your Session',
            content,
            type: 'SESSION_CONFIRMATION_NEEDED',
            data: { bookingId },
          });
          await NotificationModel.create({
            userId: booking.tutorUserId,
            title: 'Confirm Your Session',
            content,
            type: 'SESSION_CONFIRMATION_NEEDED',
            data: { bookingId },
          });

          console.log(
            `[NotificationQueue] Nudged both parties to confirm/report booking ${bookingId}.`
          );
        }
      } else if (type === 'CHECK_CONTRACT_TERMINATIONS') {
        console.log('[NotificationQueue] Running contract termination check...');
        const now = new Date();

        const dueContracts = await ContractModel.find({
          status: 'TERMINATING',
          terminationEffectiveAt: { $lte: now },
        });

        console.log(
          `[NotificationQueue] Found ${dueContracts.length} contracts due for termination.`
        );

        for (const contract of dueContracts) {
          contract.status = 'TERMINATED';
          await contract.save();

          for (const userId of [contract.studentUserId, contract.tutorUserId]) {
            await NotificationModel.create({
              userId,
              title: 'Contract Terminated',
              content: `The tutoring agreement for ${contract.subject} has ended — the 7-day notice period is over.`,
              type: 'CONTRACT_TERMINATED',
              data: { contractId: contract._id },
            });
          }

          const convo = await ConversationModel.findOne({
            $or: [
              { studentUserId: contract.studentUserId, tutorUserId: contract.tutorUserId },
              { studentUserId: contract.tutorUserId, tutorUserId: contract.studentUserId },
            ],
          });
          if (convo) {
            const chatMessage = await MessageModel.create({
              conversationId: convo._id,
              senderUserId: contract.terminationRequestedBy || contract.studentUserId,
              content: `STATUS_UPDATE:${contract._id}:CONTRACT_TERMINATED:🚫 Tutoring Agreement for ${contract.subject} has ended (notice period complete)`,
              seen: false,
            });
            convo.lastMessage = `🚫 Agreement terminated (${contract.subject})`;
            convo.lastMessageAt = new Date();
            await convo.save();

            const io = getIO();
            if (io) {
              const msgObj = chatMessage.toObject();
              io.to(`room:${convo._id}`).emit('new_message', msgObj);
              io.to(`user:${contract.studentUserId}`).emit('message_notification', msgObj);
              io.to(`user:${contract.tutorUserId}`).emit('message_notification', msgObj);
            }
          }

          console.log(`[NotificationQueue] Finalized termination for contract ${contract._id}.`);
        }
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
