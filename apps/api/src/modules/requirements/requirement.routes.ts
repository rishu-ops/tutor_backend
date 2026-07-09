import { Router } from 'express';
import { RequirementController } from './requirement.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../../common/middleware/role.middleware.js';

const router = Router();
const controller = new RequirementController();

// Create requirement (Student only)
router.post(
  '/',
  requireAuth,
  requireRole('STUDENT'),
  controller.createRequirement.bind(controller)
);

// Get general search/filters browse list (Protected to logged in users)
router.get('/', requireAuth, controller.getRequirementsList.bind(controller));

// Get matching feed (Tutor only) - MUST BE DECLARED BEFORE detail /:id route
router.get(
  '/tutor/feed',
  requireAuth,
  requireRole('TUTOR'),
  controller.getTutorFeed.bind(controller)
);

// Get my requirements (Student only)
router.get(
  '/me',
  requireAuth,
  requireRole('STUDENT'),
  controller.getMyRequirements.bind(controller)
);

// Get requirement detail (Student or Tutor)
router.get('/:id', requireAuth, controller.getRequirementDetail.bind(controller));

// Update requirement (Student owner checked inside service)
router.patch(
  '/:id',
  requireAuth,
  requireRole('STUDENT'),
  controller.updateRequirement.bind(controller)
);

// Close requirement (Student owner checked inside service)
router.patch(
  '/:id/close',
  requireAuth,
  requireRole('STUDENT'),
  controller.closeRequirement.bind(controller)
);

export default router;
export { router as requirementRouter };
