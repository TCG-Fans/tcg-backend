import { Router, Request, Response } from 'express';
import baseRoutes from './baseRoutes';
import cardRoutes from './cardRoutes';
import authRoutes from './authRoutes';
import deckRoutes from './deckRoutes';
import matchmakingRoutes from './matchmakingRoutes';

const router = Router();

// Basic ping route
router.use('/', baseRoutes)

// Mount auth routes on /auth
// Now they will be accessible at /api/auth/...
router.use('/auth', authRoutes);

// Mount card routes on /cards
// Now they will be accessible at /api/cards/...
router.use('/cards', cardRoutes);

// Mount deck routes on /deck
// Now they will be accessible at /api/deck/...
router.use('/deck', deckRoutes);

// Mount matchmaking routes on /matchmaking
// Now they will be accessible at /api/matchmaking/...
router.use('/matchmaking', matchmakingRoutes);

export default router;
