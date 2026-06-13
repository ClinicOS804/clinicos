import { Router } from 'express';
import {
  listNotifications, markAllRead, getUnreadCount, notificationStream,
} from '../controllers/notifications.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.get('/stream', notificationStream);

export default router;
