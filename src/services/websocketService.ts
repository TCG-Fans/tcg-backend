import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import authService from './authService';
import matchmakingService from './matchmakingService';
import { MatchmakingEvents } from '../models/Match';

export interface WebSocketEvents extends MatchmakingEvents {
  // Card events
  cardAdded: {
    walletAddress: string;
    cardId: number;
    quantity: number;
  };

  // Deck events
  deckUpdated: {
    walletAddress: string;
    action: 'add' | 'remove' | 'clear';
    cardId?: number;
    quantity?: number;
  };

  // User events
  userConnected: {
    walletAddress: string;
    timestamp: Date;
  };

  userDisconnected: {
    walletAddress: string;
    timestamp: Date;
  };
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // walletAddress -> Set of socketIds

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: true, // Allow all origins for development
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('WebSocket service initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', async (socket) => {
      console.log(`WebSocket client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (token: string) => {
        try {
          console.log('Received token: {}', token);
          // const tokenJson = JSON.parse(token)
          const decoded = authService.verifyToken(token);
          console.log('Decoded token:', decoded);
          if (!decoded) {
            throw new Error('Invalid token');
          }

          const walletAddress = decoded.walletAddress.toLowerCase();

          // Join user to their personal room
          socket.join(`user:${walletAddress}`);

          // Track connected user
          if (!this.connectedUsers.has(walletAddress)) {
            this.connectedUsers.set(walletAddress, new Set());
          }
          this.connectedUsers.get(walletAddress)!.add(socket.id);

          // Store wallet address in socket data
          socket.data.walletAddress = walletAddress;
          socket.data.authenticated = true;

          console.log(`User authenticated: ${walletAddress} (socket: ${socket.id})`);

          // Emit user connected event
          this.emitToUser(walletAddress, 'userConnected', {
            walletAddress,
            timestamp: new Date()
          });

          // Try to resume any active match for this player
          try {
            await matchmakingService.resumeMatch(walletAddress, socket.id);
          } catch (error) {
            console.error(`Error resuming match for ${walletAddress}:`, error);
          }

          socket.emit('authenticated', { success: true, walletAddress });
        } catch (error) {
          console.error('WebSocket authentication failed:', error);
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);

        if (socket.data.walletAddress && socket.data.authenticated) {
          const walletAddress = socket.data.walletAddress;
          const userSockets = this.connectedUsers.get(walletAddress);

          if (userSockets) {
            userSockets.delete(socket.id);

            // If no more sockets for this user, remove from connected users
            if (userSockets.size === 0) {
              this.connectedUsers.delete(walletAddress);

              // Emit user disconnected event
              this.emitToUser(walletAddress, 'userDisconnected', {
                walletAddress,
                timestamp: new Date()
              });

              // Handle matchmaking disconnection
              matchmakingService.handleDisconnection(walletAddress);
            }
          }
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Emit event to all sockets of a specific user
   */
  emitToUser<K extends keyof WebSocketEvents>(
    walletAddress: string,
    event: K,
    data: WebSocketEvents[K]
  ): void {
    if (!this.io) return;

    const normalizedAddress = walletAddress.toLowerCase();
    this.io.to(`user:${normalizedAddress}`).emit(event, data);

    console.log(`WebSocket event emitted to ${normalizedAddress}:`, event, data);
  }

  /**
   * Get the first socket ID for a user (for matchmaking)
   */
  getUserSocketId(walletAddress: string): string | null {
    const normalizedAddress = walletAddress.toLowerCase();
    const userSockets = this.connectedUsers.get(normalizedAddress);

    if (userSockets && userSockets.size > 0) {
      return Array.from(userSockets)[0]; // Return first socket ID
    }

    return null;
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll<K extends keyof WebSocketEvents>(
    event: K,
    data: WebSocketEvents[K]
  ): void {
    if (!this.io) return;

    this.io.emit(event, data);
    console.log('WebSocket event emitted to all clients:', event, data);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users list
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if user is connected
   */
  isUserConnected(walletAddress: string): boolean {
    return this.connectedUsers.has(walletAddress.toLowerCase());
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export default new WebSocketService();
