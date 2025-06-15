import { Router } from 'express';
import matchmakingController from '../controllers/matchmakingController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All matchmaking routes require authentication
router.use(authenticate);

// POST /api/matchmaking/join - Join matchmaking queue
router.post('/join', matchmakingController.joinQueue);

// DELETE /api/matchmaking/leave - Leave queue or cancel match
router.delete('/leave', matchmakingController.leaveQueue);

// POST /api/matchmaking/start - Confirm found match
router.post('/start', matchmakingController.confirmMatch);

// GET /api/matchmaking/status - Get player matchmaking status
router.get('/status', matchmakingController.getStatus);

// GET /api/matchmaking/:matchId - Get match details
router.get('/:matchId', matchmakingController.getMatch);

export default router;
