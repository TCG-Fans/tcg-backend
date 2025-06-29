import { v4 as uuidv4 } from 'uuid';
import Match, {
  MatchDocument,
  QueueEntry,
  IMatch,
  MatchStatus,
  PlayerMatchStatus,
  MatchResult,
  MatchmakingEvents
} from '../models/Match';
import gameService from './gameService';
import websocketService from './websocketService';

class MatchmakingService {
  private queue: QueueEntry[] = [];
  private readonly MATCH_CONFIRMATION_TIMEOUT = 30000; // 30 секунд
  private readonly DISCONNECT_TIMEOUT = 60000; // 60 секунд
  private confirmationTimers: Map<string, NodeJS.Timeout> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Добавить игрока в очередь
   */
  async joinQueue(walletAddress: string, socketId: string): Promise<void> {
    console.log(`[MATCHMAKING] Player ${walletAddress} attempting to join queue with socket ${socketId}`);

    // Проверяем, не в очереди ли уже игрок
    if (this.isInQueue(walletAddress)) {
      console.log(`[MATCHMAKING] Player ${walletAddress} already in queue - rejecting`);
      throw new Error('Player already in queue');
    }

    // Проверяем, нет ли активного матча
    const activeMatch = await this.getActiveMatch(walletAddress);
    if (activeMatch) {
      console.log(`[MATCHMAKING] Player ${walletAddress} already has active match ${activeMatch.matchId} - rejecting`);
      throw new Error('Player already has an active match');
    }

    // Добавляем в очередь
    const queueEntry: QueueEntry = {
      walletAddress,
      joinedAt: new Date(),
      socketId
    };

    this.queue.push(queueEntry);
    console.log(`[MATCHMAKING] Player ${walletAddress} added to queue. Queue size: ${this.queue.length}`);

    // Уведомляем о присоединении к очереди
    const event: MatchmakingEvents['queueJoined'] = {
      position: this.queue.length,
      queueSize: this.queue.length
    };
    websocketService.emitToUser(walletAddress, 'queueJoined', event);
    console.log(`[MATCHMAKING] Sent queueJoined event to ${walletAddress} - position: ${this.queue.length}, size: ${this.queue.length}`);

    // Пытаемся найти матч
    await this.tryCreateMatch();
  }

  /**
   * Удалить игрока из очереди
   */
  async leaveQueue(walletAddress: string): Promise<void> {
    console.log(`[MATCHMAKING] Player ${walletAddress} attempting to leave queue`);

    const index = this.queue.findIndex(entry => entry.walletAddress === walletAddress);
    if (index === -1) {
      console.log(`[MATCHMAKING] Player ${walletAddress} not found in queue - rejecting`);
      throw new Error('Player not in queue');
    }

    this.queue.splice(index, 1);
    console.log(`[MATCHMAKING] Player ${walletAddress} removed from queue. Queue size: ${this.queue.length}`);

    // Уведомляем о выходе из очереди
    const event: MatchmakingEvents['queueLeft'] = {
      reason: 'manual'
    };
    websocketService.emitToUser(walletAddress, 'queueLeft', event);
    console.log(`[MATCHMAKING] Sent queueLeft event to ${walletAddress} - reason: manual`);
  }

  /**
   * Отменить найденный матч (до подтверждения)
   */
  async cancelMatch(walletAddress: string): Promise<void> {
    console.log(`[MATCHMAKING] Player ${walletAddress} attempting to cancel match`);

    const match = await Match.findOne({
      $or: [
        { 'player1.walletAddress': walletAddress },
        { 'player2.walletAddress': walletAddress }
      ],
      status: MatchStatus.FOUND
    });

    if (!match) {
      console.log(`[MATCHMAKING] No pending match found for player ${walletAddress} - rejecting`);
      throw new Error('No pending match found');
    }

    console.log(`[MATCHMAKING] Found match ${match.matchId} for player ${walletAddress} - cancelling`);
    await this.cancelMatchById(match.matchId, 'manual');
  }

  /**
   * Подтвердить матч
   */
  async confirmMatch(walletAddress: string): Promise<void> {
    console.log(`[MATCHMAKING] Player ${walletAddress} attempting to confirm match`);

    const match = await Match.findOne({
      $or: [
        { 'player1.walletAddress': walletAddress },
        { 'player2.walletAddress': walletAddress }
      ],
      status: MatchStatus.FOUND
    });

    if (!match) {
      console.log(`[MATCHMAKING] No pending match found for player ${walletAddress} - rejecting`);
      throw new Error('No pending match found');
    }

    console.log(`[MATCHMAKING] Found match ${match.matchId} for player ${walletAddress} - confirming`);

    // Обновляем статус игрока
    if (match.player1.walletAddress === walletAddress) {
      match.player1.status = PlayerMatchStatus.CONFIRMED;
      console.log(`[MATCHMAKING] Player1 ${walletAddress} confirmed match ${match.matchId}`);
    } else {
      match.player2.status = PlayerMatchStatus.CONFIRMED;
      console.log(`[MATCHMAKING] Player2 ${walletAddress} confirmed match ${match.matchId}`);
    }

    // Проверяем, подтвердили ли оба игрока
    if (match.player1.status === PlayerMatchStatus.CONFIRMED &&
        match.player2.status === PlayerMatchStatus.CONFIRMED) {

      console.log(`[MATCHMAKING] Both players confirmed match ${match.matchId} - starting match`);

      match.status = MatchStatus.IN_PROGRESS;
      match.startedAt = new Date();


      // Отменяем таймер подтверждения
      this.clearConfirmationTimer(match.matchId);

      // Уведомляем о начале матча
      const event: MatchmakingEvents['matchStarted'] = {
        matchId: match.matchId,
        opponent: match.getOpponent(walletAddress),
        startedAt: match.startedAt
      };

      websocketService.emitToUser(match.player1.walletAddress, 'matchStarted', {
        ...event,
        opponent: match.player2.walletAddress
      });
      websocketService.emitToUser(match.player2.walletAddress, 'matchStarted', {
        ...event,
        opponent: match.player1.walletAddress
      });

      console.log(`[MATCHMAKING] Match ${match.matchId} started between ${match.player1.walletAddress} and ${match.player2.walletAddress}`);
    } else {
      console.log(`[MATCHMAKING] Match ${match.matchId} partially confirmed - waiting for other player`);
      console.log(`[MATCHMAKING] Player1 status: ${match.player1.status}, Player2 status: ${match.player2.status}`);
    }

    await match.save();
  }

  /**
   * Получить статус игрока в матчмейкинге
   */
  async getPlayerStatus(walletAddress: string): Promise<{
    inQueue: boolean;
    queuePosition?: number;
    queueSize?: number;
    activeMatch?: any;
  }> {
    console.log(`[MATCHMAKING] Getting status for player ${walletAddress}`);

    const inQueue = this.isInQueue(walletAddress);
    const queuePosition = inQueue ? this.getQueuePosition(walletAddress) : undefined;
    const activeMatch = await this.getActiveMatch(walletAddress);

    const status = {
      inQueue,
      queuePosition,
      queueSize: this.queue.length,
      activeMatch: activeMatch ? {
        matchId: activeMatch.matchId,
        status: activeMatch.status,
        opponent: activeMatch.getOpponent(walletAddress),
        createdAt: activeMatch.createdAt,
        startedAt: activeMatch.startedAt
      } : undefined
    };

    console.log(`[MATCHMAKING] Player ${walletAddress} status:`, JSON.stringify(status, null, 2));
    return status;
  }

  /**
   * Получить информацию о матче
   */
  async getMatch(matchId: string): Promise<MatchDocument | null> {
    console.log(`[MATCHMAKING] Getting match info for ${matchId}`);

    const match = await Match.findOne({ matchId });
    if (match) {
      console.log(`[MATCHMAKING] Found match ${matchId} with status ${match.status}`);
    } else {
      console.log(`[MATCHMAKING] Match ${matchId} not found`);
    }

    return match;
  }

  /**
   * Обработка отключения игрока
   */
  async handleDisconnection(walletAddress: string): Promise<void> {
    console.log(`[MATCHMAKING] Handling disconnection for player ${walletAddress}`);

    // Удаляем из очереди если есть
    const queueIndex = this.queue.findIndex(entry => entry.walletAddress === walletAddress);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      console.log(`[MATCHMAKING] Removed disconnected player ${walletAddress} from queue. Queue size: ${this.queue.length}`);
    }

    // Проверяем активный матч
    const activeMatch = await this.getActiveMatch(walletAddress);
    if (activeMatch) {
      console.log(`[MATCHMAKING] Player ${walletAddress} has active match ${activeMatch.matchId} - handling disconnect`);

      if (activeMatch.status === MatchStatus.FOUND) {
        // Если матч еще не подтвержден, отменяем его
        console.log(`[MATCHMAKING] Match ${activeMatch.matchId} not confirmed yet - cancelling due to disconnect`);
        await this.cancelMatchById(activeMatch.matchId, 'opponent_left');
      } else if (activeMatch.status === MatchStatus.IN_PROGRESS) {
        // Если матч в процессе, запускаем таймер отключения
        console.log(`[MATCHMAKING] Match ${activeMatch.matchId} in progress - starting disconnect timer for ${walletAddress}`);
        this.startDisconnectTimer(activeMatch.matchId, walletAddress);
      }
    } else {
      console.log(`[MATCHMAKING] Player ${walletAddress} has no active match - disconnect handled`);
    }
  }

  /**
   * Завершить матч
   */
  async completeMatch(matchId: string, result: MatchResult): Promise<void> {
    console.log(`[MATCHMAKING] Completing match ${matchId} with result:`, JSON.stringify(result, null, 2));

    const match = await Match.findOne({ matchId });
    if (!match) {
      console.log(`[MATCHMAKING] Match ${matchId} not found - cannot complete`);
      throw new Error('Match not found');
    }

    match.status = MatchStatus.COMPLETED;
    match.completedAt = new Date();
    match.result = result;

    // Очищаем таймеры
    this.clearConfirmationTimer(matchId);
    this.clearDisconnectTimer(matchId);

    await match.save();

    // Уведомляем игроков о завершении матча
    const event: MatchmakingEvents['matchCompleted'] = {
      matchId,
      result
    };

    websocketService.emitToUser(match.player1.walletAddress, 'matchCompleted', event);
    websocketService.emitToUser(match.player2.walletAddress, 'matchCompleted', event);

    console.log(`[MATCHMAKING] Match ${matchId} completed successfully. Winner: ${result.winner}, Loser: ${result.loser}, Reason: ${result.reason}`);
  }

  async resumeMatch(walletAddress: string, socketId: string): Promise<void> {
    console.log(`[MATCHMAKING] Attempting to resume match for player ${walletAddress} with socket ${socketId}`);

    // Найти активный матч для игрока
    const match = await Match.findOne({
      $or: [
        { 'player1.walletAddress': walletAddress },
        { 'player2.walletAddress': walletAddress }
      ],
      status: { $in: [MatchStatus.IN_PROGRESS, MatchStatus.FOUND] }
    });

    if (!match) {
      console.log(`[MATCHMAKING] No active match found for player ${walletAddress}`);
      return;
    }

    console.log(`[MATCHMAKING] Found active match ${match.matchId} for player ${walletAddress}`);

    // Обновить socketId игрока
    if (match.player1.walletAddress === walletAddress) {
      match.player1.socketId = socketId;
    } else {
      match.player2.socketId = socketId;
    }
    await match.save();
    console.log(`[MATCHMAKING] Updated socket ID for player ${walletAddress} in match ${match.matchId}`);

    // Остановить таймер отключения, если он был запущен
    this.clearDisconnectTimer(match.matchId);

    // Уведомить игрока о возобновлении матча
    const opponent = match.player1.walletAddress === walletAddress
      ? match.player2.walletAddress
      : match.player1.walletAddress;

    if (match.status === MatchStatus.FOUND) {
      // Матч еще в стадии подтверждения
      const timeLeft = this.getConfirmationTimeLeft(match.matchId);
      const event: MatchmakingEvents['matchFound'] = {
        matchId: match.matchId,
        opponent,
        timeToConfirm: timeLeft
      };
      websocketService.emitToUser(walletAddress, 'matchFound', event);
      console.log(`[MATCHMAKING] Sent matchFound event to reconnected player ${walletAddress}`);
    } else if (match.status === MatchStatus.IN_PROGRESS) {
      // Матч уже начался
      const event: MatchmakingEvents['matchStarted'] = {
        matchId: match.matchId,
        opponent,
        startedAt: match.startedAt!
      };
      websocketService.emitToUser(walletAddress, 'matchStarted', event);
      console.log(`[MATCHMAKING] Sent matchStarted event to reconnected player ${walletAddress}`);

      // Уведомить оппонента о переподключении
      const reconnectedEvent = {
        player: walletAddress,
        message: 'Opponent reconnected'
      };
      websocketService.emitToUser(opponent, 'opponentReconnected', reconnectedEvent);
      console.log(`[MATCHMAKING] Notified opponent ${opponent} about player ${walletAddress} reconnection`);
    }
  }

  private getConfirmationTimeLeft(matchId: string): number {
    const timer = this.confirmationTimers.get(matchId);
    if (!timer) {
      console.log(`[MATCHMAKING] No confirmation timer found for match ${matchId}, returning default timeout`);
      return this.MATCH_CONFIRMATION_TIMEOUT / 1000;
    }

    // Приблизительное время, оставшееся до истечения таймера
    // В реальной реализации можно сохранять время начала таймера
    return Math.max(0, this.MATCH_CONFIRMATION_TIMEOUT / 1000);
  }

  // Вспомогательные методы

  private isInQueue(walletAddress: string): boolean {
    const inQueue = this.queue.some(entry => entry.walletAddress === walletAddress);
    console.log(`[MATCHMAKING] Checking if ${walletAddress} is in queue: ${inQueue}`);
    return inQueue;
  }

  private getQueuePosition(walletAddress: string): number {
    const position = this.queue.findIndex(entry => entry.walletAddress === walletAddress) + 1;
    console.log(`[MATCHMAKING] Queue position for ${walletAddress}: ${position}`);
    return position;
  }

  private async getActiveMatch(walletAddress: string): Promise<MatchDocument | null> {
    console.log(`[MATCHMAKING] Checking for active match for ${walletAddress}`);

    const match = await Match.findOne({
      $or: [
        { 'player1.walletAddress': walletAddress },
        { 'player2.walletAddress': walletAddress }
      ],
      status: { $in: [MatchStatus.FOUND, MatchStatus.IN_PROGRESS] }
    });

    if (match) {
      console.log(`[MATCHMAKING] Found active match ${match.matchId} for ${walletAddress} with status ${match.status}`);
    } else {
      console.log(`[MATCHMAKING] No active match found for ${walletAddress}`);
    }

    return match;
  }

  private async tryCreateMatch(): Promise<void> {
    console.log(`[MATCHMAKING] Attempting to create match. Queue size: ${this.queue.length}`);

    if (this.queue.length < 2) {
      console.log(`[MATCHMAKING] Not enough players in queue (${this.queue.length}) - need at least 2`);
      return;
    }

    // Берем первых двух игроков из очереди
    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;

    console.log(`[MATCHMAKING] Creating match between ${player1.walletAddress} and ${player2.walletAddress}`);

    const matchId = uuidv4();
    const match = new Match({
      matchId,
      player1: {
        walletAddress: player1.walletAddress,
        socketId: player1.socketId,
        status: PlayerMatchStatus.WAITING
      },
      player2: {
        walletAddress: player2.walletAddress,
        socketId: player2.socketId,
        status: PlayerMatchStatus.WAITING
      },
      status: MatchStatus.FOUND,
      createdAt: new Date()
    });

    await match.save();
    console.log(`[MATCHMAKING] Match ${matchId} created and saved to database`);

    // Запускаем таймер подтверждения
    this.startConfirmationTimer(matchId);

    // Уведомляем игроков о найденном матче
    const event1: MatchmakingEvents['matchFound'] = {
      matchId,
      opponent: player2.walletAddress,
      timeToConfirm: this.MATCH_CONFIRMATION_TIMEOUT / 1000
    };
    const event2: MatchmakingEvents['matchFound'] = {
      matchId,
      opponent: player1.walletAddress,
      timeToConfirm: this.MATCH_CONFIRMATION_TIMEOUT / 1000
    };

    websocketService.emitToUser(player1.walletAddress, 'matchFound', event1);
    websocketService.emitToUser(player2.walletAddress, 'matchFound', event2);

    console.log(`[MATCHMAKING] Sent matchFound events to both players for match ${matchId}`);
    console.log(`[MATCHMAKING] Confirmation timeout set to ${this.MATCH_CONFIRMATION_TIMEOUT / 1000} seconds`);

    // Пытаемся создать еще матчи если есть игроки
    if (this.queue.length >= 2) {
      console.log(`[MATCHMAKING] More players available (${this.queue.length}) - attempting to create another match`);
      await this.tryCreateMatch();
    }
  }

  private startConfirmationTimer(matchId: string): void {
    console.log(`[MATCHMAKING] Starting confirmation timer for match ${matchId} (${this.MATCH_CONFIRMATION_TIMEOUT / 1000}s)`);

    const timer = setTimeout(async () => {
      console.log(`[MATCHMAKING] Confirmation timeout reached for match ${matchId} - cancelling`);
      await this.cancelMatchById(matchId, 'timeout');
    }, this.MATCH_CONFIRMATION_TIMEOUT);

    this.confirmationTimers.set(matchId, timer);
  }

  private clearConfirmationTimer(matchId: string): void {
    const timer = this.confirmationTimers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.confirmationTimers.delete(matchId);
      console.log(`[MATCHMAKING] Cleared confirmation timer for match ${matchId}`);
    }
  }

  private startDisconnectTimer(matchId: string, disconnectedPlayer: string): void {
    console.log(`[MATCHMAKING] Starting disconnect timer for match ${matchId}, disconnected player: ${disconnectedPlayer} (${this.DISCONNECT_TIMEOUT / 1000}s)`);

    const timer = setTimeout(async () => {
      console.log(`[MATCHMAKING] Disconnect timeout reached for match ${matchId} - completing match`);

      const match = await Match.findOne({ matchId });
      if (match && match.status === MatchStatus.IN_PROGRESS) {
        const winner = match.getOpponent(disconnectedPlayer);
        const result: MatchResult = {
          winner,
          loser: disconnectedPlayer,
          reason: 'disconnect',
          duration: match.startedAt ? Math.floor((Date.now() - match.startedAt.getTime()) / 1000) : 0
        };

        console.log(`[MATCHMAKING] Auto-completing match ${matchId} due to disconnect. Winner: ${winner}`);
        await this.completeMatch(matchId, result);
      }
    }, this.DISCONNECT_TIMEOUT);

    this.disconnectTimers.set(matchId, timer);

    // Уведомляем оппонента
    const match = Match.findOne({ matchId });
    match.then(m => {
      if (m) {
        const opponent = m.getOpponent(disconnectedPlayer);
        const event: MatchmakingEvents['opponentDisconnected'] = {
          matchId,
          timeToWin: this.DISCONNECT_TIMEOUT / 1000
        };
        websocketService.emitToUser(opponent, 'opponentDisconnected', event);
        console.log(`[MATCHMAKING] Sent opponentDisconnected event to ${opponent} for match ${matchId}`);
      }
    });
  }

  private clearDisconnectTimer(matchId: string): void {
    const timer = this.disconnectTimers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(matchId);
      console.log(`[MATCHMAKING] Cleared disconnect timer for match ${matchId}`);
    }
  }

  private async cancelMatchById(matchId: string, reason: 'timeout' | 'opponent_left' | 'manual'): Promise<void> {
    console.log(`[MATCHMAKING] Cancelling match ${matchId} with reason: ${reason}`);

    const match = await Match.findOne({ matchId });
    if (!match) {
      console.log(`[MATCHMAKING] Match ${matchId} not found - cannot cancel`);
      return;
    }

    match.status = MatchStatus.CANCELLED;
    await match.save();
    console.log(`[MATCHMAKING] Match ${matchId} status updated to CANCELLED`);

    // Очищаем таймеры
    this.clearConfirmationTimer(matchId);

    // Уведомляем игроков
    const event: MatchmakingEvents['matchCancelled'] = {
      matchId,
      reason
    };

    websocketService.emitToUser(match.player1.walletAddress, 'matchCancelled', event);
    websocketService.emitToUser(match.player2.walletAddress, 'matchCancelled', event);

    console.log(`[MATCHMAKING] Sent matchCancelled events to both players for match ${matchId}`);
  }

}

export default new MatchmakingService();
