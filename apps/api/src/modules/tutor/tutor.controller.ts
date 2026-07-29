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

  // GET /:id/reviews
  async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const tutorUserId = req.params.id as string;
      const reviews = await this.service.getReviews(tutorUserId);
      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch reviews' });
    }
  }

  // POST /:id/reviews
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const tutorUserId = req.params.id as string;
      const studentUserId = req.user?.id;
      if (!studentUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { rating, comment } = req.body;
      if (!rating || !comment) {
        res.status(400).json({ success: false, error: 'Rating and comment are required' });
        return;
      }
      const review = await this.service.createReview(tutorUserId, studentUserId, Number(rating), comment);
      res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to post review' });
    }
  }

  // GET /list — paginated, filterable list of tutors for students
  async listTutors(req: Request, res: Response): Promise<void> {
    try {
      const {
        subject,
        city,
        teachingMode,
        maxBudget,
        minExp,
        freeDemo,
        sortBy,
        page,
        limit,
      } = req.query as Record<string, string>;

      const result = await this.service.listTutors({
        subject: subject || undefined,
        city: city || undefined,
        teachingMode: teachingMode || undefined,
        maxBudget: maxBudget ? parseInt(maxBudget) : undefined,
        minExp: minExp ? parseInt(minExp) : undefined,
        freeDemo: freeDemo === 'true' ? true : undefined,
        sortBy: (sortBy as any) || 'rating',
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
