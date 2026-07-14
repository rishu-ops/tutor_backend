import { Request, Response } from 'express';
import { TutorRequirementMatchModel } from 'database';
import { matchingQueue } from './matching.queue.js';

export class MatchingController {
  /**
   * Retrieve matching score for logged-in Tutor and specific Requirement
   */
  async getMatchScore(req: Request, res: Response): Promise<void> {
    try {
      const tutorUserId = req.user?.id;
      const requirementId = req.params.id as string;

      if (!tutorUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!requirementId) {
        res.status(400).json({ success: false, error: 'Requirement ID is required' });
        return;
      }

      // 1. Check if match cache already exists
      let match = await TutorRequirementMatchModel.findOne({ tutorUserId, requirementId });

      // 2. If no record, create PENDING and add job to queue
      if (!match) {
        match = await TutorRequirementMatchModel.create({
          tutorUserId,
          requirementId,
          status: 'PENDING',
          score: 0,
          strength: 'LOW',
          breakdown: {
            subjectMatch: false,
            levelMatch: false,
            modeMatch: false,
            locationMatch: false,
            budgetMatch: false,
          },
        });

        // Add job to BullMQ queue
        await matchingQueue.add('calculate-match', { tutorUserId, requirementId });
      }

      // 3. If failed record, let's retry/re-queue it
      if (match.status === 'FAILED') {
        match.status = 'PENDING';
        await match.save();
        await matchingQueue.add('calculate-match', { tutorUserId, requirementId });
      }

      res.json({ success: true, data: match });
    } catch (error: any) {
      console.error('Error fetching match score:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
