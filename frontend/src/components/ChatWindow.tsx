import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService, ChatMessage as SocketChatMessage } from '../services/socket.service';
import { ChatMessage, MessageType, FileAttachment } from '../types/message.types';
import { hasLink, getFirstLink } from '../utils/linkDetector.util';
import { formatFileSize, getFileIcon, isImageFile } from '../utils/fileUtil';
import { fileToBase64 } from '../utils/fileConverter.util';
import { compressImage, needsCompression } from '../utils/imageCompressor.util';
import { apiService, StoredChatMessage } from '../services/api.service';
import LinkPreview from './LinkPreview';
import FilePreviewItem from './FilePreviewItem';
import FeedbackModal from './FeedbackModal';
import './ChatWindow.css';

interface ChatWindowProps {
  conversationId: string;
  username?: string;
  onChatEnd?: () => void;
  isDashboard?: boolean; // Flag to indicate if used in dashboard
}

const ChatWindow = ({ conversationId, username, onChatEnd, isDashboard = false }: ChatWindowProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [roomSize, setRoomSize] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode] = useState<'list' | 'grid'>('list');
  const [sendingFiles, setSendingFiles] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // Map<socketId, username>
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentSocketId = useRef<string | null>(null);
  const sentMessageIds = useRef<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const messagesLoadedRef = useRef<boolean>(false);

  // Convert StoredChatMessage to ChatMessage format
  const convertStoredMessageToChatMessage = useCallback((storedMsg: StoredChatMessage, currentSocketId: string | null): ChatMessage => {
    let messageType: MessageType = 'text';
    let fileAttachment: FileAttachment | undefined;
    let linkPreview: { url: string } | undefined;

    if (storedMsg.file) {
      messageType = isImageFile(storedMsg.file.name) ? 'image' : 'file';
      fileAttachment = {
        id: storedMsg.file.id,
        name: storedMsg.file.name,
        type: storedMsg.file.type,
        size: storedMsg.file.size,
        url: storedMsg.file.url,
        thumbnailUrl: storedMsg.file.thumbnailUrl,
      };
    } else if (hasLink(storedMsg.message)) {
      const firstLink = getFirstLink(storedMsg.message);
      if (firstLink) {
        linkPreview = { url: firstLink };
      }
    }

    const isCurrentUser = storedMsg.socketId === currentSocketId;

    return {
      id: storedMsg.id,
      type: messageType,
      text: storedMsg.message,
      sender: isCurrentUser ? 'user' : 'other',
      timestamp: new Date(storedMsg.timestamp),
      username: storedMsg.username,
      socketId: storedMsg.socketId,
      file: fileAttachment,
      linkPreview: linkPreview as any,
    };
  }, []);

  // Load previous messages from database (especially for dashboard)
  const loadPreviousMessages = useCallback(async () => {
    if (messagesLoadedRef.current) return;
    
    try {
      const conversation = await apiService.getConversationMessages(conversationId);
      if (conversation && conversation.messages && conversation.messages.length > 0) {
        // Get current socket ID for proper message alignment
        const socketId = socketService.getSocketId();
        currentSocketId.current = socketId;
        
        // Convert stored messages to ChatMessage format
        const loadedMessages: ChatMessage[] = conversation.messages.map((storedMsg) =>
          convertStoredMessageToChatMessage(storedMsg, socketId)
        );
        
        // Track loaded message IDs to prevent duplicates from socket
        loadedMessages.forEach((msg) => {
          sentMessageIds.current.add(msg.id);
        });
        
        setMessages(loadedMessages);
        messagesLoadedRef.current = true;
        console.log(`✅ Loaded ${loadedMessages.length} previous messages for conversation ${conversationId}`);
      }
    } catch (error) {
      console.error('Error loading previous messages:', error);
      // Don't block UI if loading fails
    }
  }, [conversationId, convertStoredMessageToChatMessage]);

  useEffect(() => {
    // Don't initialize connection if chat is ended
    if (isChatEnded) {
      return;
    }

    let isMounted = true;
    let connectionCheckInterval: ReturnType<typeof setInterval>;

    const initializeConnection = async () => {
      try {
        // Load previous messages first (especially important for dashboard)
        if (isDashboard && !messagesLoadedRef.current) {
          await loadPreviousMessages();
        }

        await socketService.connect(conversationId);
        
        if (!isMounted || isChatEnded) return;

        setIsConnected(socketService.isConnected());
        
        setTimeout(() => {
          if (isMounted) {
            currentSocketId.current = socketService.getSocketId();
            console.log('Current socket ID:', currentSocketId.current);
          }
        }, 100);

        const updateSocketId = () => {
          const socketId = socketService.getSocketId();
          if (socketId) {
            currentSocketId.current = socketId;
            console.log('✅ Current socket ID set:', currentSocketId.current);
          }
        };
        
        updateSocketId();
        setTimeout(updateSocketId, 200);

        await socketService.joinConversation(conversationId, (data) => {
          if (!isMounted) return;
          console.log('✅ Joined conversation:', data);
          setIsJoined(true);
          setRoomSize(data.roomSize || 0);
          updateSocketId();
          addSystemMessage(`Joined conversation ${conversationId} (${data.roomSize || 0} users in room)`);
        });

        const handleNewMessage = (message: SocketChatMessage) => {
          if (!isMounted) return;
          
          // Skip if we've already processed this message
          if (sentMessageIds.current.has(message.id)) {
            return;
          }
          
          // Skip if message is not for this conversation
          if (message.conversationId !== conversationId) {
            return;
          }
          
          console.log('📨 Received message:', message);
          
          const isCurrentUser = message.socketId === currentSocketId.current;
          sentMessageIds.current.add(message.id);
          
          // Determine message type
          let messageType: MessageType = 'text';
          let fileAttachment: FileAttachment | undefined;
          let linkPreview: { url: string } | undefined;

          if (message.file) {
            messageType = isImageFile(message.file.name) ? 'image' : 'file';
            fileAttachment = message.file;
          } else if (hasLink(message.message)) {
            // If message contains link but no file, show as text with link preview
            const firstLink = getFirstLink(message.message);
            if (firstLink) {
              linkPreview = { url: firstLink };
            }
          }
          
          const chatMessage: ChatMessage = {
            id: message.id,
            type: messageType,
            text: message.message,
            sender: isCurrentUser ? 'user' : 'other',
            timestamp: new Date(message.timestamp),
            username: message.username,
            socketId: message.socketId,
            file: fileAttachment,
            linkPreview: linkPreview as any,
          };
          
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === message.id);
            if (exists) {
              return prev;
            }
            return [...prev, chatMessage];
          });
        };

        socketService.onNewMessage(handleNewMessage);

        const handleUserJoined = (data: any) => {
          if (!isMounted) return;
          setRoomSize(data.roomSize || 0);
          addSystemMessage(`👤 User joined (${data.roomSize || 0} users in room)`);
        };

        const handleUserLeft = (data: any) => {
          if (!isMounted) return;
          setRoomSize(data.roomSize || 0);
          addSystemMessage(`👤 User left (${data.roomSize || 0} users in room)`);
        };

        socketService.onUserJoined(handleUserJoined);
        socketService.onUserLeft(handleUserLeft);

        // Handle feedback submissions from other users
        const handleFeedbackSubmitted = (data: {
          conversationId: string;
          feedback: {
            id: string;
            username?: string;
            rating: number;
            description?: string;
            timestamp: string;
          };
          timestamp: Date | string;
        }) => {
          if (!isMounted) return;
          if (data.conversationId !== conversationId) return;
          
          // Don't show feedback notification for current user (they already see their own feedback)
          if (data.feedback.username === username) return;

          const ratingStars = '⭐'.repeat(data.feedback.rating);
          const feedbackMessage = data.feedback.description
            ? `${data.feedback.username || 'A user'} submitted feedback: ${ratingStars} (${data.feedback.rating}/5) - "${data.feedback.description}"`
            : `${data.feedback.username || 'A user'} submitted feedback: ${ratingStars} (${data.feedback.rating}/5)`;
          
          addSystemMessage(`📝 ${feedbackMessage}`);
        };

        socketService.onFeedbackSubmitted(handleFeedbackSubmitted);

        // Handle typing indicators from other users
        const handleUserTyping = (data: {
          conversationId: string;
          socketId: string;
          username: string;
          isTyping: boolean;
        }) => {
          if (!isMounted) return;
          if (data.conversationId !== conversationId) return;
          // Don't show typing indicator for current user
          if (data.socketId === currentSocketId.current) return;

          setTypingUsers((prev) => {
            const next = new Map(prev);
            if (data.isTyping) {
              next.set(data.socketId, data.username);
            } else {
              next.delete(data.socketId);
            }
            return next;
          });
        };

        socketService.onUserTyping(handleUserTyping);

        // Instant updates from low-level socket events
        socketService.onConnect(() => {
          if (!isMounted) return;
          setIsConnected(true);
          // Update current socket ID so alignment (user vs other) stays correct after reconnect
          currentSocketId.current = socketService.getSocketId();
        });

        socketService.onDisconnect((reason) => {
          if (!isMounted) return;
          console.log('Socket disconnected in ChatWindow:', reason);
          setIsConnected(false);
          setIsJoined(false);
        });

        // Also react to joined/left conversation events
        socketService.onJoinedConversation((data) => {
          if (!isMounted) return;
          if (data.conversationId === conversationId) {
            setIsConnected(true);
            setIsJoined(true);
            setRoomSize(data.roomSize || 0);
            // Ensure we track the latest socket ID when (re)joining the room
            currentSocketId.current = socketService.getSocketId();
          }
        });

        socketService.onLeftConversation((data) => {
          if (!isMounted) return;
          if (data.conversationId === conversationId) {
            setIsJoined(false);
            setRoomSize(data.roomSize || 0);
          }
        });

        socketService.onError((error) => {
          if (!isMounted) return;
          console.error('Socket error in ChatWindow:', error);
          setIsConnected(false);
          setIsJoined(false);
        });

        // Fallback interval check as a safety net
        connectionCheckInterval = setInterval(() => {
          if (!isMounted) return;
          const connected = socketService.isConnected();
          setIsConnected(connected);
          if (!connected) {
            setIsJoined(false);
          }
        }, 2000);

        return () => {
          socketService.offNewMessage(handleNewMessage);
          socketService.offUserTyping(handleUserTyping);
          socketService.offFeedbackSubmitted(handleFeedbackSubmitted);
          socketService.leaveConversation(conversationId);
        };
      } catch (error) {
        console.error('Failed to initialize connection:', error);
        if (isMounted) {
          addSystemMessage(`❌ Failed to connect: ${error}`);
        }
      }
    };

    initializeConnection();

    return () => {
      isMounted = false;
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
      // Stop typing indicator when component unmounts
      if (isTypingRef.current) {
        socketService.emitTypingStop(conversationId, username);
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (!isChatEnded) {
        socketService.leaveConversation(conversationId);
        socketService.disconnect();
      }
    };
  }, [conversationId, username, isChatEnded, isDashboard, loadPreviousMessages]);

  // Reset messages loaded flag when conversationId changes
  useEffect(() => {
    messagesLoadedRef.current = false;
    setMessages([]);
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addSystemMessage = (text: string) => {
    const message: ChatMessage = {
      id: `sys-${Date.now()}`,
      type: 'text',
      text,
      sender: 'system',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...fileArray]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const sendFiles = async () => {
    if (selectedFiles.length === 0) return;

    const filesToSend = [...selectedFiles];
    setSelectedFiles([]); // Clear immediately to show progress

    // Send files one by one with delay to prevent socket overload
    for (let i = 0; i < filesToSend.length; i++) {
      const file = filesToSend[i];
      const fileId = `${file.name}-${file.size}-${Date.now()}`;
      
      try {
        setSendingFiles((prev) => new Set(prev).add(fileId));
        
        // Check file size limit (5MB for base64 encoding after compression)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize * 2) {
          addSystemMessage(`❌ File ${file.name} is too large (max 10MB). Please use a smaller file.`);
          setSendingFiles((prev) => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });
          continue;
        }

        // Compress image if needed (reduces payload size significantly)
        let fileToSend = file;
        if (needsCompression(file)) {
          try {
            fileToSend = await compressImage(file, 1920, 1920, 0.8);
            console.log(`📦 Compressed ${file.name}: ${formatFileSize(file.size)} → ${formatFileSize(fileToSend.size)}`);
          } catch (compressError) {
            console.warn('Compression failed, sending original:', compressError);
            // Continue with original file if compression fails
          }
        }

        // Convert file to base64 for real-time sharing
        const base64String = await fileToBase64(fileToSend);
        
        // Check if base64 string is too large (shouldn't happen after compression)
        if (base64String.length > 10 * 1024 * 1024) {
          addSystemMessage(`❌ File ${file.name} is too large after encoding. Please use a smaller file.`);
          setSendingFiles((prev) => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });
          continue;
        }
        
        const fileAttachment: FileAttachment = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          size: fileToSend.size,
          url: base64String, // Base64 data URL for real-time sharing
          thumbnailUrl: isImageFile(file) ? base64String : undefined,
        };

        const messageText = isImageFile(file) 
          ? `📷 ${file.name}` 
          : `📎 ${file.name} (${formatFileSize(fileToSend.size)})`;

        // Send file message via Socket.IO with base64 data
        // Add retry logic for robustness
        let retries = 3;
        let sent = false;
        
        while (retries > 0 && !sent) {
          try {
            if (!socketService.isConnected()) {
              throw new Error('Socket not connected');
            }
            
            socketService.sendFileMessage(conversationId, messageText, username, fileAttachment);
            sent = true;
            console.log(`✅ File sent: ${file.name} (${formatFileSize(fileToSend.size)})`);
          } catch (error) {
            retries--;
            if (retries > 0) {
              console.warn(`Retrying file send (${retries} attempts left)...`);
              await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
            } else {
              throw error;
            }
          }
        }
        
        setSendingFiles((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });

        // Delay between files to prevent socket overload (except for last file)
        if (i < filesToSend.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300)); // 300ms delay between files
        }
      } catch (error) {
        console.error('Error sending file:', error);
        addSystemMessage(`❌ Failed to send file: ${file.name}`);
        setSendingFiles((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // Emit typing start/stop events with debouncing
    if (isConnected && isJoined) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // If user is typing and we haven't emitted typing-start yet
      if (value.trim().length > 0 && !isTypingRef.current) {
        socketService.emitTypingStart(conversationId, username);
        isTypingRef.current = true;
      }

      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          socketService.emitTypingStop(conversationId, username);
          isTypingRef.current = false;
        }
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Stop typing indicator when sending message
    if (isTypingRef.current) {
      socketService.emitTypingStop(conversationId, username);
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    if (selectedFiles.length > 0) {
      sendFiles();
      return;
    }

    if (inputMessage.trim() && isConnected && isJoined) {
      const messageText = inputMessage.trim();
      socketService.sendMessage(conversationId, messageText, username);
      setInputMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const renderMessageContent = (message: ChatMessage) => {
    // Render image files
    if (message.file && (message.type === 'image' || isImageFile(message.file.name) || message.file.type.startsWith('image/'))) {
      return (
        <div className="message-attachment">
          <img 
            src={message.file.url} 
            alt={message.file.name}
            className="message-image"
            loading="lazy"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className="message-file-name">{message.file.name}</div>
        </div>
      );
    }

    // Render file attachments (non-images) - base64 data URL
    if (message.file && (message.type === 'file' || (!isImageFile(message.file.name) && !message.file.type.startsWith('image/')))) {
      return (
        <div className="message-attachment">
          <div className="file-attachment">
            <div className="file-icon">{getFileIcon(message.file.name)}</div>
            <div className="file-info">
              <div className="file-name">{message.file.name}</div>
              <div className="file-size">{formatFileSize(message.file.size)}</div>
            </div>
            <a 
              href={message.file.url} 
              download={message.file.name}
              className="file-download-btn"
              title="Download file"
              onClick={(e) => {
                // Convert base64 to blob for download
                if (message.file?.url.startsWith('data:')) {
                  const base64Data = message.file.url.split(',')[1];
                  const byteCharacters = atob(base64Data);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: message.file.type });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = message.file.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  e.preventDefault();
                }
              }}
            >
              ⬇️
            </a>
          </div>
        </div>
      );
    }

    if (message.type === 'link' && message.linkPreview) {
      return (
        <div>
          {message.text && <div className="message-text">{message.text}</div>}
          <LinkPreview url={message.linkPreview.url || ''} />
        </div>
      );
    }

    // Auto-detect links in text messages
    if (message.type === 'text' && message.text && hasLink(message.text)) {
      const firstLink = getFirstLink(message.text);
      if (firstLink) {
        return (
          <div>
            <div className="message-text">{message.text}</div>
            <LinkPreview url={firstLink} />
          </div>
        );
      }
    }

    return <div className="message-text">{message.text}</div>;
  };

  const handleFeedbackSubmit = async (rating: number, description: string): Promise<void> => {
    try {
      // Submit feedback to backend
      const response = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          username,
          rating,
          description: description.trim() || undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Close socket connection gracefully
      if (isTypingRef.current) {
        socketService.emitTypingStop(conversationId, username);
        isTypingRef.current = false;
      }
      
      // Leave conversation first, then disconnect
      socketService.leaveConversation(conversationId);
      
      // Add system message before disconnecting
      addSystemMessage('Chat session ended. Thank you for your feedback!');
      
      // Update state before disconnect
      setIsChatEnded(true);
      setIsJoined(false);
      
      // Small delay before disconnect to ensure leave event is processed
      setTimeout(() => {
        socketService.disconnect();
        setIsConnected(false);
      }, 500);

      // Call parent callback if provided
      if (onChatEnd) {
        setTimeout(() => {
          onChatEnd();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  return (
    <div className={`chat-window ${isDashboard ? 'chat-window-dashboard' : ''}`}>
      <FeedbackModal
        isOpen={showFeedbackModal}
        conversationId={conversationId}
        username={username}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
      />
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>Conversation: {conversationId}</h2>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            {isJoined && (
              <>
                <span className="joined-badge">Joined</span>
                <span className="room-size-badge">{roomSize} users</span>
              </>
            )}
          </div>
        </div>
        {!isChatEnded && isJoined && (
          <div className="chat-header-actions">
            <button
              className="end-chat-button"
              onClick={() => setShowFeedbackModal(true)}
              title="End chat session"
            >
              End Chat
            </button>
          </div>
        )}
      </div>

      <div 
        className={`chat-messages ${isDragging ? 'dragging' : ''}`}
        ref={messagesContainerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="drag-overlay">
            <div className="drag-overlay-content">
              <div className="drag-icon">📎</div>
              <div className="drag-text">Drop files here to upload</div>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start chatting!</p>
          </div>
        ) : (
          <div className={`messages-container ${viewMode}`}>
            {messages.map((message) => {
              const isImageMessage = message.file && isImageFile(message.file.name);
              const shouldShowAsGrid = viewMode === 'grid' && isImageMessage && message.sender !== 'system';
              
              return (
                <div 
                  key={message.id} 
                  className={`message ${message.sender} ${shouldShowAsGrid ? 'grid-item' : ''}`}
                >
                  <div className="message-content">
                    {!shouldShowAsGrid && (
                      <div className="message-header">
                        <span className="message-sender">
                          {message.sender === 'user' 
                            ? 'You' 
                            : message.sender === 'system'
                            ? 'System'
                            : message.username || 'Other User'}
                        </span>
                        <span className="message-time">{formatTime(new Date(message.timestamp))}</span>
                      </div>
                    )}
                    {shouldShowAsGrid && (
                      <div className="message-header-compact">
                        <span className="message-sender-compact">
                          {message.sender === 'user' ? 'You' : message.username || 'Other'}
                        </span>
                        <span className="message-time-compact">{formatTime(new Date(message.timestamp))}</span>
                      </div>
                    )}
                    {renderMessageContent(message)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {Array.from(typingUsers.values()).length === 1
                ? `${Array.from(typingUsers.values())[0]} is typing...`
                : Array.from(typingUsers.values()).length === 2
                ? `${Array.from(typingUsers.values())[0]} and ${Array.from(typingUsers.values())[1]} are typing...`
                : `${Array.from(typingUsers.values()).length} people are typing...`}
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {selectedFiles.length > 0 && (
        <div className="file-attachments-preview">
          <div className="file-attachments-header">
            <span>Attachments ({selectedFiles.length})</span>
            <button 
              className="clear-files-btn"
              onClick={() => setSelectedFiles([])}
            >
              ✕
            </button>
          </div>
          <div className="file-attachments-list">
            {selectedFiles.map((file, index) => (
              <FilePreviewItem
                key={index}
                file={file}
                index={index}
                onRemove={removeFile}
              />
            ))}
          </div>
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-actions">
          <button
            type="button"
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            disabled={!isConnected || !isJoined}
          >
            📎
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="file-input-hidden"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
        <input
          type="text"
          className="chat-input"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder={isConnected && isJoined ? "Type a message..." : "Connecting..."}
          disabled={!isConnected || !isJoined}
        />
        <button
          type="submit"
          className="send-button"
          disabled={(!inputMessage.trim() && selectedFiles.length === 0) || !isConnected || !isJoined}
        >
          {selectedFiles.length > 0 ? '📤 Send' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
