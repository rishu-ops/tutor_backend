import { Request, Response } from 'express';
import { ConversationService } from './conversation.service.js';

export class ConversationController {
  private service = new ConversationService();

  // GET /api/v1/conversations
  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const list = await this.service.getConversations(userId);
      res.json({ success: true, data: list });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }

  // GET /api/v1/conversations/:id
  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const convo = await this.service.getConversation(id, userId);
      res.json({ success: true, data: convo });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }

  // POST /api/v1/conversations
  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const studentUserId = req.user?.id;
      const { tutorUserId, requirementId, applicationId } = req.body;

      if (!studentUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!tutorUserId || !requirementId || !applicationId) {
        res.status(400).json({ success: false, error: 'Missing required parameters' });
        return;
      }

      const convo = await this.service.createConversation(
        studentUserId,
        tutorUserId,
        requirementId,
        applicationId
      );
      res.status(212).json({ success: true, data: convo });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
}
