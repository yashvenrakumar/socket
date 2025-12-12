export type ChatStatus = 'active' | 'missed' | 'closed' | 'waiting' | 'transferred';

export type ChatPriority = 'high' | 'medium' | 'low';

export type VisitorType = 'new' | 'returning' | 'vip';

export type AgentStatus = 'online' | 'away' | 'busy' | 'offline';

export interface Visitor {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
    ipAddress?: string;
  };
  type: VisitorType;
  language?: string;
  customFields?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status: AgentStatus;
  skills?: string[];
}

export interface Chat {
  id: string;
  conversationId: string;
  visitor: Visitor;
  agent?: Agent;
  status: ChatStatus;
  priority: ChatPriority;
  lastMessage?: {
    text: string;
    timestamp: Date | string;
    sender: 'visitor' | 'agent' | 'system';
  };
  unreadCount: number;
  tags: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  duration?: number; // in seconds
  messageCount?: number;
  firstResponseTime?: number; // in seconds
  resolutionTime?: number; // in seconds
}

export interface ConversationSummary {
  id: string;
  summary?: string;
  keyPoints?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number; // 0-100
  resolutionStatus?: 'resolved' | 'unresolved' | 'pending';
  tags?: string[];
  enabled: boolean;
}

export interface Rating {
  id: string;
  chatId: string;
  stars?: number; // 1-5
  nps?: number; // 0-10
  feedback?: string;
  agentRating?: number;
  timestamp: Date | string;
}

export interface Note {
  id: string;
  chatId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  type: 'private' | 'team';
  category?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface ConversationInfo {
  chatId: string;
  duration: number; // in seconds
  messageCount: number;
  averageResponseTime: number; // in seconds
  firstResponseTime: number; // in seconds
  resolutionTime?: number; // in seconds
  tags: string[];
  agent?: Agent;
  transferHistory?: Array<{
    from: Agent;
    to: Agent;
    timestamp: Date | string;
    reason?: string;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

export interface VisitorActivity {
  id: string;
  type: 'page_view' | 'click' | 'navigation' | 'chat_start' | 'chat_end';
  page?: string;
  url?: string;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
}

export interface RecentChat {
  id: string;
  conversationId: string;
  visitor: Visitor;
  status: ChatStatus;
  lastMessage?: {
    text: string;
    timestamp: Date | string;
  };
  duration: number;
  messageCount: number;
  createdAt: Date | string;
  tags: string[];
}

