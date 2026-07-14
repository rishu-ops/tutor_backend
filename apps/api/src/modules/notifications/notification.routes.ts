import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();
const controller = new NotificationController();

// Get list of notifications
router.get('/', requireAuth, controller.getNotifications.bind(controller));

// Mark all notifications as read
router.patch('/read-all', requireAuth, controller.markAllAsRead.bind(controller));

// Mark a notification as read
router.patch('/:id/read', requireAuth, controller.markAsRead.bind(controller));

// Clear all notifications
router.delete('/', requireAuth, controller.clearAllNotifications.bind(controller));

// Delete single notification
router.delete('/:id', requireAuth, controller.deleteNotification.bind(controller));

export default router;
