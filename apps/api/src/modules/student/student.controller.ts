/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { StudentService } from './student.service.js';
import { updateStudentProfileSchema } from './student.validation.js';

export class StudentController {
  private service = new StudentService();

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

  // GET /profile/:id
  async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.id as string;
      if (!studentId) {
        res.status(400).json({ success: false, error: 'Student User ID is required' });
        return;
      }

      const profile = await this.service.getPublicProfile(studentId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PATCH /profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = updateStudentProfileSchema.safeParse(req.body);
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
        message: 'Student profile updated successfully',
        data: profile,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
