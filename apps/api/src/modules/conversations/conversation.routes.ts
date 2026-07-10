import { Router } from 'express';
import { ConversationController } from './conversation.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();
const controller = new ConversationController();

// List all conversations for active user
router.get('/', requireAuth, controller.getConversations.bind(controller));

// Retrieve conversation details by ID
router.get('/:id', requireAuth, controller.getConversation.bind(controller));

// Manually trigger conversation creation shell (POST /conversations)
router.post('/', requireAuth, controller.createConversation.bind(controller));

export default router;
