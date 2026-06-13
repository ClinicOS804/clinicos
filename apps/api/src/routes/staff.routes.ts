import { Router } from 'express';
import { listStaff, inviteStaff, updateStaff, deactivateStaff } from '../controllers/staff.controller';
import { authMiddleware, doctorOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, doctorOnly);

router.get('/', listStaff);
router.post('/invite', inviteStaff);
router.patch('/:id', updateStaff);
router.delete('/:id', deactivateStaff);

export default router;
