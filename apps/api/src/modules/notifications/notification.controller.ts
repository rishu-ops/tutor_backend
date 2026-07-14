import { Request, Response } from 'express';
import { NotificationModel } from 'database';

export class NotificationController {
  // GET /
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const list = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
      res.json({ success: true, data: list });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /:id/read
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const notifId = req.params.id as string;
      const notif = await NotificationModel.findOneAndUpdate(
        { _id: notifId, userId },
        { $set: { read: true } },
        { new: true }
      );

      res.json({ success: true, data: notif });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /read-all
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // DELETE /
  async clearAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await NotificationModel.deleteMany({ userId });
      res.json({ success: true, message: 'All notifications cleared successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // DELETE /:id
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const notifId = req.params.id as string;
      await NotificationModel.findOneAndDelete({ _id: notifId, userId });
      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
