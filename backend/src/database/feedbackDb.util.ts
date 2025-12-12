import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.util';

export interface ChatFeedback {
  id: string;
  conversationId: string;
  username?: string;
  rating: number;
  description?: string;
  timestamp: string;
}

export interface FeedbackDatabaseSchema {
  feedback: ChatFeedback[];
}

const FEEDBACK_DB_PATH = path.resolve(__dirname, 'feedback.json');

async function ensureFeedbackDbFileExists(): Promise<void> {
  try {
    await fs.access(FEEDBACK_DB_PATH);
  } catch {
    const initial: FeedbackDatabaseSchema = { feedback: [] };
    await fs.writeFile(FEEDBACK_DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    Logger.info('[feedbackDb] Initialized feedback.json');
  }
}

async function readFeedbackDb(): Promise<FeedbackDatabaseSchema> {
  await ensureFeedbackDbFileExists();
  const raw = await fs.readFile(FEEDBACK_DB_PATH, 'utf8').catch(() => '');
  if (!raw.trim()) {
    return { feedback: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.feedback || !Array.isArray(parsed.feedback)) {
      return { feedback: [] };
    }
    return parsed as FeedbackDatabaseSchema;
  } catch (error) {
    Logger.error('[feedbackDb] Failed to parse feedback.json, resetting structure', error);
    return { feedback: [] };
  }
}

async function writeFeedbackDb(db: FeedbackDatabaseSchema): Promise<void> {
  await fs.writeFile(FEEDBACK_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

/**
 * Append feedback to feedback.json file
 * Feedback is stored with conversationId for easy filtering
 */
export async function appendFeedback(feedback: ChatFeedback): Promise<void> {
  try {
    const db = await readFeedbackDb();
    if (!db.feedback) {
      db.feedback = [];
    }
    db.feedback.push(feedback);
    await writeFeedbackDb(db);
    Logger.info(`[feedbackDb] Feedback saved for conversation ${feedback.conversationId} in feedback.json`);
  } catch (error) {
    Logger.error(
      `[feedbackDb] Failed to append feedback for conversation ${feedback.conversationId}`,
      error
    );
    throw error;
  }
}

/**
 * Get all feedback from feedback.json
 */
export async function getAllFeedback(): Promise<ChatFeedback[]> {
  const db = await readFeedbackDb();
  return db.feedback || [];
}

/**
 * Get feedback by conversationId from feedback.json
 */
export async function getFeedbackByConversationId(
  conversationId: string
): Promise<ChatFeedback[]> {
  const db = await readFeedbackDb();
  return (db.feedback || []).filter((f) => f.conversationId === conversationId);
}

