import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();
const controller = new PaymentController();

router.post('/', requireAuth, controller.createPaymentRecord.bind(controller));
router.post('/:id/mark-paid', requireAuth, controller.markPaid.bind(controller));
router.post('/:id/confirm', requireAuth, controller.confirmPayment.bind(controller));
router.post('/:id/dispute', requireAuth, controller.disputePayment.bind(controller));
router.get('/contract/:contractId', requireAuth, controller.getContractPayments.bind(controller));

export default router;
export { router as paymentRouter };
