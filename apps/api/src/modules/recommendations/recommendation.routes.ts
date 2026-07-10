import { Router } from 'express';
import { RecommendationController } from './recommendation.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../../common/middleware/role.middleware.js';

const router = Router();
const controller = new RecommendationController();

// GET /home -> full recommendations map
router.get(
  '/home',
  requireAuth,
  requireRole('TUTOR'),
  controller.getHomeRecommendations.bind(controller)
);

// GET / -> paginated section queries
router.get(
  '/',
  requireAuth,
  requireRole('TUTOR'),
  controller.getSectionRecommendations.bind(controller)
);

export default router;
