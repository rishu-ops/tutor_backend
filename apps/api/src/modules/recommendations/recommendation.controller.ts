import { Request, Response } from 'express';
import { RecommendationService } from './recommendation.service.js';

export class RecommendationController {
  private service = new RecommendationService();

  // GET /home
  async getHomeRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const recommendations = await this.service.getHomeRecommendations(userId);
      res.json({ success: true, ...recommendations });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /
  async getSectionRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { section, page, limit } = req.query;

      if (!section) {
        // Fallback to full home map if no section specified
        const recommendations = await this.service.getHomeRecommendations(userId);
        res.json({ success: true, ...recommendations });
        return;
      }

      const pageNum = page ? Number(page) : 1;
      const limitNum = limit ? Number(limit) : 10;

      const result = await this.service.getSectionRecommendations(
        userId,
        section as string,
        pageNum,
        limitNum
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
