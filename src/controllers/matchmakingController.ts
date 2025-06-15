import { Request, Response } from 'express';
import matchmakingService from '../services/matchmakingService';
import Match, { MatchStatus } from '../models/Match';
import websocketService from '../services/websocketService';

interface AuthenticatedRequest extends Request {
  user?: {
    walletAddress: string;
  };
}

class MatchmakingController {
  /**
   * Join matchmaking queue
   * POST /api/matchmaking/join
   */
  async joinQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletAddress = req.user!.walletAddress;
      
      // Получаем socketId пользователя
      const socketId = websocketService.getUserSocketId(walletAddress);
      if (!socketId) {
        res.status(400).json({ 
          success: false,
          error: 'WebSocket connection required for matchmaking' 
        });
        return;
      }

      await matchmakingService.joinQueue(walletAddress, socketId);
      
      res.json({ 
        success: true, 
        message: 'Joined matchmaking queue' 
      });
    } catch (error) {
      console.error('Error joining queue:', error);
      res.status(400).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join queue' 
      });
    }
  }

  /**
   * Leave queue or cancel match
   * DELETE /api/matchmaking/leave
   */
  async leaveQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletAddress = req.user!.walletAddress;
      
      // Пытаемся сначала покинуть очередь
      try {
        await matchmakingService.leaveQueue(walletAddress);
        res.json({ 
          success: true, 
          message: 'Left matchmaking queue' 
        });
        return;
      } catch (queueError) {
        // Если не в очереди, пытаемся отменить матч
        try {
          await matchmakingService.cancelMatch(walletAddress);
          res.json({ 
            success: true, 
            message: 'Match cancelled' 
          });
          return;
        } catch (matchError) {
          res.status(400).json({ 
            success: false,
            error: 'Not in queue and no pending match found' 
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error leaving queue/cancelling match:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Confirm found match
   * POST /api/matchmaking/start
   */
  async confirmMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletAddress = req.user!.walletAddress;
      
      await matchmakingService.confirmMatch(walletAddress);
      
      res.json({ 
        success: true, 
        message: 'Match confirmed' 
      });
    } catch (error) {
      console.error('Error confirming match:', error);
      res.status(400).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm match' 
      });
    }
  }

  /**
   * Get player matchmaking status
   * GET /api/matchmaking/status
   */
  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletAddress = req.user!.walletAddress;
      
      const status = await matchmakingService.getPlayerStatus(walletAddress);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting matchmaking status:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get status' 
      });
    }
  }

  /**
   * Get match details
   * GET /api/matches/:matchId
   */
  async getMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      const walletAddress = req.user!.walletAddress;
      
      const match = await matchmakingService.getMatch(matchId);
      
      if (!match) {
        res.status(404).json({ 
          success: false,
          error: 'Match not found' 
        });
        return;
      }

      // Проверяем, что пользователь является участником матча
      if (!match.isPlayer(walletAddress)) {
        res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
        return;
      }

      res.json({
        success: true,
        data: {
          matchId: match.matchId,
          status: match.status,
          opponent: match.getOpponent(walletAddress),
          playerStatus: match.getPlayerStatus(walletAddress),
          createdAt: match.createdAt,
          startedAt: match.startedAt,
          completedAt: match.completedAt,
          result: match.result,
          winner: match.winner
        }
      });
    } catch (error) {
      console.error('Error getting match:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get match' 
      });
    }
  }
}

export default new MatchmakingController();
