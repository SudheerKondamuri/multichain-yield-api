import { Router } from 'express';
import { getAggregatedYields, getStatus } from '../controllers/yieldController.js';

const router = Router();

router.get('/chains/status', getStatus);
router.get('/yields', getAggregatedYields);

// Placeholder for BEST
// router.get('/yields/best', getBestYield);

export default router;
