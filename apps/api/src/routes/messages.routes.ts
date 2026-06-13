import { Router } from 'express';
import {
  listMessages, getMessageStats, sendMessage,
  broadcastMessage, markAsRead, getThread,
} from '../controllers/messages.controller';
import { authMiddleware, doctorOrStaff } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, doctorOrStaff);

router.get('/', listMessages);
router.get('/stats', getMessageStats);
router.post('/send', sendMessage);
router.post('/broadcast', broadcastMessage);
router.patch('/:id/read', markAsRead);
router.get('/threads/:patientId', getThread);

export default router;
