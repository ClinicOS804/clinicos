import { Router } from 'express';
import {
  getOverview, getWeeklyAppointments, getMonthlyRevenue,
  getMessagesByChannel, getTopTreatments,
} from '../controllers/analytics.controller';
import { authMiddleware, doctorOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, doctorOnly);

router.get('/overview', getOverview);
router.get('/weekly-appointments', getWeeklyAppointments);
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/messages-by-channel', getMessagesByChannel);
router.get('/top-treatments', getTopTreatments);

export default router;
