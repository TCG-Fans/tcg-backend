/**
 * Game Service
 *
 * This service integrates the game-engine with the matchmaking system
 * and provides game-related functionality for the TCG backend.
 */

import { GameEngineAdapter } from '../adapters/gameEngineAdapter';
import { BackendEvents, toFrontendEvent } from '../lib/game-engine/src/server/events';
import { ServerGame } from '../lib/game-engine/src/server/game';
import websocketService from './websocketService';

/**
 * GameService manages game sessions and integrates with the game-engine
 */
export class GameService {
  private static instance: GameService;
  private activeSessions: Map<string, ServerGame> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Get WebSocketService instance for real-time communication
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  /**
   * Creates a new game session between two players
   * @param player1Wallet - First player's wallet address
   * @param player2Wallet - Second player's wallet address
   * @returns Game session ID
   */
  async createGameSession(matchId: string, player1Wallet: string, player2Wallet: string): Promise<any> {
    console.log(`Creating game session between ${player1Wallet} and ${player2Wallet}`);

    // Initialize game using the adapter
    const gameInstance = await GameEngineAdapter.initializeGame(player1Wallet, player2Wallet);

    // Set up event listeners for game events
    const gameEvents: (keyof BackendEvents)[] = [
      'card-draw', 'summon', 'destroy', 'new-power', 'batch-new-power',
      'discard', 'end', 'phase-change', 'max-mana', 'mana-refresh'
    ];

    // Set up event handlers for all game events
    gameEvents.forEach(eventType => {
      gameInstance.emitter.on(eventType, (eventData) => {
        // For player 1
        const player1Event = toFrontendEvent(eventType, { [eventType]: eventData } as any, true);
        websocketService.emitFromGameEngineToUser(player1Wallet, player1Event);

        // For player 2
        const player2Event = toFrontendEvent(eventType, { [eventType]: eventData } as any, false);
        websocketService.emitFromGameEngineToUser(player2Wallet, player2Event);

      });
    });
  }
}

export default GameService;
