/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { RequirementService } from './requirement.service.js';
import { createRequirementSchema, updateRequirementSchema } from './requirement.validation.js';

export class RequirementController {
  private service = new RequirementService();

  // POST /
  async createRequirement(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = createRequirementSchema.safeParse(req.body);
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

      const requirement = await this.service.createRequirement(userId, parseResult.data);
      res.status(211).json({
        success: true,
        message: 'Tutoring requirement posted successfully',
        data: requirement,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /me
  async getMyRequirements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const requirements = await this.service.getMyRequirements(userId);
      res.json({ success: true, data: requirements });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /
  async getRequirementsList(req: Request, res: Response): Promise<void> {
    try {
      const { search, category, subject, teachingMode, city, minBudget, maxBudget, page, limit } =
        req.query;

      const filters = {
        search,
        category,
        subject,
        teachingMode,
        city,
        minBudget,
        maxBudget,
      };

      const pageNum = page ? Number(page) : 1;
      const limitNum = limit ? Number(limit) : 10;

      const result = await this.service.getRequirements(filters, pageNum, limitNum);
      res.json({ success: true, ...result });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /tutor/feed
  async getTutorFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { page, limit } = req.query;
      const pageNum = page ? Number(page) : 1;
      const limitNum = limit ? Number(limit) : 10;

      const result = await this.service.getTutorMatchedFeed(userId, pageNum, limitNum);
      res.json({ success: true, ...result });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /:id
  async getRequirementDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const requirement = await this.service.getRequirementDetail(id, userId);
      res.json({ success: true, data: requirement });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /:id
  async updateRequirement(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const parseResult = updateRequirementSchema.safeParse(req.body);
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

      const requirement = await this.service.updateRequirement(id, userId, parseResult.data);
      res.json({
        success: true,
        message: 'Requirement updated successfully',
        data: requirement,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /:id/close
  async closeRequirement(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const requirement = await this.service.closeRequirement(id, userId);
      res.json({
        success: true,
        message: 'Requirement closed successfully',
        data: requirement,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
