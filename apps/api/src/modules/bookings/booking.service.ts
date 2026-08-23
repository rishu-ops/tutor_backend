import {
  BookingModel,
  TutorProfileModel,
  prisma,
  NotificationModel,
  RequirementModel,
  MessageModel,
  ConversationModel,
  ReportModel,
} from 'database';
import { getIO } from '../../socket/socket.gateway.js';

// TutorProfile.teachingModes is stored as one of these three codes (see onboarding mapping).
// Booking.sessionMode uses 'ONSITE' rather than 'OFFLINE' for the same concept.
function tutorCapabilities(teachingModes: string[]): { online: boolean; onsite: boolean } {
  const modes = teachingModes || [];
  return {
    online: modes.includes('ONLINE') || modes.includes('HYBRID'),
    onsite: modes.includes('OFFLINE') || modes.includes('HYBRID'),
  };
}

export class BookingService {
  /**
   * Request a new session.
   * - sessionMode is explicit per-booking, validated against the tutor's actual capabilities
   * - Guards regular sessions behind a completed trial
   */
  async checkTimeConflict(
    tutorUserId: string,
    studentUserId: string,
    scheduledAt: Date,
    duration: number,
    excludeBookingId?: string
  ) {
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Fetch accepted bookings for either tutor or student within 24 hours of scheduled time
    const rangeStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const rangeEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const overlappingBookings = await BookingModel.find({
      _id: excludeBookingId ? { $ne: excludeBookingId } : { $exists: true },
      status: 'ACCEPTED',
      $or: [{ tutorUserId }, { studentUserId }],
      scheduledAt: { $gte: rangeStart, $lte: rangeEnd },
    });

    for (const b of overlappingBookings) {
      const bStart = new Date(b.scheduledAt).getTime();
      const bEnd = bStart + (b.duration || 60) * 60 * 1000;

      const reqStart = start.getTime();
      const reqEnd = end.getTime();

      // Math.max(start1, start2) < Math.min(end1, end2)
      if (Math.max(reqStart, bStart) < Math.min(reqEnd, bEnd)) {
        const isSelfTutor = b.tutorUserId === tutorUserId;
        const targetName = isSelfTutor ? 'tutor' : 'student';
        const formattedTime = new Date(b.scheduledAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const err = new Error(
          `Schedule Conflict: The ${targetName} already has an accepted class at this time (${formattedTime}). Please choose another time.`
        );
        (err as any).statusCode = 400;
        throw err;
      }
    }
  }

  async createBooking(data: {
    requirementId: string;
    creatorUserId: string;
    partnerUserId: string;
    scheduledAt: string | Date;
    duration?: number;
    isFirstSession: boolean;
    notes?: string;
    studentNeedsDemo?: boolean;
    sessionMode?: 'ONLINE' | 'ONSITE';
  }) {
    const creatorUser = await prisma.user.findUnique({ where: { id: data.creatorUserId } });
    if (!creatorUser) {
      const err = new Error('Creator user not found');
      (err as any).statusCode = 404;
      throw err;
    }

    let studentUserId: string;
    let tutorUserId: string;
    let isTutorCreator = false;

    if (creatorUser.role === 'TUTOR') {
      tutorUserId = data.creatorUserId;
      studentUserId = data.partnerUserId;
      isTutorCreator = true;
    } else {
      studentUserId = data.creatorUserId;
      tutorUserId = data.partnerUserId;
    }

    // --- Guard: partner must be a real user with the complementary role ---
    const partnerUser = await prisma.user.findUnique({ where: { id: data.partnerUserId } });
    const expectedPartnerRole = isTutorCreator ? 'STUDENT' : 'TUTOR';
    if (!partnerUser || partnerUser.role !== expectedPartnerRole) {
      const err = new Error('Partner user not found or has the wrong role for this booking.');
      (err as any).statusCode = 404;
      throw err;
    }

    // --- Guard: the two parties must already have a conversation together ---
    // Without this, any authenticated user could create a booking against a total
    // stranger just by guessing their user ID. Bookings should only ever follow an
    // existing chat relationship (matching/application, or a prior booking/contract).
    const existingConvo = await ConversationModel.findOne({
      $or: [
        { studentUserId, tutorUserId },
        { studentUserId: tutorUserId, tutorUserId: studentUserId },
      ],
    });
    if (!existingConvo) {
      const err = new Error(
        'You can only request a session with someone you already have a conversation with.'
      );
      (err as any).statusCode = 403;
      throw err;
    }

    // Check for schedule conflicts (block booking request if slot is already occupied)
    const duration = data.duration || 60;
    await this.checkTimeConflict(tutorUserId, studentUserId, new Date(data.scheduledAt), duration);

    // --- Resolve session mode from tutor profile ---
    // TutorProfile.teachingModes stores 'ONLINE' | 'OFFLINE' | 'HYBRID' (see onboarding mapping) —
    // this must NOT be compared against 'Online'/'Onsite', which were only ever raw checkbox
    // labels on the requirement-creation form and never match what's actually stored here.
    const tutorProfile = await TutorProfileModel.findOne({ userId: tutorUserId });
    const capable = tutorCapabilities(tutorProfile?.teachingModes || []);

    let sessionMode: 'ONLINE' | 'ONSITE';
    if (data.sessionMode) {
      if (data.sessionMode === 'ONLINE' && !capable.online) {
        const err = new Error('This tutor does not offer online sessions.');
        (err as any).statusCode = 400;
        throw err;
      }
      if (data.sessionMode === 'ONSITE' && !capable.onsite) {
        const err = new Error('This tutor does not offer onsite/in-person sessions.');
        (err as any).statusCode = 400;
        throw err;
      }
      sessionMode = data.sessionMode;
    } else if (capable.online && capable.onsite) {
      const err = new Error(
        'This tutor offers both online and onsite sessions — please specify which one this session is for.'
      );
      (err as any).statusCode = 400;
      throw err;
    } else {
      sessionMode = capable.onsite ? 'ONSITE' : 'ONLINE';
    }

    // --- Guard: cannot request regular session without completed trial ---
    const offersDemo = tutorProfile?.offersDemo !== false;
    if (!data.isFirstSession && offersDemo) {
      const completedTrial = await BookingModel.findOne({
        studentUserId: studentUserId,
        tutorUserId: tutorUserId,
        isFirstSession: true,
        status: 'COMPLETED',
      });
      const requirementSkipsDemo = data.studentNeedsDemo === false;

      if (!completedTrial && !requirementSkipsDemo) {
        const err = new Error(
          'A trial/demo session must be completed before booking regular sessions.'
        );
        (err as any).statusCode = 400;
        throw err;
      }
    }

    // --- Guard: tutor must offer demos if requesting trial ---
    if (data.isFirstSession && tutorProfile && !tutorProfile.offersDemo) {
      const err = new Error(
        'This tutor does not offer trial/demo classes. You can still message them to discuss directly.'
      );
      (err as any).statusCode = 400;
      throw err;
    }

    // Pre-fill location for onsite sessions from tutor profile
    const locationNote =
      sessionMode !== 'ONLINE' && tutorProfile?.location
        ? `${tutorProfile.location.area}, ${tutorProfile.location.city}`
        : '';

    // requirementId is frequently not a real Requirement _id in practice (see L11 on
    // the bug sheet) — a malformed id must fall back to the generic label, not crash.
    const requirement = await RequirementModel.findById(data.requirementId).catch(() => null);
    const subject = requirement?.curriculum?.subject || requirement?.category || 'Class Session';

    const booking = await BookingModel.create({
      requirementId: data.requirementId,
      studentUserId,
      tutorUserId,
      scheduledAt: new Date(data.scheduledAt),
      duration,
      sessionMode,
      isFirstSession: data.isFirstSession,
      status: 'PENDING',
      notes: data.notes || '',
      location: locationNote,
      requestedBy: data.creatorUserId,
      subject,
    });

    // Notify partner user & post interactive booking request card to chat
    try {
      const creatorName = creatorUser.name || (isTutorCreator ? 'Your tutor' : 'A student');
      const sessionLabel = data.isFirstSession ? 'Trial Class' : 'Regular Session';
      const recipientId = isTutorCreator ? studentUserId : tutorUserId;

      await NotificationModel.create({
        userId: recipientId,
        title: `New ${sessionLabel} Proposed`,
        content: `${creatorName} has scheduled a ${sessionLabel} on ${new Date(data.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at ${new Date(data.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Please review and accept it.`,
        type: 'BOOKING_REQUESTED',
        data: { bookingId: booking._id, requirementId: data.requirementId },
      });

      // Find or create active conversation shell
      let convo = await ConversationModel.findOne({
        $or: [
          { studentUserId, tutorUserId },
          { studentUserId: tutorUserId, tutorUserId: studentUserId },
        ],
      });

      if (!convo) {
        convo = await ConversationModel.create({
          studentUserId,
          tutorUserId,
          requirementId: data.requirementId || 'booking-init',
          applicationId: 'booking-' + Date.now(),
          status: 'ACTIVE',
        });
      } else if (convo.status === 'LOCKED') {
        convo.status = 'ACTIVE';
        await convo.save();
      }

      const scheduledDateStr = new Date(data.scheduledAt).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const scheduledTimeStr = new Date(data.scheduledAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const messageContent = `📅 BOOKING_REQUEST:${booking._id}:${subject}:${sessionLabel}:${scheduledDateStr} at ${scheduledTimeStr}:${data.notes || ''}`;

      const chatMessage = await MessageModel.create({
        conversationId: convo._id,
        senderUserId: data.creatorUserId,
        content: messageContent,
        seen: false,
      });

      convo.lastMessage = `📅 Requested ${sessionLabel} on ${scheduledDateStr} at ${scheduledTimeStr}`;
      convo.lastMessageAt = new Date();
      await convo.save();

      const io = getIO();
      if (io) {
        const msgObj = chatMessage.toObject();
        io.to(`room:${convo._id}`).emit('new_message', msgObj);
        io.to(`user:${studentUserId}`).emit('message_notification', msgObj);
        io.to(`user:${tutorUserId}`).emit('message_notification', msgObj);
      }
    } catch (err) {
      console.error('Failed to create booking notification / chat message:', err);
    }

    return booking;
  }

  /**
   * Get single booking with enriched other-party details
   */
  async getBooking(id: string, userId: string) {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      (err as any).statusCode = 404;
      throw err;
    }
    if (booking.studentUserId !== userId && booking.tutorUserId !== userId) {
      const err = new Error('Forbidden: Access denied');
      (err as any).statusCode = 403;
      throw err;
    }

    const otherUserId =
      booking.studentUserId === userId ? booking.tutorUserId : booking.studentUserId;
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { name: true, role: true, email: true, phone: true },
    });

    const requirement = await RequirementModel.findById(booking.requirementId);
    const subject = requirement?.curriculum?.subject || requirement?.category || 'Class Session';

    const tutorProfile = await TutorProfileModel.findOne({ userId: booking.tutorUserId });
    const coordinates =
      tutorProfile?.location?.lat && tutorProfile?.location?.lng
        ? { lat: tutorProfile.location.lat, lng: tutorProfile.location.lng }
        : undefined;
    const offersDemo = tutorProfile?.offersDemo !== false;

    return {
      ...booking.toObject(),
      subject,
      coordinates,
      offersDemo,
      otherParty: {
        id: otherUserId,
        name: otherUser?.name || 'Anonymous User',
        role: otherUser?.role || 'STUDENT',
        email: otherUser?.email,
        phone: otherUser?.phone,
      },
    };
  }

  /**
   * List all bookings for a user
   */
  async getBookings(userId: string) {
    const bookings = await BookingModel.find({
      $or: [{ studentUserId: userId }, { tutorUserId: userId }],
    }).sort({ scheduledAt: -1 });

    const enriched = [];
    for (const booking of bookings) {
      const otherUserId =
        booking.studentUserId === userId ? booking.tutorUserId : booking.studentUserId;
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { name: true, role: true, email: true, phone: true },
      });

      const requirement = await RequirementModel.findById(booking.requirementId);
      const subject = requirement?.curriculum?.subject || requirement?.category || 'Class Session';

      const tutorProfile = await TutorProfileModel.findOne({ userId: booking.tutorUserId });
      const coordinates =
        tutorProfile?.location?.lat && tutorProfile?.location?.lng
          ? { lat: tutorProfile.location.lat, lng: tutorProfile.location.lng }
          : undefined;
      const offersDemo = tutorProfile?.offersDemo !== false;

      enriched.push({
        ...booking.toObject(),
        subject,
        coordinates,
        offersDemo,
        otherParty: {
          id: otherUserId,
          name: otherUser?.name || 'Anonymous User',
          role: otherUser?.role || 'STUDENT',
          email: otherUser?.email,
          phone: otherUser?.phone,
        },
      });
    }
    return enriched;
  }

  /**
   * Update booking status — enforces the state machine:
   * - Only the non-requesting party can ACCEPT or DECLINE, and only from PENDING
   * - Either party can CANCEL (if PENDING or ACCEPTED, and not yet started)
   * - Either party can mark COMPLETE, but only from ACCEPTED and once the session's start time has passed
   * - NO_SHOW is handled separately via reportNoShow(), since it records who is reporting whom
   */
  async updateBookingStatus(
    id: string,
    status: string,
    userId: string,
    options?: { meetingLink?: string; declineReason?: string }
  ) {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      (err as any).statusCode = 404;
      throw err;
    }
    if (booking.studentUserId !== userId && booking.tutorUserId !== userId) {
      const err = new Error('Forbidden: Access denied');
      (err as any).statusCode = 403;
      throw err;
    }

    // State machine enforcement
    if (status === 'ACCEPTED' || status === 'DECLINED') {
      if (booking.status !== 'PENDING') {
        const err = new Error(
          `Cannot ${status.toLowerCase()} a booking with status: ${booking.status}`
        );
        (err as any).statusCode = 400;
        throw err;
      }
      // The accepting party must NOT be the one who requested it
      if (booking.requestedBy === userId) {
        const err = new Error('You cannot accept or decline a booking request that you initiated.');
        (err as any).statusCode = 403;
        throw err;
      }
    }
    if (status === 'COMPLETED') {
      if (booking.status !== 'ACCEPTED') {
        const err = new Error(`Cannot complete a booking with status: ${booking.status}`);
        (err as any).statusCode = 400;
        throw err;
      }
      if (new Date() < booking.scheduledAt) {
        const err = new Error('Cannot mark a session complete before its scheduled start time.');
        (err as any).statusCode = 400;
        throw err;
      }
    }
    if (status === 'CANCELLED') {
      if (!['PENDING', 'ACCEPTED'].includes(booking.status)) {
        const err = new Error(`Cannot cancel a booking with status: ${booking.status}`);
        (err as any).statusCode = 400;
        throw err;
      }
      const now = new Date();
      if (booking.scheduledAt < now && booking.status === 'ACCEPTED') {
        const err = new Error('Cannot cancel a session that has already started.');
        (err as any).statusCode = 400;
        throw err;
      }
    }

    const validStatuses = ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      const err = new Error('Invalid status');
      (err as any).statusCode = 400;
      throw err;
    }

    // Check for overlaps when status is updated to ACCEPTED
    if (status === 'ACCEPTED') {
      await this.checkTimeConflict(
        booking.tutorUserId,
        booking.studentUserId,
        booking.scheduledAt,
        booking.duration,
        booking._id.toString()
      );
    }

    booking.status = status as any;

    // Attach meeting link when accepting an online session
    if (status === 'ACCEPTED' && options?.meetingLink && booking.sessionMode !== 'ONSITE') {
      booking.meetingLink = options.meetingLink;
    }
    // Attach decline reason
    if (status === 'DECLINED' && options?.declineReason) {
      booking.declineReason = options.declineReason;
    }
    if (status === 'COMPLETED') {
      booking.completedBy = userId;
    }

    await booking.save();

    // Notifications
    try {
      const actor = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true },
      });
      const otherUserId =
        booking.studentUserId === userId ? booking.tutorUserId : booking.studentUserId;
      const sessionLabel = booking.isFirstSession ? 'Trial Class' : 'Regular Session';
      const dateStr = new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

      const notifMap: Record<string, { title: string; content: string; type: string }> = {
        ACCEPTED: {
          title: `${sessionLabel} Accepted ✓`,
          content: `Your ${sessionLabel} on ${dateStr} has been accepted by ${actor?.name || 'the tutor'}.${booking.meetingLink ? ` Meeting link added.` : booking.sessionMode === 'ONSITE' ? ` It will be held at: ${booking.location}.` : ''}`,
          type: 'BOOKING_ACCEPTED',
        },
        DECLINED: {
          title: `${sessionLabel} Declined`,
          content: `Your ${sessionLabel} request for ${dateStr} was declined${options?.declineReason ? `: "${options.declineReason}"` : '.'} Feel free to propose a different time.`,
          type: 'BOOKING_DECLINED',
        },
        CANCELLED: {
          title: `${sessionLabel} Cancelled`,
          content: `The ${sessionLabel} scheduled for ${dateStr} was cancelled by ${actor?.name || 'the other party'}.`,
          type: 'BOOKING_CANCELLED',
        },
        COMPLETED: {
          title: `${sessionLabel} Completed`,
          content: `${actor?.name || 'The other party'} marked your ${sessionLabel} on ${dateStr} as complete.`,
          type: 'BOOKING_COMPLETED',
        },
      };

      if (notifMap[status]) {
        await NotificationModel.create({
          userId: otherUserId,
          ...notifMap[status],
          data: { bookingId: booking._id, tutorUserId: booking.tutorUserId },
        });
      }

      // Real-time chat notification update when booking status changes
      const convo = await ConversationModel.findOne({
        $or: [
          { studentUserId: booking.studentUserId, tutorUserId: booking.tutorUserId },
          { studentUserId: booking.tutorUserId, tutorUserId: booking.studentUserId },
        ],
      });

      if (convo) {
        const sessionLabel = booking.isFirstSession ? 'Trial Class' : 'Regular Session';
        const dateStr = new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        const timeStr = new Date(booking.scheduledAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const statusTextMap: Record<string, string> = {
          ACCEPTED: `✓ ${sessionLabel} on ${dateStr} at ${timeStr} was ACCEPTED`,
          DECLINED: `✕ ${sessionLabel} on ${dateStr} at ${timeStr} was DECLINED`,
          CANCELLED: `🚫 ${sessionLabel} on ${dateStr} at ${timeStr} was CANCELLED`,
          COMPLETED: `🎉 ${sessionLabel} on ${dateStr} at ${timeStr} was COMPLETED`,
        };

        const contentStr = `STATUS_UPDATE:${booking._id}:${status}:${statusTextMap[status] || status}`;

        const chatMessage = await MessageModel.create({
          conversationId: convo._id,
          senderUserId: userId,
          content: contentStr,
          seen: false,
        });

        convo.lastMessage = statusTextMap[status] || `Booking status: ${status}`;
        convo.lastMessageAt = new Date();
        await convo.save();

        const io = getIO();
        if (io) {
          const msgObj = chatMessage.toObject();
          io.to(`room:${convo._id}`).emit('new_message', msgObj);
          io.to(`user:${booking.studentUserId}`).emit('message_notification', msgObj);
          io.to(`user:${booking.tutorUserId}`).emit('message_notification', msgObj);
        }
      }
    } catch (err) {
      console.error('Failed to create status notification / chat message:', err);
    }

    return booking;
  }

  /**
   * Report that the other party never showed up for an accepted session.
   * Only reachable once the session's end time has passed, and only from ACCEPTED —
   * this is the accountability path a ghosted demo/session currently has none of.
   */
  async reportNoShow(id: string, userId: string, note?: string) {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      (err as any).statusCode = 404;
      throw err;
    }
    if (booking.studentUserId !== userId && booking.tutorUserId !== userId) {
      const err = new Error('Forbidden: Access denied');
      (err as any).statusCode = 403;
      throw err;
    }
    if (booking.status !== 'ACCEPTED') {
      const err = new Error(`Cannot report a no-show for a booking with status: ${booking.status}`);
      (err as any).statusCode = 400;
      throw err;
    }
    const sessionEnd = new Date(
      booking.scheduledAt.getTime() + (booking.duration || 60) * 60 * 1000
    );
    if (new Date() < sessionEnd) {
      const err = new Error(
        'You can only report a no-show after the session was scheduled to end.'
      );
      (err as any).statusCode = 400;
      throw err;
    }

    const isStudent = booking.studentUserId === userId;
    const reportedParty: 'STUDENT' | 'TUTOR' = isStudent ? 'TUTOR' : 'STUDENT';
    const otherUserId = isStudent ? booking.tutorUserId : booking.studentUserId;

    booking.status = 'NO_SHOW';
    booking.noShowReportedBy = userId;
    booking.noShowParty = reportedParty;
    booking.noShowNote = note || '';
    await booking.save();

    try {
      const reporter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const sessionLabel = booking.isFirstSession ? 'Trial Class' : 'Regular Session';

      await NotificationModel.create({
        userId: otherUserId,
        title: 'No-Show Reported',
        content: `${reporter?.name || 'The other party'} reported that you did not show up for the ${sessionLabel} scheduled on ${new Date(booking.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}.`,
        type: 'BOOKING_NO_SHOW',
        data: { bookingId: booking._id },
      });

      // Escalate to admin moderation so it's actually actionable, not just a private flag
      await ReportModel.create({
        reporterId: userId,
        targetType: 'BOOKING',
        targetId: booking._id.toString(),
        reason: 'NO_SHOW',
        description: note || `${reportedParty} did not show up for a scheduled session.`,
        status: 'PENDING',
      });

      const convo = await ConversationModel.findOne({
        $or: [
          { studentUserId: booking.studentUserId, tutorUserId: booking.tutorUserId },
          { studentUserId: booking.tutorUserId, tutorUserId: booking.studentUserId },
        ],
      });
      if (convo) {
        const contentStr = `STATUS_UPDATE:${booking._id}:NO_SHOW:🚫 No-show reported for the session scheduled on ${new Date(booking.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`;
        const chatMessage = await MessageModel.create({
          conversationId: convo._id,
          senderUserId: userId,
          content: contentStr,
          seen: false,
        });
        convo.lastMessage = '🚫 No-show reported';
        convo.lastMessageAt = new Date();
        await convo.save();

        const io = getIO();
        if (io) {
          const msgObj = chatMessage.toObject();
          io.to(`room:${convo._id}`).emit('new_message', msgObj);
          io.to(`user:${booking.studentUserId}`).emit('message_notification', msgObj);
          io.to(`user:${booking.tutorUserId}`).emit('message_notification', msgObj);
        }
      }
    } catch (err) {
      console.error('Failed to notify / escalate no-show report:', err);
    }

    return booking;
  }

  /**
   * Propose a new time — transitions back to PENDING for the other party to confirm
   */
  async rescheduleBooking(id: string, newScheduledAt: string | Date, userId: string) {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      (err as any).statusCode = 404;
      throw err;
    }
    if (booking.studentUserId !== userId && booking.tutorUserId !== userId) {
      const err = new Error('Forbidden: Access denied');
      (err as any).statusCode = 403;
      throw err;
    }
    if (!['PENDING', 'ACCEPTED'].includes(booking.status)) {
      const err = new Error(`Cannot reschedule a booking with status: ${booking.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    booking.rescheduledFrom = booking.scheduledAt;
    booking.rescheduleRequestedBy = userId;
    booking.scheduledAt = new Date(newScheduledAt);
    booking.status = 'PENDING';
    booking.meetingLink = ''; // clear old link — tutor must re-add on acceptance
    await booking.save();

    try {
      const actor = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const otherUserId =
        booking.studentUserId === userId ? booking.tutorUserId : booking.studentUserId;
      const newDateStr = new Date(newScheduledAt).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const newTimeStr = new Date(newScheduledAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      await NotificationModel.create({
        userId: otherUserId,
        title: 'Session Rescheduled — Please Confirm',
        content: `${actor?.name || 'The other party'} has proposed a new time: ${newDateStr} at ${newTimeStr}. Accept or keep the original.`,
        type: 'BOOKING_RESCHEDULED',
        data: { bookingId: booking._id },
      });
    } catch (err) {
      console.error('Failed to create reschedule notification:', err);
    }

    return booking;
  }
}
