/**
 * Game Engine Adapter
 *
 * This adapter provides an interface between the TCG backend and the game-engine submodule.
 * It abstracts the game-engine functionality and provides simplified methods for the main application.
 */

import { ServerGame } from '../lib/game-engine/src/server/game';
import { Card } from '../lib/game-engine/src/common/game/card';
import { createCardById } from '../lib/game-engine/src/common/game/cardpool';
import deckService from '../services/deckService';
import { IDeck, IDeckCard } from '../models/Deck';
import cuid from 'cuid';

/**
 * GameEngineAdapter class provides methods to interact with the game-engine
 */
export class GameEngineAdapter {
  /**
   * Creates game cards from a player's deck
   * @param deck - Player's deck containing card IDs and quantities
   * @returns Array of game engine cards
   */
  private static createCardsFromDeck(deck: IDeck): Card<any>[] {
    const cards: Card<any>[] = [];
    
    // For each card in the deck, create the corresponding game cards
    // according to their quantity
    for (const deckCard of deck.cards) {
      // Create as many instances as specified in the quantity field
      this.createCardsFromDeckCard(deckCard, cards);
    }
    
    return cards;
  }
  
  /**
   * Creates multiple instances of a card based on its quantity
   * @param deckCard - Card from the deck with ID and quantity
   * @param cardsArray - Array to push created cards into
   */
  private static createCardsFromDeckCard(deckCard: IDeckCard, cardsArray: Card<any>[]): void {
    for (let i = 0; i < deckCard.quantity; i++) {
      // Generate a unique ID for each card instance
      const cardId = cuid();
      // Create the card using its type ID
      const card = createCardById(deckCard.cardId, cardId);
      
      // If the card was successfully created, add it to the array
      if (card) {
        cardsArray.push(card);
      }
    }
  }

  /**
   * Initialize a new game instance
   * @param playerWallet1 - Wallet address of the first player
   * @param playerWallet2 - Wallet address of the second player
   * @returns A new game instance with cards from both players' decks
   */
  static async initializeGame(playerWallet1: string, playerWallet2: string): Promise<ServerGame> {
    // Get both players' decks
    const deck1: IDeck = await deckService.getUserDeck(playerWallet1);
    const deck2: IDeck = await deckService.getUserDeck(playerWallet2);
    
    // Create card arrays for the game engine
    const player1Cards: Card<any>[] = this.createCardsFromDeck(deck1);
    const player2Cards: Card<any>[] = this.createCardsFromDeck(deck2);
    
    // Create a new game session with both players' cards
    // The last parameter (false) indicates this is not a blockchain game
    return new ServerGame(player1Cards, player2Cards, false);
  }

  /**
   * Get game engine version information
   * @returns Version information object
   */
  static getEngineInfo(): { name: string; version: string } {
    return {
      name: 'TCG Game Engine',
      version: '1.0.0'
    };
  }
}

// Export default adapter
export default GameEngineAdapter;
