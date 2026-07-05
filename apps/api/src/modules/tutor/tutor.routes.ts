import { Router } from 'express';
import { TutorController } from './tutor.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../../common/middleware/role.middleware.js';

const router = Router();
const controller = new TutorController();

// Mount Tutor profile endpoints (Protected by auth and role validation)
router.get('/profile', requireAuth, requireRole('TUTOR'), controller.getProfile.bind(controller));
router.patch(
  '/profile',
  requireAuth,
  requireRole('TUTOR'),
  controller.updateProfile.bind(controller)
);

export default router;
export { router as tutorRouter };
