/**
 * Socket.IO service for real-time communication
 */

import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '../constants/config';
import { FileAttachment } from '../types/message.types';

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
  private currentSocketId: string | null = null;
  private lastErrorLogTime = 0;
  private errorLogInterval = 30000; // Log errors at most once every 30 seconds
  private hasLoggedInitialError = false; // Track if we've logged the initial error message
  private connectionPromise: Promise<void> | null = null; // Track ongoing connection

  /**
   * Connect to Socket.IO server with conversationId in query params
   */
  connect(conversationId?: string): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      // Validate socket URL (only warn once)
      if ((!APP_CONFIG.socketUrl || APP_CONFIG.socketUrl === 'http://localhost:3000') && this.reconnectAttempts === 0) {
        // Check if we're likely on a physical device (not simulator)
        const isLikelyPhysicalDevice = typeof navigator !== 'undefined' && 
          (navigator.userAgent?.includes('Mobile') || navigator.userAgent?.includes('Android'));
        
        if (isLikelyPhysicalDevice) {
          console.warn('⚠️ Using localhost - this will not work on physical devices!');
          console.warn('⚠️ Set EXPO_PUBLIC_SOCKET_URL to your computer\'s IP address');
        }
      }

      if (this.socket?.connected && this.conversationId === conversationId) {
        this.connectionPromise = null;
        resolve();
        return;
      }

      if (this.socket && this.conversationId !== conversationId) {
        this.disconnect();
      }

      this.conversationId = conversationId || null;

      const query: Record<string, string> = {};
      if (conversationId) {
        query.conversationId = conversationId;
      }

      // For React Native, use polling first (more reliable), then upgrade to websocket
      // This works better with localhost connections
      this.socket = io(APP_CONFIG.socketUrl, {
        query,
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        forceNew: false,
        upgrade: true,
        rememberUpgrade: false, // Don't remember upgrade in React Native
        autoConnect: true,
        // Additional options for React Native compatibility
        jsonp: false,
        forceBase64: false,
        // Enable extra debugging in development
        ...(process.env.NODE_ENV === 'development' && {
          debug: false, // Set to true for more verbose logging
        }),
      });

      // Resolve the promise after a short delay to allow connection attempt
      // Connection will happen in background and UI will update via isConnected()
      let hasResolved = false;
      let connectionTimeout: NodeJS.Timeout;

      // Set a timeout to resolve if connection takes too long
      // This prevents UI from blocking indefinitely
      connectionTimeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          this.connectionPromise = null;
          resolve();
        }
      }, 500); // Resolve after 500ms to unblock UI

      this.socket.on('connect', () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        if (!hasResolved) {
          hasResolved = true;
          this.connectionPromise = null;
          resolve();
        }
        console.log('✅ Connected to Socket.IO server:', this.socket?.id);
        console.log('Transport:', this.socket.io.engine.transport.name);
        this.currentSocketId = this.socket?.id || null;
        this.reconnectAttempts = 0;
        this.lastErrorLogTime = 0; // Reset error log timer
        this.hasLoggedInitialError = false; // Reset error flag
      });

      this.socket.on('disconnect', (reason) => {
        // Only log disconnect if it's not a normal reconnection
        if (reason !== 'io client disconnect') {
          console.log('❌ Disconnected from Socket.IO server:', reason);
        }
        if (reason === 'io server disconnect') {
          this.socket?.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        // Don't reject immediately - let reconnection handle it
        this.reconnectAttempts++;
        
        // Only log errors occasionally to reduce spam
        const now = Date.now();
        const shouldLog = now - this.lastErrorLogTime > this.errorLogInterval;
        
        if (shouldLog) {
          this.lastErrorLogTime = now;
          
          // Log detailed error only on first attempt
          if (!this.hasLoggedInitialError) {
            this.hasLoggedInitialError = true;
            console.warn('⚠️ Socket.IO connection error:', error.message);
            console.warn('Connection URL:', APP_CONFIG.socketUrl);
            
            if (error.message.includes('xhr poll error') || error.message.includes('Network')) {
              console.warn('💡 Network error - check if server is running and accessible');
              if (APP_CONFIG.socketUrl.includes('localhost')) {
                console.warn('💡 For physical devices, use your computer\'s IP instead of localhost');
                console.warn('💡 Set EXPO_PUBLIC_SOCKET_URL=http://YOUR_IP:3000 in .env file');
                console.warn('💡 See ENV_SETUP.md for detailed instructions');
              }
            }
          } else {
            // After initial error, only log every 20th attempt
            if (this.reconnectAttempts % 20 === 0) {
              console.warn(`⚠️ Still connecting... (attempt ${this.reconnectAttempts})`);
            }
          }
        }
        
        // Only log max attempts once
        if (this.reconnectAttempts === this.maxReconnectAttempts && !this.hasLoggedInitialError) {
          console.warn('⚠️ Max reconnection attempts reached, but will continue trying...');
        }
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        // Only log every 10th attempt to reduce console spam
        if (attemptNumber === 1 || attemptNumber % 10 === 0) {
          console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        this.reconnectAttempts = 0;
        this.lastErrorLogTime = 0; // Reset error log timer on successful reconnect
        this.hasLoggedInitialError = false; // Reset error log flag
      });

      this.socket.on('reconnect_failed', () => {
        // Don't reject - let the UI show connection status
        // Reconnection will continue automatically
        if (!hasResolved) {
          hasResolved = true;
          resolve(); // Resolve anyway so UI can show status
        }
        console.warn('⚠️ Reconnection failed - will continue trying');
        console.warn('💡 Make sure your backend server is running on:', APP_CONFIG.socketUrl);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.conversationId = null;
      this.reconnectAttempts = 0;
      this.currentSocketId = null;
      this.lastErrorLogTime = 0; // Reset error log timer
      this.hasLoggedInitialError = false; // Reset error log flag
      this.connectionPromise = null; // Reset connection promise
    }
  }

  /**
   * Join a conversation room
   */
  async joinConversation(conversationId: string, onJoined?: (data: any) => void): Promise<void> {
    if (!this.socket || !this.socket.connected || this.conversationId !== conversationId) {
      await this.connect(conversationId);
    }

    if (this.socket && this.socket.connected) {
      if (this.conversationId === conversationId) {
        if (onJoined) {
          this.socket.once('joined-conversation', onJoined);
        }
      } else {
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
  onUserJoined(callback: (data: { conversationId: string; socketId: string; roomSize: number }) => void): void {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  /**
   * Listen for user leave events
   */
  onUserLeft(callback: (data: { conversationId: string; socketId: string; roomSize: number }) => void): void {
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
   * Backend emits 'user-typing' event with { conversationId, socketId, username, isTyping }
   */
  onUserTyping(
    callback: (data: {
      conversationId: string;
      socketId: string;
      username: string;
      isTyping: boolean;
    }) => void
  ): void {
    if (this.socket) {
      // Backend emits 'user-typing' event (not 'user-typing-start' or 'user-typing-stop')
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
   * Listen for feedback submissions
   */
  onFeedbackSubmitted(
    callback: (data: {
      conversationId: string;
      feedback: {
        id: string;
        username?: string;
        rating: number;
        description?: string;
        timestamp: string;
      };
      timestamp: Date | string;
    }) => void
  ): void {
    if (this.socket) {
      this.socket.on('feedback-submitted', callback);
    }
  }

  /**
   * Remove feedback listener
   */
  offFeedbackSubmitted(): void {
    if (this.socket) {
      this.socket.off('feedback-submitted');
    }
  }

  /**
   * Listen for connect events
   */
  onConnect(callback: () => void): void {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  /**
   * Listen for disconnect events
   */
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
    return this.currentSocketId || this.socket?.id || null;
  }
}

export const socketService = new SocketService();

