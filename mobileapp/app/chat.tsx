/**
 * Chat Screen - Main chat interface with Socket.IO
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { socketService, ChatMessage as SocketChatMessage } from '@/services/socket.service';
import { ChatMessage, MessageType, FileAttachment } from '@/types/message.types';
import { isImageFile, formatFileSize, getFileIcon } from '@/utils/fileUtil';
import { fileToBase64 } from '@/utils/fileConverter.util';
import { compressImage, needsCompression } from '@/utils/imageCompressor.util';
import { hasLink, getFirstLink } from '@/utils/linkDetector.util';
import { apiService, StoredChatMessage } from '@/services/api.service';
import FeedbackModal from '@/components/FeedbackModal';
import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, colors, spacing, typography, fontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId, username } = useLocalSearchParams<{ conversationId: string; username: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = lightColors; // Using light theme
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [roomSize, setRoomSize] = useState(0);
  const [sendingFiles, setSendingFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // Map<socketId, username>
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  
  const currentSocketId = useRef<string | null>(null);
  const sentMessageIds = useRef<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const systemMessageCounter = useRef(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const messagesLoadedRef = useRef<boolean>(false);

  // Convert StoredChatMessage to ChatMessage format
  const convertStoredMessageToChatMessage = (
    storedMsg: StoredChatMessage,
    currentSocketId: string | null
  ): ChatMessage => {
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
    } else if (storedMsg.message && hasLink(storedMsg.message)) {
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
  };

  // Load previous messages from database
  const loadPreviousMessages = async () => {
    if (messagesLoadedRef.current) return;

    try {
      const conversation = await apiService.getConversationMessages(conversationId!);
      if (conversation && conversation.messages && conversation.messages.length > 0) {
        const socketId = socketService.getSocketId();
        currentSocketId.current = socketId;

        const loadedMessages: ChatMessage[] = conversation.messages.map((storedMsg) =>
          convertStoredMessageToChatMessage(storedMsg, socketId)
        );

        // Track loaded message IDs to prevent duplicates
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
  };

  useEffect(() => {
    if (!conversationId || !username) {
      Alert.alert('Error', 'Missing conversation ID or username');
      router.back();
      return;
    }

    // Reset messages loaded flag when conversationId changes
    messagesLoadedRef.current = false;
    setMessages([]);

    // Don't initialize connection if chat is ended
    if (isChatEnded) {
      return;
    }

    let isMounted = true;
    let connectionCheckInterval: ReturnType<typeof setInterval>;

    const initializeConnection = async () => {
      try {
        // Load previous messages first
        await loadPreviousMessages();

        // Start connection attempt - resolves immediately to unblock UI
        // Connection happens in background and UI updates via status checks
        await socketService.connect(conversationId);

        if (!isMounted) return;

        // Check connection status immediately and then periodically
        setIsConnected(socketService.isConnected());

        setTimeout(() => {
          if (isMounted) {
            currentSocketId.current = socketService.getSocketId();
          }
        }, 100);

        const updateSocketId = () => {
          const socketId = socketService.getSocketId();
          if (socketId) {
            currentSocketId.current = socketId;
          }
        };

        updateSocketId();
        setTimeout(updateSocketId, 200);

        await socketService.joinConversation(conversationId, (data) => {
          if (!isMounted) return;
          setIsJoined(true);
          setRoomSize(data.roomSize || 0);
          updateSocketId();
          addSystemMessage(`Joined conversation ${conversationId} (${data.roomSize || 0} users in room)`);
        });

        const handleNewMessage = (message: SocketChatMessage) => {
          if (!isMounted) return;

          if (sentMessageIds.current.has(message.id)) {
            return;
          }

          const isCurrentUser = message.socketId === currentSocketId.current;
          sentMessageIds.current.add(message.id);

          let messageType: MessageType = 'text';
          let fileAttachment: FileAttachment | undefined;

          if (message.file) {
            messageType = isImageFile(message.file.name) ? 'image' : 'file';
            fileAttachment = message.file;
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
          };

          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === message.id);
            if (exists) return prev;
            return [...prev, chatMessage];
          });
        };

        socketService.onNewMessage(handleNewMessage);

        const handleUserJoined = (data: { conversationId: string; socketId: string; roomSize: number }) => {
          if (!isMounted) return;
          setRoomSize(data.roomSize || 0);
          addSystemMessage(`👤 User joined (${data.roomSize || 0} users in room)`);
        };

        const handleUserLeft = (data: { conversationId: string; socketId: string; roomSize: number }) => {
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

        // Handle typing indicators from other users (matches frontend behavior exactly)
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
          console.log('Socket disconnected in ChatScreen:', reason);
          setIsConnected(false);
          setIsJoined(false);
          // Stop typing indicator on disconnect
          if (isTypingRef.current && conversationId && username) {
            socketService.emitTypingStop(conversationId, username);
            isTypingRef.current = false;
          }
          // Clear typing users on disconnect
          setTypingUsers(new Map());
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
          console.error('Socket error in ChatScreen:', error);
          setIsConnected(false);
          setIsJoined(false);
        });

        // Check connection status periodically (less frequently to reduce overhead)
        connectionCheckInterval = setInterval(() => {
          if (!isMounted) return;
          const connected = socketService.isConnected();
          setIsConnected(connected);
          if (!connected) {
            setIsJoined(false);
          } else if (connected && !isJoined) {
            // If connected but not joined, try to join again
            socketService.joinConversation(conversationId, (data) => {
              if (!isMounted) return;
              setIsJoined(true);
              setRoomSize(data.roomSize || 0);
              addSystemMessage(`Rejoined conversation ${conversationId} (${data.roomSize || 0} users in room)`);
            });
          }
        }, 2000); // Check every 2 seconds instead of 1

        return () => {
          socketService.offNewMessage(handleNewMessage);
          socketService.offUserTyping(handleUserTyping);
          socketService.offFeedbackSubmitted();
          socketService.leaveConversation(conversationId);
        };
      } catch (error) {
        console.error('Failed to initialize connection:', error);
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          addSystemMessage(`❌ Failed to connect: ${errorMessage}`);
          
          // Show helpful error message
          if (errorMessage.includes('localhost') || errorMessage.includes('timeout')) {
            addSystemMessage('💡 Tip: For physical devices, use your computer\'s IP address instead of localhost');
            addSystemMessage('💡 Set EXPO_PUBLIC_SOCKET_URL=http://YOUR_IP:3000');
          }
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
        socketService.emitTypingStop(conversationId!, username);
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (!isChatEnded) {
        socketService.leaveConversation(conversationId!);
        socketService.disconnect();
      }
    };
  }, [conversationId, username, router, isChatEnded]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Reset messages loaded flag when conversationId changes
  useEffect(() => {
    messagesLoadedRef.current = false;
    setMessages([]);
  }, [conversationId]);

  const addSystemMessage = (text: string) => {
    systemMessageCounter.current += 1;
    const message: ChatMessage = {
      id: `sys-${Date.now()}-${systemMessageCounter.current}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      text,
      sender: 'system',
      timestamp: new Date(),
    };
    setMessages((prev) => {
      // Check if message already exists to prevent duplicates
      const exists = prev.some((msg) => msg.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
  };

  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || !conversationId) {
      return;
    }

    // Stop typing indicator when sending message
    if (isTypingRef.current) {
      socketService.emitTypingStop(conversationId, username);
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      // Ensure we are connected and joined to the conversation before sending
      if (!socketService.isConnected()) {
        await socketService.connect(conversationId);
      }

      await socketService.joinConversation(conversationId, (data) => {
        setIsJoined(true);
        setRoomSize(data.roomSize || 0);
      });

      socketService.sendMessage(conversationId, trimmed, username);
      setIsConnected(true);
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      addSystemMessage('❌ Failed to send message. Please check your connection.');
    }
  };

  const handleInputChange = (text: string) => {
    setInputMessage(text);

    // Emit typing start/stop events with debouncing (matches frontend behavior exactly)
    if (isConnected && isJoined && conversationId && !isChatEnded) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // If user is typing and we haven't emitted typing-start yet
      if (text.trim().length > 0 && !isTypingRef.current) {
        socketService.emitTypingStart(conversationId, username);
        isTypingRef.current = true;
        console.log(`📝 [Mobile] Emitted typing-start: ${username || 'User'} in conversation ${conversationId}`);
      }

      // If input is cleared, stop typing immediately (better UX than waiting for timeout)
      if (text.trim().length === 0 && isTypingRef.current) {
        socketService.emitTypingStop(conversationId, username);
        isTypingRef.current = false;
        console.log(`📝 [Mobile] Emitted typing-stop: ${username || 'User'} (input cleared)`);
      }

      // Set timeout to stop typing after 2 seconds of inactivity (matches frontend)
      if (text.trim().length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          if (isTypingRef.current) {
            socketService.emitTypingStop(conversationId, username);
            isTypingRef.current = false;
            console.log(`📝 [Mobile] Emitted typing-stop: ${username || 'User'} (timeout after 2s inactivity)`);
          }
          typingTimeoutRef.current = null;
        }, 2000);
      }
    }
  };

  const handleFeedbackSubmit = async (rating: number, description: string): Promise<void> => {
    try {
      // Submit feedback to backend
      await apiService.submitFeedback(conversationId!, username, rating, description);

      // Stop typing indicator if active
      if (isTypingRef.current) {
        socketService.emitTypingStop(conversationId!, username);
        isTypingRef.current = false;
      }
      
      // Add system message
      addSystemMessage('Chat session ended. Thank you for your feedback!');
      
      // Update state
      setIsChatEnded(true);
      setIsJoined(false);
      
      // Close socket connection gracefully if connected
      if (socketService.isConnected()) {
        try {
          socketService.leaveConversation(conversationId!);
          // Small delay before disconnect to ensure leave event is processed
          setTimeout(() => {
            socketService.disconnect();
            setIsConnected(false);
            router.back();
          }, 2000);
        } catch (error) {
          console.warn('Error disconnecting socket:', error);
          // Still navigate back even if disconnect fails
          router.back();
        }
      } else {
        // Not connected, just navigate back
        router.back();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8, // Compress images to reduce size
      });

      if (!result.canceled && result.assets && conversationId) {
        for (const asset of result.assets) {
          await sendImage(asset.uri, asset.fileName || 'image.jpg');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const sendImage = async (uri: string, fileName: string) => {
    if (!conversationId) return;

    const fileId = `${fileName}-${Date.now()}`;
    try {
      setSendingFiles((prev) => new Set(prev).add(fileId));

      // Compress image if needed
      let imageUri = uri;
      try {
        const fileInfo = await ImagePicker.getMediaLibraryPermissionsAsync();
        // Estimate file size (in production, get actual size)
        const estimatedSize = 3 * 1024 * 1024; // 3MB estimate
        if (needsCompression(estimatedSize)) {
          imageUri = await compressImage(uri, 1920, 1920, 0.8);
        }
      } catch (compressError) {
        console.warn('Compression failed, sending original:', compressError);
      }

      // Convert to base64
      const base64String = await fileToBase64(imageUri);

      const fileAttachment: FileAttachment = {
        id: `file-${Date.now()}-${Math.random()}`,
        name: fileName,
        type: 'image/jpeg',
        size: 0, // Size not available in React Native without additional library
        url: base64String,
        thumbnailUrl: base64String,
      };

      const messageText = `📷 ${fileName}`;

      // Send with retry
      let retries = 3;
      let sent = false;

      while (retries > 0 && !sent) {
        try {
          if (!socketService.isConnected()) {
            throw new Error('Socket not connected');
          }
          socketService.sendFileMessage(conversationId, messageText, username, fileAttachment);
          sent = true;
        } catch (error) {
          retries--;
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
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
    } catch (error) {
      console.error('Error sending image:', error);
      addSystemMessage(`❌ Failed to send image: ${fileName}`);
      setSendingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.sender === 'system') {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    const isCurrentUser = item.sender === 'user';
    const isImageMsg = item.file && isImageFile(item.file.name);

    return (
      <View style={[styles.messageContainer, isCurrentUser && styles.messageContainerRight]}>
        <View style={[styles.messageBubble, isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft]}>
          {!isCurrentUser && (
            <Text style={styles.messageSender}>{item.username || 'Other User'}</Text>
          )}

          {isImageMsg && item.file ? (
            <Image source={{ uri: item.file.url }} style={styles.messageImage} resizeMode="cover" />
          ) : item.file ? (
            <View style={styles.fileContainer}>
              <Text style={styles.fileIcon}>{getFileIcon(item.file.name)}</Text>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{item.file.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(item.file.size)}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.messageText, isCurrentUser && styles.messageTextRight]}>{item.text}</Text>
          )}

          <Text style={[styles.messageTime, isCurrentUser && styles.messageTimeRight]}>
            {formatTime(new Date(item.timestamp))}
          </Text>
        </View>
      </View>
    );
  };

  if (!conversationId || !username) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Room: {conversationId}</Text>
            <View style={styles.headerStatus}>
              <View style={[styles.statusDot, isConnected && styles.statusDotConnected]} />
              <Text style={styles.headerStatusText}>
                {isConnected ? 'Connected' : 'Disconnected'} • {roomSize} users
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
           
            {/* End Chat button - always visible (mandatory) */}
            <TouchableOpacity
              style={styles.endChatButton}
              onPress={() => {
                setShowFeedbackModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.endChatButtonText}>
                End Chat
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isConnected && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Connecting...</Text>
          </View>
        )}

        {sendingFiles.size > 0 && (
          <View style={styles.sendingIndicator}>
            <ActivityIndicator size="small" color="#667eea" />
            <Text style={styles.sendingText}>
              Sending {sendingFiles.size} file{sendingFiles.size > 1 ? 's' : ''}...
            </Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          numColumns={viewMode === 'grid' ? 2 : 1}
        />

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#667eea" />
            <Text style={styles.typingText}>
              {Array.from(typingUsers.values()).length === 1
                ? `${Array.from(typingUsers.values())[0]} is typing...`
                : Array.from(typingUsers.values()).length === 2
                ? `${Array.from(typingUsers.values())[0]} and ${Array.from(typingUsers.values())[1]} are typing...`
                : `${Array.from(typingUsers.values()).length} people are typing...`}
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            // Allow selecting images anytime; actual sending is gated by socket connection in sendImage
            onPress={handlePickImage}
          >
            <Ionicons name="attach" size={24} color="#667eea" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={handleInputChange}
            placeholder={isConnected && isJoined ? 'Type a message...' : 'Connecting...'}
            placeholderTextColor="#999"
            // Allow typing even while connecting; sending is still gated by isConnected && isJoined
            editable={!isChatEnded}
            onSubmitEditing={handleSendMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputMessage.trim() || isChatEnded) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || isChatEnded}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!inputMessage.trim() || isChatEnded) ? "#999" : "#fff"} 
            />
          </TouchableOpacity>
        </View>

        <FeedbackModal
          isOpen={showFeedbackModal}
          conversationId={conversationId!}
          username={username}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (themeColors: typeof lightColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    backgroundColor: colors.primary[500],
    padding: spacing[4],
    paddingTop: Platform.OS === 'ios' ? 50 : spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing[3],
  },
  backButtonText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontFamily: typography.button.fontFamily,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: colors.neutral[0],
    fontSize: fontSize.xl,
    fontFamily: typography.h4.fontFamily,
    fontWeight: 'bold',
    marginBottom: spacing[1],
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error[500],
    marginRight: spacing[1.5],
  },
  statusDotConnected: {
    backgroundColor: colors.success[500],
  },
  headerStatusText: {
    color: colors.neutral[0],
    fontSize: fontSize.xs,
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginLeft: spacing[3],
  },
  viewModeButton: {
    padding: spacing[2],
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewModeButtonText: {
    color: colors.neutral[0],
    fontSize: fontSize.xl,
  },
  loadingContainer: {
    padding: spacing[5],
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[2.5],
    color: themeColors.textSecondary,
    fontSize: fontSize.base,
    fontFamily: typography.body.fontFamily,
  },
  sendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: colors.warning[50],
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  sendingText: {
    marginLeft: spacing[2],
    color: colors.warning[700],
    fontSize: fontSize.sm,
    fontFamily: typography.body.fontFamily,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing[4],
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: spacing[2],
  },
  systemMessageText: {
    color: themeColors.textSecondary,
    fontSize: fontSize.xs,
    fontFamily: typography.body.fontFamily,
    fontStyle: 'italic',
  },
  messageContainer: {
    marginVertical: spacing[1],
    alignItems: 'flex-start',
  },
  messageContainerRight: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing[3],
    borderRadius: spacing[4],
    backgroundColor: themeColors.surface,
  },
  messageBubbleRight: {
    backgroundColor: colors.primary[500],
  },
  messageBubbleLeft: {
    backgroundColor: themeColors.surfaceVariant,
  },
  messageSender: {
    fontSize: fontSize.xs,
    fontFamily: typography.label.fontFamily,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: spacing[1],
  },
  messageText: {
    fontSize: fontSize.base,
    fontFamily: typography.body.fontFamily,
    color: themeColors.text,
  },
  messageTextRight: {
    color: colors.neutral[0],
  },
  messageTime: {
    fontSize: fontSize.xs,
    color: themeColors.textTertiary,
    marginTop: spacing[1],
  },
  messageTimeRight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: spacing[3],
    marginBottom: spacing[1],
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    backgroundColor: themeColors.surfaceVariant,
    borderRadius: spacing[2],
  },
  fileIcon: {
    fontSize: fontSize['2xl'],
    marginRight: spacing[3],
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: fontSize.sm,
    fontFamily: typography.label.fontFamily,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: spacing[0.5],
  },
  fileSize: {
    fontSize: fontSize.xs,
    color: themeColors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing[3],
    backgroundColor: themeColors.surface,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: spacing[2.5],
    marginRight: spacing[2],
  },
  attachButtonText: {
    fontSize: fontSize['xl'],
  },
  input: {
    flex: 1,
    backgroundColor: themeColors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    fontSize: fontSize.base,
    fontFamily: typography.body.fontFamily,
    color: themeColors.text,
    maxHeight: 100,
    marginRight: spacing[2],
  },
  sendButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 20,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral[400],
    opacity: 0.6,
  },
  sendButtonText: {
    color: colors.neutral[0],
    fontFamily: typography.button.fontFamily,
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: themeColors.surfaceVariant,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  typingText: {
    marginLeft: spacing[2],
    fontSize: fontSize.sm,
    fontFamily: typography.body.fontFamily,
    color: themeColors.textSecondary,
    fontStyle: 'italic',
  },
  endChatButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: spacing[2],
    minWidth: 80,
  },
  endChatButtonText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontFamily: typography.button.fontFamily,
    fontWeight: '600',
  },
});

const styles = createStyles(lightColors);

