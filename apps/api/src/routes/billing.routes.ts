import { Router } from 'express';
import {
  getSubscriptionInfo, getInvoices, createCheckout, openPortal,
} from '../controllers/billing.controller';
import { authMiddleware, doctorOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, doctorOnly);

router.get('/subscription', getSubscriptionInfo);
router.get('/invoices', getInvoices);
router.post('/checkout', createCheckout);
router.post('/portal', openPortal);

export default router;
