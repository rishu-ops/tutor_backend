import { Router } from 'express';
import { BookingController } from './booking.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();
const controller = new BookingController();

// Create a new booking
router.post('/', requireAuth, controller.createBooking.bind(controller));

// List bookings for active user
router.get('/', requireAuth, controller.getBookings.bind(controller));

// Get single booking
router.get('/:id', requireAuth, controller.getBooking.bind(controller));

// Update booking status
router.patch('/:id/status', requireAuth, controller.updateBookingStatus.bind(controller));

// Reschedule booking
router.patch('/:id/reschedule', requireAuth, controller.rescheduleBooking.bind(controller));

export default router;
