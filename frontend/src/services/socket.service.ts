import { io, Socket } from 'socket.io-client';
import { FileAttachment } from '../types/message.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId?: string;
  username?: string;
  message: string;
  timestamp: Date | string;
  socketId: string;
  file?: FileAttachment;
}

/**
 * Production-grade Socket.IO client service for chat
 * Connects with conversationId in query params for optimal routing
 */
class SocketService {
  private socket: Socket | null = null;
  private conversationId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isIntentionallyDisconnected = false;

  /**
   * Connect to Socket.IO server with conversationId in query params
   * This allows the server to auto-join the room on connection
   */
  connect(conversationId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Reset intentional disconnect flag when connecting
      this.isIntentionallyDisconnected = false;

      if (this.socket?.connected && this.conversationId === conversationId) {
        resolve();
        return;
      }

      // Disconnect existing connection if conversationId changed
      if (this.socket && this.conversationId !== conversationId) {
        this.disconnect();
      }

      this.conversationId = conversationId || null;

      // Connect with conversationId in query params for optimal routing
      const query: Record<string, string> = {};
      if (conversationId) {
        query.conversationId = conversationId;
      }

      this.socket = io(SOCKET_URL, {
        query,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        forceNew: false,
        // Increase max payload size for base64 images
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server:', this.socket?.id);
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Socket.IO server:', reason);
        // Only auto-reconnect if it wasn't an intentional disconnect
        if (reason === 'io server disconnect' && !this.isIntentionallyDisconnected) {
          // Server disconnected, reconnect manually
          this.socket?.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error.message);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ Failed to reconnect after maximum attempts');
        reject(new Error('Reconnection failed'));
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      // Mark as intentionally disconnected to prevent auto-reconnection
      this.isIntentionallyDisconnected = true;
      
      // Disable reconnection before disconnecting to prevent automatic reconnection
      if (this.socket.io && this.socket.io.opts) {
        this.socket.io.opts.reconnection = false;
      }
      // Remove all event listeners to prevent reconnection attempts
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.conversationId = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Join a conversation room
   * If already connected with conversationId in query, this is automatic
   * Otherwise, emits join event
   */
  async joinConversation(conversationId: string, onJoined?: (data: any) => void): Promise<void> {
    // If not connected or conversationId changed, reconnect with new conversationId
    if (!this.socket || !this.socket.connected || this.conversationId !== conversationId) {
      await this.connect(conversationId);
    }

    // If already connected with this conversationId, server auto-joined
    // Otherwise, manually join
    if (this.socket && this.socket.connected) {
      if (this.conversationId === conversationId) {
        // Already in room via query param, just wait for confirmation
        if (onJoined) {
          this.socket.once('joined-conversation', onJoined);
        }
      } else {
        // Manually join
        this.conversationId = conversationId;
        this.socket.emit('join-conversation', conversationId);
        if (onJoined) {
          this.socket.once('joined-conversation', onJoined);
        }
      }
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-conversation', conversationId);
      this.conversationId = null;
    }
  }

  /**
   * Send a chat message to the conversation room
   */
  sendMessage(conversationId: string, message: string, username?: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send-message', {
        conversationId,
        message,
        username,
      });
    } else {
      console.error('Cannot send message: Socket not connected');
    }
  }

  /**
   * Send a file message to the conversation room
   * File is sent as base64 for real-time sharing
   */
  sendFileMessage(conversationId: string, message: string, username: string | undefined, file: FileAttachment): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send-message', {
        conversationId,
        message,
        username,
        file,
      });
    } else {
      console.error('Cannot send file message: Socket not connected');
    }
  }

  /**
   * Emit typing start event to indicate user is typing
   */
  emitTypingStart(conversationId: string, username?: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing-start', {
        conversationId,
        username,
      });
    }
  }

  /**
   * Emit typing stop event to indicate user stopped typing
   */
  emitTypingStop(conversationId: string, username?: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing-stop', {
        conversationId,
        username,
      });
    }
  }

  /**
   * Listen for user typing events from other users
   */
  onUserTyping(callback: (data: { 
    conversationId: string; 
    socketId: string; 
    username: string; 
    isTyping: boolean;
  }) => void): void {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  /**
   * Remove user typing listener
   */
  offUserTyping(callback?: (data: { 
    conversationId: string; 
    socketId: string; 
    username: string; 
    isTyping: boolean;
  }) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('user-typing', callback);
      } else {
        this.socket.off('user-typing');
      }
    }
  }

  /**
   * Listen for new messages in the conversation
   */
  onNewMessage(callback: (message: ChatMessage) => void): void {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  /**
   * Remove message listener
   */
  offNewMessage(callback?: (message: ChatMessage) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('new-message', callback);
      } else {
        this.socket.off('new-message');
      }
    }
  }

  /**
   * Listen for user join events
   */
  onUserJoined(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  /**
   * Listen for user leave events
   */
  onUserLeft(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  onJoinedConversation(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('joined-conversation', callback);
    }
  }

  onLeftConversation(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('left-conversation', callback);
    }
  }

  onError(callback: (error: any) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  /**
   * Low-level socket connect/disconnect listeners for instant UI updates.
   */
  onConnect(callback: () => void): void {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  onDisconnect(callback: (reason: string) => void): void {
    if (this.socket) {
      this.socket.on('disconnect', callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConversationId(): string | null {
    return this.conversationId;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * Listen for feedback submission events from other users
   */
  onFeedbackSubmitted(callback: (data: {
    conversationId: string;
    feedback: {
      id: string;
      username?: string;
      rating: number;
      description?: string;
      timestamp: string;
    };
    timestamp: Date | string;
  }) => void): void {
    if (this.socket) {
      this.socket.on('feedback-submitted', callback);
    }
  }

  /**
   * Remove feedback submitted listener
   */
  offFeedbackSubmitted(callback?: (data: {
    conversationId: string;
    feedback: {
      id: string;
      username?: string;
      rating: number;
      description?: string;
      timestamp: string;
    };
    timestamp: Date | string;
  }) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('feedback-submitted', callback);
      } else {
        this.socket.off('feedback-submitted');
      }
    }
  }
}

export const socketService = new SocketService();
