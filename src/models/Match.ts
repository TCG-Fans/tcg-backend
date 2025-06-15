import mongoose, { Schema, Document } from 'mongoose';

// Enums
export enum MatchStatus {
  FOUND = 'found',           // Матч найден, ожидание подтверждения
  CONFIRMED = 'confirmed',   // Оба игрока подтвердили
  IN_PROGRESS = 'in_progress', // Матч начался
  COMPLETED = 'completed',   // Матч завершен
  CANCELLED = 'cancelled'    // Матч отменен
}

export enum PlayerMatchStatus {
  WAITING = 'waiting',       // Ожидает подтверждения
  CONFIRMED = 'confirmed',   // Подтвердил матч
  DISCONNECTED = 'disconnected' // Отключился
}

// Interfaces
export interface QueueEntry {
  walletAddress: string;
  joinedAt: Date;
  socketId: string;
}

export interface MatchResult {
  winner: string;
  loser: string;
  reason: 'victory' | 'disconnect' | 'timeout';
  duration?: number; // в секундах
}

export interface IMatch extends Document {
  matchId: string;
  player1: {
    walletAddress: string;
    status: PlayerMatchStatus;
    socketId?: string;
  };
  player2: {
    walletAddress: string;
    status: PlayerMatchStatus;
    socketId?: string;
  };
  status: MatchStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: MatchResult;
  winner?: string;
}

// WebSocket Events
export interface MatchmakingEvents {
  queueJoined: {
    position: number;
    queueSize: number;
  };
  queueLeft: {
    reason: 'manual' | 'match_found';
  };
  matchFound: {
    matchId: string;
    opponent: string;
    timeToConfirm: number; // секунды до автоотмены
  };
  matchCancelled: {
    matchId: string;
    reason: 'timeout' | 'opponent_left' | 'manual';
  };
  matchStarted: {
    matchId: string;
    opponent: string;
    startedAt: Date;
  };
  opponentDisconnected: {
    matchId: string;
    timeToWin: number; // секунды до автопобеды
  };
  matchCompleted: {
    matchId: string;
    result: MatchResult;
  };
}

// Schema
const MatchSchema = new Schema({
  matchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  player1: {
    walletAddress: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(PlayerMatchStatus),
      default: PlayerMatchStatus.WAITING
    },
    socketId: String
  },
  player2: {
    walletAddress: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(PlayerMatchStatus),
      default: PlayerMatchStatus.WAITING
    },
    socketId: String
  },
  status: {
    type: String,
    enum: Object.values(MatchStatus),
    default: MatchStatus.FOUND,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  startedAt: Date,
  completedAt: Date,
  result: {
    winner: String,
    loser: String,
    reason: {
      type: String,
      enum: ['victory', 'disconnect', 'timeout']
    },
    duration: Number
  },
  winner: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
MatchSchema.index({ 'player1.walletAddress': 1, status: 1 });
MatchSchema.index({ 'player2.walletAddress': 1, status: 1 });
MatchSchema.index({ status: 1, createdAt: -1 });

// Метод для получения оппонента
MatchSchema.methods.getOpponent = function(walletAddress: string): string {
  return this.player1.walletAddress === walletAddress 
    ? this.player2.walletAddress 
    : this.player1.walletAddress;
};

// Метод для проверки, является ли игрок участником матча
MatchSchema.methods.isPlayer = function(walletAddress: string): boolean {
  return this.player1.walletAddress === walletAddress || 
         this.player2.walletAddress === walletAddress;
};

// Метод для получения статуса игрока
MatchSchema.methods.getPlayerStatus = function(walletAddress: string): PlayerMatchStatus | null {
  if (this.player1.walletAddress === walletAddress) {
    return this.player1.status;
  }
  if (this.player2.walletAddress === walletAddress) {
    return this.player2.status;
  }
  return null;
};

// Document interface with methods
export interface MatchDocument extends IMatch {
  getOpponent(walletAddress: string): string;
  isPlayer(walletAddress: string): boolean;
  getPlayerStatus(walletAddress: string): PlayerMatchStatus | null;
}

export default mongoose.model<MatchDocument>('Match', MatchSchema);
