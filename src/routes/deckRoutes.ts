import { Router } from 'express';
import deckController from '../controllers/deckController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All deck routes require authentication
router.use(authenticate);

// GET /api/deck - Get user's current deck
router.get('/', deckController.getDeck);

// PUT /api/deck/:cardId - Add card to deck
router.put('/:cardId', deckController.addCardToDeck);

// DELETE /api/deck/:cardId - Remove card from deck
router.delete('/:cardId', deckController.removeCardFromDeck);

// DELETE /api/deck - Clear deck (remove all cards)
router.delete('/', deckController.clearDeck);

export default router;
