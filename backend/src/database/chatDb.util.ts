import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.util';

export interface StoredFileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface StoredChatMessage {
  id: string;
  conversationId: string;
  userId?: string;
  username?: string;
  message: string;
  timestamp: string;
  socketId?: string;
  file?: StoredFileAttachment;
}

export interface ConversationRecord {
  conversationId: string;
  messages: StoredChatMessage[];
}

export interface ChatDatabaseSchema {
  conversations: Record<string, ConversationRecord>;
}

const DB_PATH = path.resolve(__dirname, 'db.json');

async function ensureDbFileExists(): Promise<void> {
  try {
    await fs.access(DB_PATH);
  } catch {
    const initial: ChatDatabaseSchema = { conversations: {} };
    await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    Logger.info('[chatDb] Initialized db.json');
  }
}

async function readDb(): Promise<ChatDatabaseSchema> {
  await ensureDbFileExists();
  const raw = await fs.readFile(DB_PATH, 'utf8').catch(() => '');
  if (!raw.trim()) {
    return { conversations: {} };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.conversations || typeof parsed.conversations !== 'object') {
      return { conversations: {} };
    }
    return parsed as ChatDatabaseSchema;
  } catch (error) {
    Logger.error('[chatDb] Failed to parse db.json, resetting structure', error);
    return { conversations: {} };
  }
}

async function writeDb(db: ChatDatabaseSchema): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export async function appendChatMessage(message: StoredChatMessage): Promise<void> {
  try {
    const db = await readDb();
    const existing = db.conversations[message.conversationId];

    if (existing) {
      existing.messages.push(message);
    } else {
      db.conversations[message.conversationId] = {
        conversationId: message.conversationId,
        messages: [message],
      };
    }

    await writeDb(db);
  } catch (error) {
    Logger.error(
      `[chatDb] Failed to append message ${message.id} for conversation ${message.conversationId}`,
      error
    );
  }
}

export async function getAllConversations(): Promise<Record<string, ConversationRecord>> {
  const db = await readDb();
  return db.conversations;
}

export async function getConversationById(
  conversationId: string
): Promise<ConversationRecord | null> {
  const db = await readDb();
  return db.conversations[conversationId] ?? null;
}

// Feedback functions moved to feedbackDb.util.ts
// Import from there instead: import { appendFeedback, getAllFeedback, getFeedbackByConversationId } from './feedbackDb.util';



