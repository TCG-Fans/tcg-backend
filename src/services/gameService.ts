/**
 * Game Service
 *
 * This service integrates the game-engine with the matchmaking system
 * and provides game-related functionality for the TCG backend.
 */

import { GameEngineAdapter } from '../adapters/gameEngineAdapter';
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
   * Create a new game session from a confirmed match
   * @param matchId - ID of the confirmed match
   * @param player1Wallet - ID of the first player
   * @param player2Wallet - ID of the second player
   * @returns The created game session
   */
  public async createGameSession(matchId: string, player1Wallet: string, player2Wallet: string): Promise<any> {

    // Initialize game using the adapter
    const gameInstance = await GameEngineAdapter.initializeGame(player1Wallet, player2Wallet);

  }
}

export default GameService;
