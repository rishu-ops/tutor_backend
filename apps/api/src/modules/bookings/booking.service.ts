import { BookingModel, TutorProfileModel, prisma, NotificationModel, RequirementModel } from 'database';

export class BookingService {
  /**
   * Request a new session.
   * - Detects sessionMode from tutor profile teachingModes
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
      $or: [
        { tutorUserId },
        { studentUserId }
      ],
      scheduledAt: { $gte: rangeStart, $lte: rangeEnd }
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
          minute: '2-digit'
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
  }) {
    const creatorUser = await prisma.user.findUnique({ where: { id: data.creatorUserId } });
    if (!creatorUser) {
      const err = new Error('Creator user not found');
      (err as any).statusCode = 404;
      throw err;
    }

    let studentUserId = '';
    let tutorUserId = '';
    let isTutorCreator = false;

    if (creatorUser.role === 'TUTOR') {
      tutorUserId = data.creatorUserId;
      studentUserId = data.partnerUserId;
      isTutorCreator = true;
    } else {
      studentUserId = data.creatorUserId;
      tutorUserId = data.partnerUserId;
    }

    // Check for schedule conflicts (block booking request if slot is already occupied)
    const duration = data.duration || 60;
    await this.checkTimeConflict(tutorUserId, studentUserId, new Date(data.scheduledAt), duration);

    // --- Resolve session mode from tutor profile ---
    const tutorProfile = await TutorProfileModel.findOne({ userId: tutorUserId });
    const modes: string[] = tutorProfile?.teachingModes || [];

    const sessionMode: 'ONLINE' | 'ONSITE' | 'HYBRID' =
      modes.includes('Online') && modes.includes('Onsite')
        ? 'HYBRID'
        : modes.includes('Onsite')
          ? 'ONSITE'
          : 'ONLINE';

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

    const requirement = await RequirementModel.findById(data.requirementId);
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
      subject
    });

    // Notify partner user
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

    const requirement = await RequirementModel.findById(booking.requirementId);
    const subject = requirement?.curriculum?.subject || requirement?.category || 'Class Session';

    const tutorProfile = await TutorProfileModel.findOne({ userId: booking.tutorUserId });
    const coordinates = tutorProfile?.location?.lat && tutorProfile?.location?.lng
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
      const coordinates = tutorProfile?.location?.lat && tutorProfile?.location?.lng
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
    if (status === 'ACCEPTED' || status === 'DECLINED') {
      // The accepting party must NOT be the one who requested it
      if (booking.requestedBy === userId) {
        const err = new Error('You cannot accept or decline a booking request that you initiated.');
        (err as any).statusCode = 403;
        throw err;
      }
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
