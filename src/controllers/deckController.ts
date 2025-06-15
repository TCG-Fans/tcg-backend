import { Request, Response } from 'express';
import deckService from '../services/deckService';
import { mapDeckToDto, mapDeckToExtendedDto } from '../utils/mappers';

interface AuthenticatedRequest extends Request {
  user?: {
    walletAddress: string;
  };
}

class DeckController {
  /**
   * Get user's current deck
   * GET /api/deck
   */
  async getDeck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;
      
      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      // Get deck with full card details
      const deckData = await deckService.getUserDeckWithDetails(walletAddress);
      
      if (!deckData) {
        res.status(404).json({
          success: false,
          error: 'Deck not found'
        });
        return;
      }

      // Map to extended DTO with card details
      const deckDto = mapDeckToExtendedDto(deckData.deck, deckData.cardsWithDetails);

      const response = {
        success: true,
        data: {
          deck: deckDto
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getDeck controller:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }

  /**
   * Add card to deck
   * PUT /api/deck/:cardId
   */
  async addCardToDeck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;
      const { cardId } = req.params;
      const { quantity = 1 } = req.body;

      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (!cardId || isNaN(Number(cardId))) {
        res.status(400).json({
          success: false,
          error: 'Invalid card ID'
        });
        return;
      }

      if (quantity < 1 || quantity > 2) {
        res.status(400).json({
          success: false,
          error: 'Quantity must be between 1 and 2'
        });
        return;
      }

      // Add card to deck
      const updatedDeck = await deckService.addCardToDeck(
        walletAddress, 
        Number(cardId), 
        Number(quantity)
      );

      // Map to DTO
      const deckDto = mapDeckToDto(updatedDeck);

      const response = {
        success: true,
        message: 'Card added to deck successfully',
        data: deckDto
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in addCardToDeck controller:', error);
      
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('not found') || 
            error.message.includes('does not own') ||
            error.message.includes('Not enough cards') ||
            error.message.includes('Maximum 2 cards')) {
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }

  /**
   * Remove card from deck
   * DELETE /api/deck/:cardId
   */
  async removeCardFromDeck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;
      const { cardId } = req.params;
      const { quantity } = req.body;

      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (!cardId || isNaN(Number(cardId))) {
        res.status(400).json({
          success: false,
          error: 'Invalid card ID'
        });
        return;
      }

      // Remove card from deck
      const updatedDeck = await deckService.removeCardFromDeck(
        walletAddress, 
        Number(cardId),
        quantity ? Number(quantity) : undefined
      );

      // Map to DTO
      const deckDto = mapDeckToDto(updatedDeck);

      const response = {
        success: true,
        message: 'Card removed from deck successfully',
        data: deckDto
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in removeCardFromDeck controller:', error);
      
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }

  /**
   * Clear deck (remove all cards)
   * DELETE /api/deck
   */
  async clearDeck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;

      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      // Clear deck
      const clearedDeck = await deckService.clearDeck(walletAddress);

      // Map to DTO
      const deckDto = mapDeckToDto(clearedDeck);

      const response = {
        success: true,
        message: 'Deck cleared successfully',
        data: deckDto
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in clearDeck controller:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }

}

export default new DeckController();
