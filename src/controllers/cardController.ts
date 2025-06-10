import { Request, Response } from 'express';
import cardService from '../services/cardService';

class CardController {  // Get all cards
  async getAllCards(req: Request, res: Response): Promise<void> {
    try {
      const cards = await cardService.getAllCards();
      res.status(200).json({
        success: true,
        count: cards.length,
        data: cards
      });
    } catch (error) {
      console.error('Error in getAllCards controller:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }


  async getCardById(req: Request, res: Response): Promise<void> {
    try {
      const { cardId } = req.params;
      const card = await cardService.getCardById(Number(cardId));

      if (!card) {
        res.status(404).json({
          success: false,
          error: 'Card not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Error in getCardById controller:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }


  // Helper method to validate wallet address
  private static isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get cards owned by the authenticated user
   * Uses the JWT token to identify the user
   */
  async getMyCards(req: Request, res: Response): Promise<void> {
    try {
      // User is already authenticated via middleware
      // req.user is set by the authenticate middleware
      if (!req.user || !req.user.walletAddress) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const walletAddress = req.user.walletAddress;

      // Validate wallet address
      if (!CardController.isValidWalletAddress(walletAddress)) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address format'
        });
        return;
      }

      const userCards = await cardService.getUserCards(walletAddress);

      res.status(200).json({
        success: true,
        count: userCards.length,
        data: userCards
      });
    } catch (error) {
      console.error('Error in getMyCards controller:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
}

export default new CardController();
