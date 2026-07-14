import { Router } from 'express';
import { MatchingController } from './matching.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../../common/middleware/role.middleware.js';

const router = Router();
const controller = new MatchingController();

// Get match score metrics (Protected by auth and tutor role)
router.get(
  '/requirement/:id',
  requireAuth,
  requireRole('TUTOR'),
  controller.getMatchScore.bind(controller)
);

export default router;
