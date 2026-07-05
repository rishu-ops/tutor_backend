/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { OnboardingService } from './onboarding.service.js';
import { onboardingSchema } from './onboarding.validation.js';

export class OnboardingController {
  private service = new OnboardingService();

  async onboard(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validate request body
      const parseResult = onboardingSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(422).json({
          success: false,
          error: 'Validation Failed',
          errors: parseResult.error.format(),
        });
        return;
      }

      // 2. Retrieve authenticated user ID
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // 3. Process onboarding
      await this.service.onboardUser(userId, parseResult.data);

      res.status(201).json({
        success: true,
        message: `${parseResult.data.role} profile created successfully`,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
}
