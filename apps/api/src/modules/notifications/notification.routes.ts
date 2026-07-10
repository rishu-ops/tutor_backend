import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();
const controller = new NotificationController();

// Get list of notifications
router.get('/', requireAuth, controller.getNotifications.bind(controller));

// Mark a notification as read
router.patch('/:id/read', requireAuth, controller.markAsRead.bind(controller));

export default router;
