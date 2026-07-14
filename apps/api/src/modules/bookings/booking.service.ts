import { BookingModel, prisma, NotificationModel } from 'database';

export class BookingService {
  /**
   * Request a new class booking (starts in PENDING status)
   */
  async createBooking(data: {
    requirementId: string;
    studentUserId: string;
    tutorUserId: string;
    scheduledAt: string | Date;
    duration?: number;
    fee?: number;
    type?: 'DEMO' | 'REGULAR';
    notes?: string;
  }) {
    const booking = await BookingModel.create({
      requirementId: data.requirementId,
      studentUserId: data.studentUserId,
      tutorUserId: data.tutorUserId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration || 60,
      fee: data.fee || 0,
      type: data.type || 'DEMO',
      status: 'PENDING',
      notes: data.notes || '',
    });

    try {
      const studentUser = await prisma.user.findUnique({
        where: { id: data.studentUserId },
        select: { name: true },
      });
      await NotificationModel.create({
        userId: data.tutorUserId,
        title: 'New Class Booking Request',
        content: `${studentUser?.name || 'A student'} has requested a ${data.type || 'DEMO'} class session on ${new Date(data.scheduledAt).toLocaleDateString()}.`,
        type: 'BOOKING_REQUESTED',
        data: { bookingId: booking._id, requirementId: data.requirementId },
      });
    } catch (err) {
      console.error('Failed to create booking request notification:', err);
    }

    return booking;
  }

  /**
   * Retrieve single booking detail
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

    // Enrich with other party details
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
   * List all bookings for a user (student or tutor)
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
   * Update booking status (ACCEPT, REJECT, CANCEL, COMPLETE)
   */
  async updateBookingStatus(id: string, status: string, userId: string) {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Validate ownership
    if (booking.studentUserId !== userId && booking.tutorUserId !== userId) {
      const err = new Error('Forbidden: Access denied');
      (err as any).statusCode = 403;
      throw err;
    }

    // Validate valid status transitions
    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      const err = new Error('Bad Request: Invalid status');
      (err as any).statusCode = 400;
      throw err;
    }

    booking.status = status as any;
    await booking.save();

    try {
      const actor = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true },
      });
      const otherUserId =
        booking.studentUserId === userId ? booking.tutorUserId : booking.studentUserId;

      if (status === 'ACCEPTED') {
        await NotificationModel.create({
          userId: otherUserId,
          title: 'Class Booking Accepted',
          content: `Your class session on ${new Date(booking.scheduledAt).toLocaleDateString()} has been accepted by ${actor?.name || 'the tutor'}.`,
          type: 'BOOKING_ACCEPTED',
          data: { bookingId: booking._id },
        });
      } else if (status === 'REJECTED') {
        await NotificationModel.create({
          userId: otherUserId,
          title: 'Class Booking Declined',
          content: `Your class session request for ${new Date(booking.scheduledAt).toLocaleDateString()} has been declined.`,
          type: 'BOOKING_DECLINED',
          data: { bookingId: booking._id },
        });
      } else if (status === 'CANCELLED') {
        await NotificationModel.create({
          userId: otherUserId,
          title: 'Class Booking Cancelled',
          content: `The class session scheduled for ${new Date(booking.scheduledAt).toLocaleDateString()} was cancelled by ${actor?.name || 'the other party'}.`,
          type: 'BOOKING_CANCELLED',
          data: { bookingId: booking._id },
        });
      } else if (status === 'COMPLETED') {
        await NotificationModel.create({
          userId: booking.studentUserId,
          title: 'Class Completed - Leave a Review',
          content: `Your class session is complete. Please take a moment to rate and review your tutor.`,
          type: 'BOOKING_COMPLETED',
          data: { bookingId: booking._id, tutorUserId: booking.tutorUserId },
        });
      }
    } catch (err) {
      console.error('Failed to create booking status update notification:', err);
    }

    return booking;
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(id: string, scheduledAt: string | Date, userId: string) {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Validate ownership
    if (booking.studentUserId !== userId && booking.tutorUserId !== userId) {
      const err = new Error('Forbidden: Access denied');
      (err as any).statusCode = 403;
      throw err;
    }

    booking.scheduledAt = new Date(scheduledAt);
    // When rescheduled, it transitions back to PENDING so the other party can accept the new time
    booking.status = 'PENDING';
    await booking.save();

    try {
      const actor = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const otherUserId =
        booking.studentUserId === userId ? booking.tutorUserId : booking.studentUserId;
      await NotificationModel.create({
        userId: otherUserId,
        title: 'Class Booking Rescheduled',
        content: `${actor?.name || 'The other party'} has proposed a new time for your class: ${new Date(scheduledAt).toLocaleDateString()} at ${new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        type: 'BOOKING_RESCHEDULED',
        data: { bookingId: booking._id },
      });
    } catch (err) {
      console.error('Failed to create reschedule request notification:', err);
    }

    return booking;
  }
}
