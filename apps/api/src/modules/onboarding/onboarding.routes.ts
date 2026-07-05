import { Router } from 'express';
import { OnboardingController } from './onboarding.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();
const controller = new OnboardingController();

// Mount POST /api/v1/onboarding (Protected by JWT validation middleware)
router.post('/', requireAuth, controller.onboard.bind(controller));

export default router;
export { router as onboardingRouter };
