export type MessageType = 'text' | 'image' | 'file' | 'link';

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // Base64 data URL (data:image/png;base64,...) for real-time sharing
  thumbnailUrl?: string; // Base64 data URL for images
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  text?: string;
  sender: 'user' | 'other' | 'system';
  timestamp: Date | string;
  username?: string;
  socketId?: string;
  file?: FileAttachment;
  linkPreview?: LinkPreview;
}

