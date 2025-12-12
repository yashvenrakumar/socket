export interface ActiveRoom {
  conversationId: string;
  roomSize: number;
}

interface GetActiveRoomsResponse {
  rooms: ActiveRoom[];
  totalConnections: number;
  roomCount: number;
}

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const json = await response.json();
  // Our backend wraps data inside { success, message, data }
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}

export interface ConversationRecord {
  conversationId: string;
  messages: StoredChatMessage[];
}

export interface StoredChatMessage {
  id: string;
  conversationId: string;
  userId?: string;
  username?: string;
  message: string;
  timestamp: string;
  socketId?: string;
  file?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
  };
}

export interface GetAllConversationsResponse {
  conversations: Record<string, ConversationRecord>;
}

export interface ChatFeedback {
  id: string;
  conversationId: string;
  username?: string;
  rating: number;
  description?: string;
  timestamp: string;
}

export interface GetFeedbackResponse {
  totalFeedback: number;
  feedback: ChatFeedback[];
}

export interface ConversationSummary {
  conversationId: string;
  messageCount: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  participants: string[];
}

export interface UserAnalytics {
  username: string;
  messageCount: number;
  conversations: string[];
}

export interface ChatAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  totalParticipants: number;
  conversationIds: string[];
  messagesPerConversation: Record<string, number>;
  conversationSummaries: ConversationSummary[];
  users: UserAnalytics[];
  firstMessageAt: string | null;
  lastMessageAt: string | null;
}

export const apiService = {
  async getActiveRooms(): Promise<GetActiveRoomsResponse> {
    const res = await fetch(`${API_BASE}/socket/rooms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<GetActiveRoomsResponse>(res as any);
  },

  async getConversationMessages(conversationId: string): Promise<ConversationRecord | null> {
    const res = await fetch(`${API_BASE}/chat/messages?conversationId=${encodeURIComponent(conversationId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404) {
      return null;
    }

    return handleResponse<ConversationRecord>(res as any);
  },

  async getAllConversations(): Promise<GetAllConversationsResponse> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<GetAllConversationsResponse>(res as any);
  },

  async getFeedback(conversationId?: string): Promise<GetFeedbackResponse> {
    const url = conversationId
      ? `${API_BASE}/chat/feedback?conversationId=${encodeURIComponent(conversationId)}`
      : `${API_BASE}/chat/feedback`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<GetFeedbackResponse>(res as any);
  },

  async submitFeedback(
    conversationId: string,
    username: string | undefined,
    rating: number,
    description: string
  ): Promise<ChatFeedback> {
    const res = await fetch(`${API_BASE}/chat/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        username,
        rating,
        description,
      }),
    });

    return handleResponse<ChatFeedback>(res as any);
  },

  async getChatAnalytics(): Promise<ChatAnalytics> {
    const res = await fetch(`${API_BASE}/chat/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    });

    return handleResponse<ChatAnalytics>(res as any);
  },
};


