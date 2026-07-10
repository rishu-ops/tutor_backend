/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { TutorService } from './tutor.service.js';
import { updateTutorProfileSchema } from './tutor.validation.js';

export class TutorController {
  private service = new TutorService();

  // GET /profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const profile = await this.service.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = updateTutorProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(422).json({
          success: false,
          error: 'Validation Failed',
          errors: parseResult.error.format(),
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const profile = await this.service.updateProfile(userId, parseResult.data);
      res.json({
        success: true,
        message: 'Tutor profile updated successfully',
        data: profile,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /:id/public
  async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const tutorUserId = req.params.id as string;
      if (!tutorUserId) {
        res.status(400).json({ success: false, error: 'Tutor user ID is required' });
        return;
      }

      const profile = await this.service.getPublicProfile(tutorUserId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
