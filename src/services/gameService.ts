/**
 * Game Service
 *
 * This service integrates the game-engine with the matchmaking system
 * and provides game-related functionality for the TCG backend.
 */

import { GameEngineAdapter } from '../adapters/gameEngineAdapter';
import { TurnPhase } from '../lib/game-engine/src/common/game/model';
import { BackendEvents, toFrontendEvent } from '../lib/game-engine/src/server/events';
import { ServerGame } from '../lib/game-engine/src/server/game';
import websocketService from './websocketService';

export interface GameSession {
  engine: ServerGame;
  context: any;
}

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
   * Emits game events to both players
   * @param eventType - Type of game event
   * @param eventData - Event data
   * @param player1Wallet - First player's wallet address
   * @param player2Wallet - Second player's wallet address
   */
  private emitGameEvent(eventType: keyof BackendEvents, eventData: any, player1Wallet: string, player2Wallet: string): void {
    // For player 1
    const player1Event = toFrontendEvent(eventType, { [eventType]: eventData } as any, true);
    websocketService.emitFromGameEngineToUser(player1Wallet, player1Event);

    // For player 2
    const player2Event = toFrontendEvent(eventType, { [eventType]: eventData } as any, false);
    websocketService.emitFromGameEngineToUser(player2Wallet, player2Event);
  }

  /**
   * Creates a new game session between two players
   * @param matchId - Match ID
   * @param player1Wallet - First player's wallet address
   * @param player2Wallet - Second player's wallet address
   * @returns Game session ID
   */
  async createGameSession(matchId: string, player1Wallet: string, player2Wallet: string): Promise<any> {
    console.log(`Creating game session between ${player1Wallet} and ${player2Wallet}`);

    // Initialize game using the adapter
    const gameInstance = await GameEngineAdapter.initializeGame(player1Wallet, player2Wallet);
    this.activeSessions.set(matchId, gameInstance);
  }
}

export default GameService;
