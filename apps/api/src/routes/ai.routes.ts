import { Router } from 'express';
import { getAILogs, getAIStats, getAIConfig, updateAIConfig, testAI } from '../controllers/ai.controller';
import { authMiddleware, doctorOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, doctorOnly);

router.get('/logs', getAILogs);
router.get('/stats', getAIStats);
router.get('/config', getAIConfig);
router.patch('/config', updateAIConfig);
router.post('/test', testAI);

export default router;
