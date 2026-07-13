import { BookingModel, prisma } from 'database';

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
    return booking;
  }
}
