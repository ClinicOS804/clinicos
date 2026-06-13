import { Router } from 'express';
import {
  register, login, staffLogin, superadminLogin,
  getMe, updateMe, forgotPassword, resetPassword, logout, acceptInvite,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/staff/login', staffLogin);
router.post('/superadmin/login', superadminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/accept-invite', acceptInvite);
router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, updateMe);
router.post('/logout', logout);

export default router;
