/**
 * API service for backend communication
 */

import { APP_CONFIG } from '../constants/config';

export interface ActiveRoom {
  conversationId: string;
  roomSize: number;
}

interface GetActiveRoomsResponse {
  rooms: ActiveRoom[];
  totalConnections: number;
  roomCount: number;
}

// Get API base URL from socket URL (replace socket port/endpoint with API endpoint)
const getApiBaseUrl = (): string => {
  const socketUrl = APP_CONFIG.socketUrl;
  // Extract base URL and replace /socket or :3000 with /api base
  const url = new URL(socketUrl);
  return `${url.protocol}//${url.host}/api`;
};

const API_BASE = getApiBaseUrl();

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

export const apiService = {
  async getActiveRooms(): Promise<GetActiveRoomsResponse> {
    const res = await fetch(`${API_BASE}/socket/rooms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<GetActiveRoomsResponse>(res);
  },

  async getConversationMessages(conversationId: string): Promise<ConversationRecord | null> {
    const res = await fetch(
      `${API_BASE}/chat/messages?conversationId=${encodeURIComponent(conversationId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.status === 404) {
      return null;
    }

    return handleResponse<ConversationRecord>(res);
  },

  async getAllConversations(): Promise<GetAllConversationsResponse> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<GetAllConversationsResponse>(res);
  },

  async submitFeedback(
    conversationId: string,
    username: string | undefined,
    rating: number,
    description?: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/chat/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        username,
        rating,
        description: description?.trim() || undefined,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to submit feedback');
    }

    return handleResponse<any>(res);
  },
};

