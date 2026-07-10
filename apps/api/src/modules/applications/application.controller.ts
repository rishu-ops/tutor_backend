import { Request, Response } from 'express';
import { ApplicationService } from './application.service.js';

export class ApplicationController {
  private service = new ApplicationService();

  // POST /requirements/:id/apply
  async apply(req: Request, res: Response): Promise<void> {
    try {
      const requirementId = req.params.id as string;
      const tutorUserId = req.user?.id;
      if (!tutorUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { introduction, proposedFee, availableTimings, freeDemo, message } = req.body;
      if (!introduction || !proposedFee || !availableTimings || !message) {
        res.status(422).json({ success: false, error: 'Required fields missing' });
        return;
      }

      const proposal = {
        introduction,
        proposedFee,
        availableTimings,
        freeDemo,
        message,
      };

      const application = await this.service.apply(tutorUserId, requirementId, proposal);
      res.status(201).json({
        success: true,
        message: 'Application proposal submitted successfully',
        data: application,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /applications/me (Tutor role)
  async getMyApplications(req: Request, res: Response): Promise<void> {
    try {
      const tutorUserId = req.user?.id;
      if (!tutorUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const applications = await this.service.getTutorApplications(tutorUserId);
      res.json({ success: true, data: applications });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /requirements/:id/applications (Student role)
  async getRequirementApplications(req: Request, res: Response): Promise<void> {
    try {
      const requirementId = req.params.id as string;
      const studentUserId = req.user?.id;
      if (!studentUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const applications = await this.service.getRequirementApplications(
        studentUserId,
        requirementId
      );
      res.json({ success: true, data: applications });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /applications/:id/accept (Student role)
  async acceptApplication(req: Request, res: Response): Promise<void> {
    try {
      const applicationId = req.params.id as string;
      const studentUserId = req.user?.id;
      if (!studentUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const application = await this.service.acceptApplication(studentUserId, applicationId);
      res.json({
        success: true,
        message: 'Tutor application accepted successfully',
        data: application,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /applications/:id/reject (Student role)
  async rejectApplication(req: Request, res: Response): Promise<void> {
    try {
      const applicationId = req.params.id as string;
      const studentUserId = req.user?.id;
      if (!studentUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const application = await this.service.rejectApplication(studentUserId, applicationId);
      res.json({
        success: true,
        message: 'Application proposal rejected',
        data: application,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
