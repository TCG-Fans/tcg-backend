import { Router } from 'express';
import cardController from '../controllers/cardController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Route for getting all cards (public)
router.get('/', cardController.getAllCards);

// Route for getting authenticated user's cards (protected)
router.get('/my', authenticate, cardController.getMyCards);

// Route for getting wallet's cards (protected)
router.get('/wallet/:walletAddress', cardController.getCardsByWalletAddress);

// Route for getting card by ID (public)
router.get('/:cardId', cardController.getCardById);

export default router;
