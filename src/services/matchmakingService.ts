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
    // Проверяем, не в очереди ли уже игрок
    if (this.isInQueue(walletAddress)) {
      throw new Error('Player already in queue');
    }

    // Проверяем, нет ли активного матча
    const activeMatch = await this.getActiveMatch(walletAddress);
    if (activeMatch) {
      throw new Error('Player already has an active match');
    }

    // Добавляем в очередь
    const queueEntry: QueueEntry = {
      walletAddress,
      joinedAt: new Date(),
      socketId
    };

    this.queue.push(queueEntry);

    // Уведомляем о присоединении к очереди
    const event: MatchmakingEvents['queueJoined'] = {
      position: this.queue.length,
      queueSize: this.queue.length
    };
    websocketService.emitToUser(walletAddress, 'queueJoined', event);

    // Пытаемся найти матч
    await this.tryCreateMatch();
  }

  /**
   * Удалить игрока из очереди
   */
  async leaveQueue(walletAddress: string): Promise<void> {
    const index = this.queue.findIndex(entry => entry.walletAddress === walletAddress);
    if (index === -1) {
      throw new Error('Player not in queue');
    }

    this.queue.splice(index, 1);

    // Уведомляем о выходе из очереди
    const event: MatchmakingEvents['queueLeft'] = {
      reason: 'manual'
    };
    websocketService.emitToUser(walletAddress, 'queueLeft', event);
  }

  /**
   * Отменить найденный матч (до подтверждения)
   */
  async cancelMatch(walletAddress: string): Promise<void> {
    const match = await Match.findOne({
      $or: [
        { 'player1.walletAddress': walletAddress },
        { 'player2.walletAddress': walletAddress }
      ],
      status: MatchStatus.FOUND
    });

    if (!match) {
      throw new Error('No pending match found');
    }

    await this.cancelMatchById(match.matchId, 'manual');
  }

  /**
   * Подтвердить матч
   */
  async confirmMatch(walletAddress: string): Promise<void> {
    const match = await Match.findOne({
      $or: [
        { 'player1.walletAddress': walletAddress },
        { 'player2.walletAddress': walletAddress }
      ],
      status: MatchStatus.FOUND
    });

    if (!match) {
      throw new Error('No pending match found');
    }

    // Обновляем статус игрока
    if (match.player1.walletAddress === walletAddress) {
      match.player1.status = PlayerMatchStatus.CONFIRMED;
    } else {
      match.player2.status = PlayerMatchStatus.CONFIRMED;
    }

    // Проверяем, подтвердили ли оба игрока
    if (match.player1.status === PlayerMatchStatus.CONFIRMED && 
        match.player2.status === PlayerMatchStatus.CONFIRMED) {
      
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
    const inQueue = this.isInQueue(walletAddress);
    const queuePosition = inQueue ? this.getQueuePosition(walletAddress) : undefined;
    const activeMatch = await this.getActiveMatch(walletAddress);

    return {
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
  }

  /**
   * Получить информацию о матче
   */
  async getMatch(matchId: string): Promise<MatchDocument | null> {
    return await Match.findOne({ matchId });
  }

  /**
   * Обработка отключения игрока
   */
  async handleDisconnection(walletAddress: string): Promise<void> {
    // Удаляем из очереди если есть
    const queueIndex = this.queue.findIndex(entry => entry.walletAddress === walletAddress);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
    }

    // Проверяем активный матч
    const activeMatch = await Match.findOne({
      $or: [
        { 'player1.walletAddress': walletAddress },
        { 'player2.walletAddress': walletAddress }
      ],
      status: { $in: [MatchStatus.FOUND, MatchStatus.IN_PROGRESS] }
    });

    if (activeMatch) {
      if (activeMatch.status === MatchStatus.FOUND) {
        // Отменяем матч если он еще не подтвержден
        await this.cancelMatchById(activeMatch.matchId, 'opponent_left');
      } else if (activeMatch.status === MatchStatus.IN_PROGRESS) {
        // Запускаем таймер на автопобеду оппонента
        this.startDisconnectTimer(activeMatch.matchId, walletAddress);
      }
    }
  }

  /**
   * Завершить матч
   */
  async completeMatch(matchId: string, result: MatchResult): Promise<void> {
    const match = await Match.findOne({ matchId });
    if (!match) {
      throw new Error('Match not found');
    }

    match.status = MatchStatus.COMPLETED;
    match.completedAt = new Date();
    match.result = result;
    match.winner = result.winner;

    await match.save();

    // Очищаем таймеры
    this.clearDisconnectTimer(matchId);

    // Уведомляем игроков
    const event: MatchmakingEvents['matchCompleted'] = {
      matchId,
      result
    };
    
    websocketService.emitToUser(match.player1.walletAddress, 'matchCompleted', event);
    websocketService.emitToUser(match.player2.walletAddress, 'matchCompleted', event);
  }

  // Приватные методы

  private isInQueue(walletAddress: string): boolean {
    return this.queue.some(entry => entry.walletAddress === walletAddress);
  }

  private getQueuePosition(walletAddress: string): number {
    const index = this.queue.findIndex(entry => entry.walletAddress === walletAddress);
    return index + 1;
  }

  private async getActiveMatch(walletAddress: string): Promise<MatchDocument | null> {
    return await Match.findOne({
      $or: [
        { 'player1.walletAddress': walletAddress },
        { 'player2.walletAddress': walletAddress }
      ],
      status: { $in: [MatchStatus.FOUND, MatchStatus.IN_PROGRESS] }
    });
  }

  private async tryCreateMatch(): Promise<void> {
    if (this.queue.length < 2) return;

    // Берем первых двух игроков из очереди
    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;

    // Создаем матч
    const matchId = uuidv4();
    const match = new Match({
      matchId,
      player1: {
        walletAddress: player1.walletAddress,
        status: PlayerMatchStatus.WAITING,
        socketId: player1.socketId
      },
      player2: {
        walletAddress: player2.walletAddress,
        status: PlayerMatchStatus.WAITING,
        socketId: player2.socketId
      },
      status: MatchStatus.FOUND,
      createdAt: new Date()
    });

    await match.save();

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

    // Уведомляем о выходе из очереди
    const queueLeftEvent: MatchmakingEvents['queueLeft'] = {
      reason: 'match_found'
    };
    websocketService.emitToUser(player1.walletAddress, 'queueLeft', queueLeftEvent);
    websocketService.emitToUser(player2.walletAddress, 'queueLeft', queueLeftEvent);

    // Запускаем таймер для автоотмены матча
    this.startConfirmationTimer(matchId);
  }

  private startConfirmationTimer(matchId: string): void {
    const timer = setTimeout(async () => {
      await this.cancelMatchById(matchId, 'timeout');
    }, this.MATCH_CONFIRMATION_TIMEOUT);

    this.confirmationTimers.set(matchId, timer);
  }

  private clearConfirmationTimer(matchId: string): void {
    const timer = this.confirmationTimers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.confirmationTimers.delete(matchId);
    }
  }

  private startDisconnectTimer(matchId: string, disconnectedPlayer: string): void {
    const timer = setTimeout(async () => {
      const match = await Match.findOne({ matchId });
      if (match && match.status === MatchStatus.IN_PROGRESS) {
        const winner = match.getOpponent(disconnectedPlayer);
        const result: MatchResult = {
          winner,
          loser: disconnectedPlayer,
          reason: 'disconnect',
          duration: match.startedAt ? Math.floor((Date.now() - match.startedAt.getTime()) / 1000) : 0
        };
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
      }
    });
  }

  private clearDisconnectTimer(matchId: string): void {
    const timer = this.disconnectTimers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(matchId);
    }
  }

  private async cancelMatchById(matchId: string, reason: 'timeout' | 'opponent_left' | 'manual'): Promise<void> {
    const match = await Match.findOne({ matchId });
    if (!match) return;

    match.status = MatchStatus.CANCELLED;
    await match.save();

    // Очищаем таймеры
    this.clearConfirmationTimer(matchId);

    // Уведомляем игроков
    const event: MatchmakingEvents['matchCancelled'] = {
      matchId,
      reason
    };

    websocketService.emitToUser(match.player1.walletAddress, 'matchCancelled', event);
    websocketService.emitToUser(match.player2.walletAddress, 'matchCancelled', event);
  }
}

export default new MatchmakingService();
