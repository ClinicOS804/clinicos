import { Router } from 'express';
import { getReviews, requestReviews, replyToReview } from '../controllers/reviews.controller';
import { authMiddleware, doctorOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, doctorOnly);

router.get('/', getReviews);
router.post('/request', requestReviews);
router.post('/reply', replyToReview);

export default router;
