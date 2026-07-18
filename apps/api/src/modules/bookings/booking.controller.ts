import { Request, Response } from 'express';
import { BookingService } from './booking.service.js';

export class BookingController {
  private service = new BookingService();

  // POST /api/v1/bookings
  async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const studentUserId = req.user?.id;
      if (!studentUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const {
        requirementId,
        tutorUserId,
        scheduledAt,
        duration,
        isFirstSession,
        notes,
        studentNeedsDemo,
      } = req.body;
      if (!requirementId || !tutorUserId || !scheduledAt) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters (requirementId, tutorUserId, scheduledAt)',
        });
        return;
      }

      const booking = await this.service.createBooking({
        requirementId,
        studentUserId,
        tutorUserId,
        scheduledAt,
        duration,
        isFirstSession: isFirstSession !== false, // default true
        notes,
        studentNeedsDemo,
      });

      res.status(201).json({ success: true, data: booking });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /api/v1/bookings
  async getBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const bookings = await this.service.getBookings(userId);
      res.json({ success: true, data: bookings });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /api/v1/bookings/:id
  async getBooking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const booking = await this.service.getBooking(id, userId);
      res.json({ success: true, data: booking });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /api/v1/bookings/:id/status
  async updateBookingStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      const { status, meetingLink, declineReason } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      if (!status) {
        res.status(400).json({ success: false, error: 'Missing status' });
        return;
      }

      const booking = await this.service.updateBookingStatus(id, status, userId, {
        meetingLink,
        declineReason,
      });
      res.json({ success: true, data: booking });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /api/v1/bookings/:id/reschedule
  async rescheduleBooking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      const { scheduledAt } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      if (!scheduledAt) {
        res.status(400).json({ success: false, error: 'Missing scheduledAt' });
        return;
      }

      const booking = await this.service.rescheduleBooking(id, scheduledAt, userId);
      res.json({ success: true, data: booking });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
