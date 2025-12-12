import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Logger } from '../utils/logger.util';
import { appendChatMessage, StoredChatMessage } from '../database/chatDb.util';

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // Base64 data URL for real-time sharing
  thumbnailUrl?: string; // Base64 data URL for images
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId?: string;
  username?: string;
  message: string;
  timestamp: Date;
  socketId: string;
  file?: FileAttachment;
}

/**
 * Production-grade Socket.IO service with Map-based room management
 * O(1) lookup for conversationId -> Set<Socket>
 * Scales to millions of connections
 * Supports N number of rooms with N number of users per room
 */
export class SocketService {
  private static io: SocketIOServer | null = null;
  // Map<conversationId, Set<Socket>> - Fast O(1) lookup
  private static rooms: Map<string, Set<Socket>> = new Map();
  // Map<socketId, NodeJS.Timeout> - Track typing timeouts per socket
  private static typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize Socket.IO server with optimized room management
   */
  static initialize(server: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*', // Configure in production
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 10e6, // 10MB - increased for base64 image sharing
      allowEIO3: true,
    });

    this.io.on('connection', (socket: Socket) => {
      Logger.info(`Socket connected: ${socket.id}`);

      // Extract conversationId from query params or handshake
      const conversationId = socket.handshake.query.conversationId as string;

      // If conversationId provided in query, auto-join
      if (conversationId) {
        this.joinRoom(conversationId, socket);
      }

      // Manual join via event (for dynamic joining)
      socket.on('join-conversation', (convId: string) => {
        if (!convId) {
          socket.emit('error', { message: 'conversationId is required' });
          return;
        }
        this.joinRoom(convId, socket);
      });

      // Leave a room
      socket.on('leave-conversation', (convId: string) => {
        if (convId) {
          this.leaveRoom(convId, socket);
        }
      });

      // Handle chat messages - broadcast to all users in the same room
      socket.on('send-message', (data: { 
        conversationId: string; 
        message: string; 
        username?: string;
        file?: FileAttachment;
      }) => {
        if (!data.conversationId || !data.message) {
          socket.emit('error', { message: 'conversationId and message are required' });
          return;
        }

        const room = this.rooms.get(data.conversationId);
        if (!room || !room.has(socket)) {
          socket.emit('error', { message: 'You are not in this conversation' });
          return;
        }

        // Create chat message
        const chatMessage: ChatMessage = {
          id: `msg-${Date.now()}-${socket.id}`,
          conversationId: data.conversationId,
          message: data.message,
          username: data.username || `User-${socket.id.substring(0, 6)}`,
          timestamp: new Date(),
          socketId: socket.id,
          file: data.file,
        };

        // Broadcast to all sockets in the room (including sender)
        const roomName = `conversation-${data.conversationId}`;
        this.io!.to(roomName).emit('new-message', chatMessage);

        const messageType = data.file ? (data.file.type.startsWith('image/') ? 'image' : 'file') : 'text';
        Logger.info(
          `${messageType} message sent in conversation ${data.conversationId} by ${socket.id} (broadcasted to ${room.size} users)`
        );

        // Persist chat message into db.json grouped by conversationId (fire and forget)
        const storedMessage: StoredChatMessage = {
          id: chatMessage.id,
          conversationId: chatMessage.conversationId,
          userId: chatMessage.userId,
          username: chatMessage.username,
          message: chatMessage.message,
          timestamp: chatMessage.timestamp.toISOString(),
          socketId: chatMessage.socketId,
          file: chatMessage.file
            ? {
                id: chatMessage.file.id,
                name: chatMessage.file.name,
                type: chatMessage.file.type,
                size: chatMessage.file.size,
                url: chatMessage.file.url,
                thumbnailUrl: chatMessage.file.thumbnailUrl,
              }
            : undefined,
        };

        // Do not await; DB write runs independently to avoid impacting socket flow
        void appendChatMessage(storedMessage);
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { 
        conversationId: string; 
        username?: string;
      }) => {
        if (!data.conversationId) {
          return;
        }

        const room = this.rooms.get(data.conversationId);
        if (!room || !room.has(socket)) {
          return;
        }

        const roomName = `conversation-${data.conversationId}`;
        const username = data.username || `User-${socket.id.substring(0, 6)}`;

        // Broadcast typing indicator to other users in the room (not the sender)
        socket.to(roomName).emit('user-typing', {
          conversationId: data.conversationId,
          socketId: socket.id,
          username,
          isTyping: true,
        });

        // Clear existing timeout if any
        const existingTimeout = this.typingTimeouts.get(socket.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Auto-stop typing after 3 seconds of inactivity
        const timeout = setTimeout(() => {
          socket.to(roomName).emit('user-typing', {
            conversationId: data.conversationId,
            socketId: socket.id,
            username,
            isTyping: false,
          });
          this.typingTimeouts.delete(socket.id);
        }, 3000);

        this.typingTimeouts.set(socket.id, timeout);
      });

      socket.on('typing-stop', (data: { 
        conversationId: string; 
        username?: string;
      }) => {
        if (!data.conversationId) {
          return;
        }

        const room = this.rooms.get(data.conversationId);
        if (!room || !room.has(socket)) {
          return;
        }

        const roomName = `conversation-${data.conversationId}`;
        const username = data.username || `User-${socket.id.substring(0, 6)}`;

        // Clear timeout if exists
        const existingTimeout = this.typingTimeouts.get(socket.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          this.typingTimeouts.delete(socket.id);
        }

        // Broadcast stop typing to other users in the room (not the sender)
        socket.to(roomName).emit('user-typing', {
          conversationId: data.conversationId,
          socketId: socket.id,
          username,
          isTyping: false,
        });
      });

      // Handle disconnection and errors
      socket.on('disconnect', () => {
        Logger.info(`Socket disconnected: ${socket.id}`);
        // Clean up typing timeout on disconnect
        const timeout = this.typingTimeouts.get(socket.id);
        if (timeout) {
          clearTimeout(timeout);
          this.typingTimeouts.delete(socket.id);
        }
        this.removeSocketFromAllRooms(socket);
      });

      socket.on('error', (error) => {
        Logger.error(`Socket error for ${socket.id}:`, error);
        this.removeSocketFromAllRooms(socket);
      });

      // Ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    Logger.info('Socket.IO server initialized with Map-based room management for chat');
    return this.io;
  }

  /**
   * Join a room (conversationId) - O(1) operation
   */
  private static joinRoom(conversationId: string, socket: Socket): void {
    // Create room if it doesn't exist
    if (!this.rooms.has(conversationId)) {
      this.rooms.set(conversationId, new Set());
      Logger.info(`New room created: ${conversationId}`);
    }

    // Add socket to room Set
    this.rooms.get(conversationId)!.add(socket);

    // Also join Socket.IO room for compatibility
    const roomName = `conversation-${conversationId}`;
    socket.join(roomName);

    const roomSize = this.rooms.get(conversationId)!.size;
    Logger.info(`Socket ${socket.id} joined conversation ${conversationId} (${roomSize} total in room)`);

    // Emit confirmation
    socket.emit('joined-conversation', {
      conversationId,
      room: roomName,
      message: `Successfully joined conversation ${conversationId}`,
      roomSize,
    });

    // Notify other users in the room (optional - for user join notifications)
    socket.to(roomName).emit('user-joined', {
      conversationId,
      socketId: socket.id,
      roomSize,
      timestamp: new Date(),
    });

    // Cleanup on socket close/error
    const cleanup = () => {
      this.leaveRoom(conversationId, socket);
    };

    socket.once('disconnect', cleanup);
    socket.once('error', cleanup);
  }

  /**
   * Leave a room - O(1) operation
   */
  private static leaveRoom(conversationId: string, socket: Socket): void {
    const room = this.rooms.get(conversationId);
    if (room) {
      room.delete(socket);

      // Clean up empty rooms
      if (room.size === 0) {
        this.rooms.delete(conversationId);
        Logger.debug(`Room ${conversationId} deleted (empty)`);
      }

      // Also leave Socket.IO room
      const roomName = `conversation-${conversationId}`;
      socket.leave(roomName);

      // Notify other users in the room
      socket.to(roomName).emit('user-left', {
        conversationId,
        socketId: socket.id,
        roomSize: room.size,
        timestamp: new Date(),
      });

      Logger.info(`Socket ${socket.id} left conversation ${conversationId}`);
      socket.emit('left-conversation', {
        conversationId,
        message: `Left conversation ${conversationId}`,
      });
    }
  }

  /**
   * Get the number of connections in a conversation room - O(1)
   */
  static getRoomSize(conversationId: string): number {
    return this.rooms.get(conversationId)?.size || 0;
  }

  /**
   * Get all active conversation rooms - O(R) where R = number of rooms
   */
  static getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Get total number of connected clients - O(1)
   */
  static getTotalConnections(): number {
    if (!this.io) {
      return 0;
    }
    return this.io.sockets.sockets.size;
  }

  /**
   * Get room details with connection count
   */
  static getRoomDetails(): Record<string, number> {
    const details: Record<string, number> = {};
    this.rooms.forEach((sockets, conversationId) => {
      details[conversationId] = sockets.size;
    });
    return details;
  }

  /**
   * Remove socket from all rooms on disconnect - O(R) where R = rooms socket was in
   */
  private static removeSocketFromAllRooms(socket: Socket): void {
    for (const [conversationId, room] of this.rooms.entries()) {
      if (room.has(socket)) {
        room.delete(socket);
        if (room.size === 0) {
          this.rooms.delete(conversationId);
          Logger.debug(`Room ${conversationId} cleaned up (empty after disconnect)`);
        } else {
          // Notify other users
          const roomName = `conversation-${conversationId}`;
          socket.to(roomName).emit('user-left', {
            conversationId,
            socketId: socket.id,
            roomSize: room.size,
            timestamp: new Date(),
          });
        }
      }
    }
  }

  /**
   * Broadcast feedback submission to all users in a conversation room
   */
  static broadcastFeedback(conversationId: string, feedback: {
    id: string;
    username?: string;
    rating: number;
    description?: string;
    timestamp: string;
  }): void {
    if (!this.io) {
      Logger.warn('[SocketService] Cannot broadcast feedback: Socket.IO not initialized');
      return;
    }

    const room = this.rooms.get(conversationId);
    if (!room || room.size === 0) {
      Logger.debug(`[SocketService] No active users in room ${conversationId} to broadcast feedback`);
      return;
    }

    const roomName = `conversation-${conversationId}`;
    this.io.to(roomName).emit('feedback-submitted', {
      conversationId,
      feedback,
      timestamp: new Date(),
    });

    Logger.info(
      `[SocketService] Feedback broadcasted to conversation ${conversationId} (${room.size} users)`
    );
  }

  /**
   * Get Socket.IO server instance
   */
  static getIO(): SocketIOServer | null {
    return this.io;
  }
}
