import { Router } from 'express';
import {
  listAppointments, createAppointment, getAppointment,
  updateAppointment, cancelAppointment, getAvailableSlots,
} from '../controllers/appointments.controller';
import { authMiddleware, doctorOrStaff } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, doctorOrStaff);

router.get('/slots', getAvailableSlots);
router.get('/', listAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointment);
router.patch('/:id', updateAppointment);
router.delete('/:id', cancelAppointment);

export default router;
