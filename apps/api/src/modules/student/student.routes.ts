import { Router } from 'express';
import { StudentController } from './student.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../../common/middleware/role.middleware.js';

const router = Router();
const controller = new StudentController();

// Mount Student profile endpoints (Protected by auth and role validation)
router.get('/profile', requireAuth, requireRole('STUDENT'), controller.getProfile.bind(controller));
router.patch(
  '/profile',
  requireAuth,
  requireRole('STUDENT'),
  controller.updateProfile.bind(controller)
);

export default router;
export { router as studentRouter };
