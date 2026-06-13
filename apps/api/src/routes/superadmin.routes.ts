import { Router } from 'express';
import {
  getPlatformStats, listClinics, getClinicDetail,
  updateClinicStatus, overridePlan, getRevenue, sendAnnouncement,
} from '../controllers/superadmin.controller';
import { adminAuth } from '../middleware/adminAuth.middleware';

const router = Router();

router.use(adminAuth);

router.get('/stats', getPlatformStats);
router.get('/clinics', listClinics);
router.get('/clinics/:id', getClinicDetail);
router.patch('/clinics/:id/status', updateClinicStatus);
router.patch('/clinics/:id/plan', overridePlan);
router.get('/revenue', getRevenue);
router.post('/announce', sendAnnouncement);

export default router;
