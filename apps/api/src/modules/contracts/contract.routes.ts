import { Router } from 'express';
import { ContractController } from './contract.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();
const controller = new ContractController();

router.get('/', requireAuth, controller.getUserContracts.bind(controller));
router.post('/', requireAuth, controller.createContract.bind(controller));
router.get('/:id', requireAuth, controller.getContract.bind(controller));
router.post('/:id/sign', requireAuth, controller.signContract.bind(controller));
router.post('/:id/terminate', requireAuth, controller.terminateContract.bind(controller));

export default router;
export { router as contractRouter };
