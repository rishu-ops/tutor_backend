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

// GET /tutors/list — paginated, searchable tutor list for students
router.get('/list', requireAuth, controller.listTutors.bind(controller));

// Get a tutor's public profile details
router.get('/:id/public', requireAuth, controller.getPublicProfile.bind(controller));

// Tutor reviews endpoints
router.get('/:id/reviews', requireAuth, controller.getReviews.bind(controller));
router.post('/:id/reviews', requireAuth, controller.createReview.bind(controller));

export default router;
export { router as tutorRouter };
