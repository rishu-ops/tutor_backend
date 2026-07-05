import { Router } from 'express';
import { AuthController } from './auth.controller.js';

const router = Router();
const controller = new AuthController();

router.post('/send-otp', controller.sendOtp.bind(controller));
router.post('/verify-otp', controller.verifyOtp.bind(controller));
router.post('/refresh', controller.refresh.bind(controller));
router.post('/logout', controller.logout.bind(controller));

export default router;
export { router as authRouter };
