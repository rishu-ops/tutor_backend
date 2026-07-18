import { BookingModel, TutorProfileModel, prisma, NotificationModel } from 'database';

export class BookingService {
  /**
   * Request a new session.
   * - Detects sessionMode from tutor profile teachingModes
   * - Guards regular sessions behind a completed trial
   */
  async createBooking(data: {
    requirementId: string;
    studentUserId: string;
    tutorUserId: string;
    scheduledAt: string | Date;
    duration?: number;
    isFirstSession: boolean;
    notes?: string;
    studentNeedsDemo?: boolean; // from requirement preference
  }) {
    // --- Resolve session mode from tutor profile ---
    const tutorProfile = await TutorProfileModel.findOne({ userId: data.tutorUserId });
    const modes: string[] = tutorProfile?.teachingModes || [];

    const sessionMode: 'ONLINE' | 'ONSITE' | 'HYBRID' =
      modes.includes('Online') && modes.includes('Onsite')
        ? 'HYBRID'
        : modes.includes('Onsite')
          ? 'ONSITE'
          : 'ONLINE';

    // --- Guard: cannot request regular session without completed trial ---
    if (!data.isFirstSession) {
      const completedTrial = await BookingModel.findOne({
        studentUserId: data.studentUserId,
        tutorUserId: data.tutorUserId,
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

    const booking = await BookingModel.create({
      requirementId: data.requirementId,
      studentUserId: data.studentUserId,
      tutorUserId: data.tutorUserId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration || 60,
      sessionMode,
      isFirstSession: data.isFirstSession,
      status: 'PENDING',
      notes: data.notes || '',
      location: locationNote,
    });

    // Notify tutor
    try {
      const studentUser = await prisma.user.findUnique({
        where: { id: data.studentUserId },
        select: { name: true },
      });
      const sessionLabel = data.isFirstSession ? 'Trial Class' : 'Regular Session';
      await NotificationModel.create({
        userId: data.tutorUserId,
        title: `New ${sessionLabel} Request`,
        content: `${studentUser?.name || 'A student'} has requested a ${sessionLabel} on ${new Date(data.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at ${new Date(data.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`,
        type: 'BOOKING_REQUESTED',
        data: { bookingId: booking._id, requirementId: data.requirementId },
      });
    } catch (err) {
      console.error('Failed to create booking notification:', err);
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

    return {
      ...booking.toObject(),
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
      enriched.push({
        ...booking.toObject(),
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
   * - Only TUTOR can ACCEPT or DECLINE
   * - Either party can CANCEL (if PENDING or ACCEPTED, and not yet started)
   * - Only TUTOR can COMPLETE
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

    const isTutor = booking.tutorUserId === userId;
    const isStudent = booking.studentUserId === userId;

    // State machine enforcement
    if ((status === 'ACCEPTED' || status === 'DECLINED') && !isTutor) {
      const err = new Error('Only the tutor can accept or decline a booking.');
      (err as any).statusCode = 403;
      throw err;
    }
    if (status === 'COMPLETED' && !isTutor) {
      const err = new Error('Only the tutor can mark a session as completed.');
      (err as any).statusCode = 403;
      throw err;
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

    booking.status = status as any;

    // Attach meeting link when accepting an online session
    if (status === 'ACCEPTED' && options?.meetingLink && booking.sessionMode !== 'ONSITE') {
      booking.meetingLink = options.meetingLink;
    }
    // Attach decline reason
    if (status === 'DECLINED' && options?.declineReason) {
      booking.declineReason = options.declineReason;
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
          content: `Your ${sessionLabel} with ${actor?.name || 'the tutor'} is marked complete. How did it go?`,
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
    } catch (err) {
      console.error('Failed to create status notification:', err);
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
