import { Router } from 'express';
import { ApplicationController } from './application.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../../common/middleware/role.middleware.js';

const router = Router();
const controller = new ApplicationController();

// Tutor apply to requirement
router.post(
  '/requirements/:id/apply',
  requireAuth,
  requireRole('TUTOR'),
  controller.apply.bind(controller)
);

// Tutor get their submitted applications
router.get('/me', requireAuth, requireRole('TUTOR'), controller.getMyApplications.bind(controller));

// Student get applications for their requirement
router.get(
  '/requirements/:id',
  requireAuth,
  requireRole('STUDENT'),
  controller.getRequirementApplications.bind(controller)
);

// Student accept tutor application
router.patch(
  '/:id/accept',
  requireAuth,
  requireRole('STUDENT'),
  controller.acceptApplication.bind(controller)
);

// Student reject tutor application
router.patch(
  '/:id/reject',
  requireAuth,
  requireRole('STUDENT'),
  controller.rejectApplication.bind(controller)
);

// Student compare multiple applications
router.post(
  '/compare',
  requireAuth,
  requireRole('STUDENT'),
  controller.compareApplications.bind(controller)
);

// Student/Tutor get details for a single application
router.get('/:id', requireAuth, controller.getApplicationDetails.bind(controller));

// Student explicitly mark application as viewed
router.patch(
  '/:id/view',
  requireAuth,
  requireRole('STUDENT'),
  controller.markAsViewed.bind(controller)
);

export default router;
