import { Router } from 'express';
import { getAggregatedYields, getStatus, getBestYield } from '../controllers/yieldController.js';

const router = Router();

router.get('/chains/status', getStatus);
router.get('/yields', getAggregatedYields);
router.get('/yields/best', getBestYield);

export default router;
