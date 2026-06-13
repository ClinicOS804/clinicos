import { Router } from 'express';
import {
  getSettings, updateClinicInfo, updateAISettings,
  updateWorkingHours, updateTreatments, uploadLogo, uploadMiddleware,
} from '../controllers/settings.controller';
import { authMiddleware, doctorOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, doctorOnly);

router.get('/', getSettings);
router.patch('/clinic', updateClinicInfo);
router.patch('/ai', updateAISettings);
router.patch('/hours', updateWorkingHours);
router.patch('/treatments', updateTreatments);
router.post('/logo', uploadMiddleware, uploadLogo);

export default router;
