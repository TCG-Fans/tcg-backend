import Deck, { IDeck, IDeckCard } from '../models/Deck';
import Card, { ICard } from '../models/Card';
import User, { IUser } from '../models/User';
import { Document } from 'mongoose';
import websocketService from './websocketService';

class DeckService {
  /**
   * Get user's active deck
   */
  async getUserDeck(walletAddress: string): Promise<any> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find user's active deck
      let deck: any = await Deck.findOne({ 
        walletAddress: normalizedAddress, 
        isActive: true 
      });

      // If no active deck exists, create a default one
      if (!deck) {
        deck = await this.createDefaultDeck(normalizedAddress);
      }

      return deck;
    } catch (error) {
      console.error('Error fetching user deck:', error);
      throw new Error('Failed to fetch user deck');
    }
  }

  /**
   * Get user's deck with full card details
   */
  async getUserDeckWithDetails(walletAddress: string): Promise<{deck: any, cardsWithDetails: {card: ICard, deckCard: IDeckCard}[]} | null> {
    try {
      const deck = await this.getUserDeck(walletAddress);
      
      if (!deck || !deck.cards || deck.cards.length === 0) {
        return { deck: deck!, cardsWithDetails: [] };
      }

      // Get all card IDs from deck
      const cardIds = deck.cards.map((card: IDeckCard) => card.cardId);

      // Get all cards data
      const cards = await Card.find({ cardId: { $in: cardIds } }).lean();

      // Map deck cards with their data
      const cardsWithDetails = deck.cards.map((deckCard: IDeckCard) => {
        const cardData = cards.find((card: ICard) => card.cardId === deckCard.cardId);
        return {
          card: cardData as ICard,
          deckCard: deckCard
        };
      }).filter((item: {card: ICard, deckCard: IDeckCard}) => item.card !== null);

      return { deck, cardsWithDetails };
    } catch (error) {
      console.error('Error fetching user deck with details:', error);
      throw new Error('Failed to fetch user deck with details');
    }
  }

  /**
   * Add card to user's deck
   */
  async addCardToDeck(walletAddress: string, cardId: number, quantity: number = 1): Promise<any> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();

      // Validate that user owns the card
      const user = await User.findOne({ walletAddress: normalizedAddress });
      if (!user) {
        throw new Error('User not found');
      }

      const userCard = user.cards.find(card => card.cardId === cardId);
      if (!userCard) {
        throw new Error('User does not own this card');
      }

      // Validate that card exists
      const card = await Card.findOne({ cardId });
      if (!card) {
        throw new Error('Card not found');
      }

      // Get user's deck
      let deck = await this.getUserDeck(normalizedAddress);
      if (!deck) {
        deck = await this.createDefaultDeck(normalizedAddress);
      }

      // Check if card is already in deck
      const existingCardIndex = deck.cards.findIndex((card: IDeckCard) => card.cardId === cardId);

      if (existingCardIndex >= 0) {
        // Update quantity (max 2 per card)
        const newQuantity = deck.cards[existingCardIndex].quantity + quantity;
        
        // Check maximum limit of 2 cards per type
        if (newQuantity > 2) {
          throw new Error('Maximum 2 cards of the same type allowed in deck');
        }
        
        // Check if user has enough cards
        if (newQuantity > userCard.quantity) {
          throw new Error('Not enough cards in collection');
        }

        deck.cards[existingCardIndex].quantity = newQuantity;
      } else {
        // Add new card to deck
        if (quantity > userCard.quantity) {
          throw new Error('Not enough cards in collection');
        }

        if (quantity > 2) {
          throw new Error('Maximum 2 cards of the same type allowed in deck');
        }

        deck.cards.push({
          cardId,
          quantity: Math.min(quantity, 2)
        });
      }

      // Save deck
      await deck.save();
      
      // Emit WebSocket event for deck update
      websocketService.emitToUser(normalizedAddress, 'deckUpdated', {
        walletAddress: normalizedAddress,
        action: 'add',
        cardId,
        quantity
      });
      
      return deck;
    } catch (error) {
      console.error('Error adding card to deck:', error);
      throw error;
    }
  }

  /**
   * Remove card from user's deck
   */
  async removeCardFromDeck(walletAddress: string, cardId: number, quantity?: number): Promise<any> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();

      // Get user's deck
      const deck = await this.getUserDeck(normalizedAddress);
      if (!deck) {
        throw new Error('Deck not found');
      }

      // Find card in deck
      const cardIndex = deck.cards.findIndex((card: IDeckCard) => card.cardId === cardId);
      if (cardIndex === -1) {
        throw new Error('Card not found in deck');
      }

      // If quantity is specified, reduce by that amount, otherwise remove completely
      if (quantity && quantity > 0) {
        const newQuantity = deck.cards[cardIndex].quantity - quantity;
        
        if (newQuantity <= 0) {
          // Remove card completely
          deck.cards.splice(cardIndex, 1);
        } else {
          // Update quantity
          deck.cards[cardIndex].quantity = newQuantity;
        }
      } else {
        // Remove card completely
        deck.cards.splice(cardIndex, 1);
      }

      // Save deck
      await deck.save();
      
      // Emit WebSocket event for deck update
      websocketService.emitToUser(normalizedAddress, 'deckUpdated', {
        walletAddress: normalizedAddress,
        action: 'remove',
        cardId
      });
      
      return deck;
    } catch (error) {
      console.error('Error removing card from deck:', error);
      throw error;
    }
  }

  /**
   * Create default deck for user
   */
  private async createDefaultDeck(walletAddress: string): Promise<any> {
    try {
      // Deactivate any existing active decks (safety measure)
      await Deck.updateMany(
        { walletAddress, isActive: true },
        { isActive: false }
      );

      // Create new default deck
      const deck = new Deck({
        walletAddress,
        name: 'My Deck',
        cards: [],
        isActive: true
      });

      await deck.save();
      
      // Emit WebSocket event for new deck creation
      websocketService.emitToUser(walletAddress, 'deckUpdated', {
        walletAddress,
        action: 'add',
        cardId: 1, // Default card
        quantity: 1
      });
      
      return deck;
    } catch (error) {
      console.error('Error creating default deck:', error);
      throw new Error('Failed to create default deck');
    }
  }

  /**
   * Clear deck (remove all cards)
   */
  async clearDeck(walletAddress: string): Promise<any> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      const deck = await this.getUserDeck(normalizedAddress);
      if (!deck) {
        throw new Error('Deck not found');
      }

      deck.cards = [];
      await deck.save();
      
      // Emit WebSocket event for deck clear
      websocketService.emitToUser(normalizedAddress, 'deckUpdated', {
        walletAddress: normalizedAddress,
        action: 'clear'
      });
      
      return deck;
    } catch (error) {
      console.error('Error clearing deck:', error);
      throw error;
    }
  }
}

export default new DeckService();
