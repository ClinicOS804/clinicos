import { Router } from 'express';
import {
  listPatients, createPatient, getPatient, updatePatient,
  deactivatePatient, getPatientAppointments, getPatientMessages, sendMagicLink,
} from '../controllers/patients.controller';
import { authMiddleware, doctorOrStaff, doctorOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, doctorOrStaff);

router.get('/', listPatients);
router.post('/', createPatient);
router.get('/:id', getPatient);
router.patch('/:id', updatePatient);
router.delete('/:id', doctorOnly, deactivatePatient);
router.get('/:id/appointments', getPatientAppointments);
router.get('/:id/messages', getPatientMessages);
router.post('/:id/magic-link', doctorOnly, sendMagicLink);

export default router;
