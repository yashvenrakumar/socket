import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Chat, ConversationSummary, Rating, ConversationInfo, Note, RecentChat, VisitorActivity } from '../types/dashboard.types';
import { ChatMessage } from '../types/message.types';
import { apiService, ActiveRoom, ConversationRecord, StoredChatMessage } from '../services/api.service';
import { socketService, ChatMessage as SocketChatMessage } from '../services/socket.service';
import ChatList from './ChatList';
import ConversationView from './ConversationView';
import VisitorInfoPanel from './VisitorInfoPanel';
import './ChatDashboard.css';

interface ChatDashboardProps {
  currentUsername?: string;
  currentAgentId?: string;
}

const ChatDashboard = ({ currentUsername, currentAgentId }: ChatDashboardProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [summaries, setSummaries] = useState<Map<string, ConversationSummary>>(new Map());
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map());
  const [conversationInfos, setConversationInfos] = useState<Map<string, ConversationInfo>>(new Map());
  const [notes, setNotes] = useState<Map<string, Note[]>>(new Map());
  const [recentChats, setRecentChats] = useState<Map<string, RecentChat[]>>(new Map());
  const [activities, setActivities] = useState<Map<string, VisitorActivity[]>>(new Map());
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const socketListenerSetupRef = useRef<boolean>(false);

  // Convert StoredChatMessage to ChatMessage for last message display
  const getLastMessageFromStored = useCallback((messages: StoredChatMessage[]): Chat['lastMessage'] | undefined => {
    if (!messages || messages.length === 0) return undefined;
    
    const lastMsg = messages[messages.length - 1];
    return {
      text: lastMsg.message,
      timestamp: new Date(lastMsg.timestamp),
      sender: 'visitor' as const, // Default to visitor, can be improved
    };
  }, []);

  // Load all conversations from database
  const loadConversationsFromDatabase = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const response = await apiService.getAllConversations();
      const conversations = response.conversations || {};

      // Convert database conversations to Chat format
      const chatsFromDb: Chat[] = Object.values(conversations).map((conv: ConversationRecord) => {
        const lastMsg = getLastMessageFromStored(conv.messages);
        return {
          id: conv.conversationId,
          conversationId: conv.conversationId,
          visitor: {
            id: `visitor-${conv.conversationId.substring(0, 6)}`,
            type: 'new' as const,
          },
          status: 'active' as const,
          priority: 'medium' as const,
          unreadCount: 0, // Will be updated by socket listener
          tags: [],
          createdAt: conv.messages.length > 0 ? new Date(conv.messages[0].timestamp) : new Date(),
          updatedAt: lastMsg ? lastMsg.timestamp : new Date(),
          messageCount: conv.messages.length,
          lastMessage: lastMsg,
        };
      });

      setChats((prev) => {
        const existingByConversationId = new Map<string, Chat>();
        prev.forEach((chat) => {
          existingByConversationId.set(chat.conversationId, chat);
        });

        // Merge database chats with existing chats, preserving unread counts
        chatsFromDb.forEach((dbChat) => {
          const existing = existingByConversationId.get(dbChat.conversationId);
          if (existing) {
            // Preserve unread count and update other fields
            existingByConversationId.set(dbChat.conversationId, {
              ...dbChat,
              unreadCount: existing.unreadCount, // Preserve unread count
              status: existing.status, // Preserve status
            });
          } else {
            existingByConversationId.set(dbChat.conversationId, dbChat);
          }
        });

        return Array.from(existingByConversationId.values());
      });
    } catch (error) {
      console.error('Error loading conversations from database:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [getLastMessageFromStored]);

  // Fetch active rooms from backend
  const fetchActiveRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      setRoomsError(null);
      const response = await apiService.getActiveRooms();
      setActiveRooms(response.rooms || []);

      // Convert active rooms to chats if they don't exist
      setChats((prev) => {
        const existingByConversationId = new Map<string, Chat>();
        prev.forEach((chat) => {
          existingByConversationId.set(chat.conversationId, chat);
        });

        const newChatsFromRooms: Chat[] = (response.rooms || [])
          .filter((room) => !existingByConversationId.has(room.conversationId))
          .map((room) => ({
            id: room.conversationId,
            conversationId: room.conversationId,
            visitor: {
              id: `visitor-${room.conversationId.substring(0, 6)}`,
              type: 'new' as const,
            },
            status: room.roomSize > 0 ? ('active' as const) : ('waiting' as const),
            priority: 'medium' as const,
            unreadCount: 0,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            messageCount: 0,
          }));

        // Merge sample/previous chats with newly discovered rooms
        newChatsFromRooms.forEach((chat) => {
          existingByConversationId.set(chat.conversationId, chat);
        });

        // Update status for existing chats based on room size
        const updatedChats: Chat[] = Array.from(existingByConversationId.values()).map((chat) => {
          const room = (response.rooms || []).find((r) => r.conversationId === chat.conversationId);
          if (room) {
            return {
              ...chat,
              status: room.roomSize > 0 ? ('active' as const) : chat.status,
            };
          }
          return chat;
        });

        return updatedChats;
      });
    } catch (error) {
      console.error('Error fetching active rooms:', error);
      setRoomsError(error instanceof Error ? error.message : 'Failed to fetch active rooms');
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Load conversations from database on mount
  useEffect(() => {
    loadConversationsFromDatabase();
  }, [loadConversationsFromDatabase]);

  // Fetch active rooms on mount and periodically
  useEffect(() => {
    fetchActiveRooms();

    const interval = setInterval(() => {
      fetchActiveRooms();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchActiveRooms]);

  // Periodically refresh conversations to detect new messages and update unread counts
  useEffect(() => {
    const refreshConversations = async () => {
      try {
        const response = await apiService.getAllConversations();
        const conversations = response.conversations || {};

        setChats((prev) => {
          const updated = prev.map((chat) => {
            const dbConversation = conversations[chat.conversationId];
            if (!dbConversation || !dbConversation.messages || dbConversation.messages.length === 0) {
              return chat;
            }

            const dbMessageCount = dbConversation.messages.length;
            const dbLastMessage = getLastMessageFromStored(dbConversation.messages);
            const isSelected = selectedChat?.conversationId === chat.conversationId;

            // Detect new messages by comparing message counts
            const hasNewMessages = dbMessageCount > chat.messageCount;
            const newUnreadCount = hasNewMessages && !isSelected
              ? Math.max(chat.unreadCount, dbMessageCount - chat.messageCount)
              : isSelected
              ? 0 // Clear unread when selected
              : chat.unreadCount; // Preserve if not selected and no new messages

            return {
              ...chat,
              lastMessage: dbLastMessage || chat.lastMessage,
              updatedAt: dbLastMessage ? dbLastMessage.timestamp : chat.updatedAt,
              messageCount: dbMessageCount,
              unreadCount: newUnreadCount,
              status: dbMessageCount > 0 && chat.status === 'closed' ? 'active' as const : chat.status,
            };
          });

          // Add new conversations from database
          Object.keys(conversations).forEach((convId) => {
            const exists = updated.some((c) => c.conversationId === convId);
            if (!exists) {
              const conv = conversations[convId];
              const lastMsg = getLastMessageFromStored(conv.messages);
              const newChat: Chat = {
                id: convId,
                conversationId: convId,
                visitor: {
                  id: `visitor-${convId.substring(0, 6)}`,
                  type: 'new' as const,
                },
                status: 'active' as const,
                priority: 'medium' as const,
                unreadCount: selectedChat?.conversationId === convId ? 0 : (conv.messages?.length || 0),
                tags: [],
                createdAt: conv.messages && conv.messages.length > 0 ? new Date(conv.messages[0].timestamp) : new Date(),
                updatedAt: lastMsg ? lastMsg.timestamp : new Date(),
                messageCount: conv.messages?.length || 0,
                lastMessage: lastMsg,
              };
              updated.push(newChat);
            }
          });

          return updated;
        });
      } catch (error) {
        console.error('Error refreshing conversations:', error);
      }
    };

    // Refresh immediately and then periodically
    refreshConversations();
    const interval = setInterval(refreshConversations, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [selectedChat, getLastMessageFromStored]);

  const handleChatSelect = useCallback((chat: Chat) => {
    setSelectedChat(chat);
    
    // Clear unread count when agent selects a conversation
    setChats((prev) =>
      prev.map((c) =>
        c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  const handleCloseChat = useCallback(() => {
    if (selectedChat) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChat.id ? { ...chat, status: 'closed' as const } : chat
        )
      );
      setSelectedChat(null);
    }
  }, [selectedChat]);

  const handleAddNote = useCallback(
    (chatId: string, content: string, type: 'private' | 'team') => {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        chatId,
        author: {
          id: currentAgentId || 'agent-1',
          name: currentUsername || 'Agent',
        },
        content,
        type,
        createdAt: new Date(),
      };

      setNotes((prev) => {
        const chatNotes = prev.get(chatId) || [];
        return new Map(prev).set(chatId, [...chatNotes, newNote]);
      });
    },
    [currentAgentId, currentUsername]
  );

  const handleDeleteNote = useCallback((chatId: string, noteId: string) => {
    if (!chatId || !noteId) return;
    
    setNotes((prev) => {
      const chatNotes = prev.get(chatId) || [];
      const updatedNotes = chatNotes.filter((note) => note.id !== noteId);
      const newMap = new Map(prev);
      if (updatedNotes.length > 0) {
        newMap.set(chatId, updatedNotes);
      } else {
        newMap.delete(chatId);
      }
      return newMap;
    });
  }, []);

  const handleUpdateSummary = useCallback((chatId: string, summary: Partial<ConversationSummary>) => {
    if (!chatId) return;
    
    setSummaries((prev) => {
      const existing = prev.get(chatId);
      const updated: ConversationSummary = {
        id: chatId,
        enabled: existing?.enabled ?? true,
        ...existing,
        ...summary,
      };
      return new Map(prev).set(chatId, updated);
    });
  }, []);

  // Get data for selected chat
  const selectedChatSummary = selectedChat ? summaries.get(selectedChat.id) : undefined;
  const selectedChatRating = selectedChat ? ratings.get(selectedChat.id) : undefined;
  const selectedChatInfo = selectedChat ? conversationInfos.get(selectedChat.id) : undefined;
  const selectedChatNotes = selectedChat ? notes.get(selectedChat.id) || [] : [];
  const selectedChatRecentChats = selectedChat ? recentChats.get(selectedChat.visitor.id) || [] : [];
  const selectedChatActivities = selectedChat ? activities.get(selectedChat.visitor.id) || [] : [];

  // Mock conversation info from selected chat
  const conversationInfo = useMemo(() => {
    if (!selectedChat) return undefined;

    return {
      duration: selectedChat.duration || 0,
      messageCount: selectedChat.messageCount || 0,
      tags: selectedChat.tags,
    };
  }, [selectedChat]);

  return (
    <div className="chat-dashboard-container">
      <div className="chat-dashboard-layout">
        {/* Left Sidebar - Chat List */}
        <div className="dashboard-sidebar-left">
          {loadingRooms && (
            <div className="rooms-loading-indicator">
              <span>🔄 Loading active rooms...</span>
            </div>
          )}
          {roomsError && (
            <div className="rooms-error-indicator">
              <span>⚠️ {roomsError}</span>
            </div>
          )}
          {activeRooms.length > 0 && (
            <div className="rooms-info-indicator">
              <span>📊 {activeRooms.length} active room{activeRooms.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          <ChatList
            chats={chats}
            selectedChatId={selectedChat?.id}
            onChatSelect={handleChatSelect}
          />
        </div>

        {/* Center Panel - Conversation View */}
        <div className="dashboard-center">
          <ConversationView
            chat={selectedChat}
            messages={messages}
            summary={selectedChatSummary}
            rating={selectedChatRating}
            conversationInfo={selectedChatInfo}
            onCloseChat={handleCloseChat}
            onUpdateSummary={
              selectedChat
                ? (summary) => handleUpdateSummary(selectedChat.id, summary)
                : undefined
            }
            currentUsername={currentUsername}
          />
        </div>

        {/* Right Sidebar - Visitor Info */}
        <div className="dashboard-sidebar-right">
          <VisitorInfoPanel
            visitor={selectedChat?.visitor || null}
            recentChats={selectedChatRecentChats}
            activities={selectedChatActivities}
            notes={selectedChatNotes}
            conversationInfo={conversationInfo}
            onAddNote={
              selectedChat
                ? (content: string, type: 'private' | 'team') => {
                    if (content.trim()) {
                      handleAddNote(selectedChat.id, content.trim(), type);
                    }
                  }
                : undefined
            }
            onDeleteNote={
              selectedChat
                ? (noteId) => handleDeleteNote(selectedChat.id, noteId)
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;

