import { Router, Request, Response } from 'express';
import { Logger } from '../utils/logger.util';
import { ResponseUtil } from '../utils/response.util';
import { SocketService } from '../services/socket.service';
import {
  StoredFileAttachment,
  StoredChatMessage,
  ConversationRecord,
  appendChatMessage,
  getAllConversations,
  getConversationById,
} from '../database/chatDb.util';
import {
  ChatFeedback,
  appendFeedback,
  getAllFeedback,
  getFeedbackByConversationId,
} from '../database/feedbackDb.util';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatFileAttachment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "file-123"
 *         name:
 *           type: string
 *           example: "document.pdf"
 *         type:
 *           type: string
 *           example: "application/pdf"
 *         size:
 *           type: number
 *           example: 1024
 *         url:
 *           type: string
 *           description: Base64 data URL or file URL
 *           example: "data:application/pdf;base64,JVBERi0xLjQK..."
 *         thumbnailUrl:
 *           type: string
 *           nullable: true
 *           example: "data:image/png;base64,iVBORw0KGgo..."
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "msg-1234567890-abc123"
 *         conversationId:
 *           type: string
 *           example: "conv-123"
 *         userId:
 *           type: string
 *           nullable: true
 *           example: "user-456"
 *         username:
 *           type: string
 *           nullable: true
 *           example: "Agent-1"
 *         message:
 *           type: string
 *           example: "Hello, how can I help you?"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-01-05T10:30:00.000Z"
 *         socketId:
 *           type: string
 *           nullable: true
 *           example: "abcd1234"
 *         file:
 *           $ref: '#/components/schemas/ChatFileAttachment'
 *           nullable: true
 *     ConversationRecord:
 *       type: object
 *       properties:
 *         conversationId:
 *           type: string
 *           example: "conv-123"
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatMessage'
 *     ChatFeedback:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "feedback-1234567890-abc123"
 *         conversationId:
 *           type: string
 *           example: "conv-123"
 *         username:
 *           type: string
 *           nullable: true
 *           example: "Agent-1"
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         description:
 *           type: string
 *           nullable: true
 *           example: "Great service, very helpful!"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-01-05T10:30:00.000Z"
 *     ChatMessageCreateRequest:
 *       type: object
 *       required:
 *         - conversationId
 *         - message
 *       properties:
 *         conversationId:
 *           type: string
 *           example: "conv-123"
 *         message:
 *           type: string
 *           example: "Hello from REST API"
 *         username:
 *           type: string
 *           example: "Agent-1"
 *         socketId:
 *           type: string
 *           example: "abcd1234"
 *         file:
 *           $ref: '#/components/schemas/ChatFileAttachment'
 */

/**
 * @swagger
 * /api/chat/messages:
 *   get:
 *     summary: Get chat messages from the JSON database
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: false
 *         description: If provided, returns messages only for this conversationId. Otherwise returns all conversations.
 *         example: "conv-123"
 *     responses:
 *       200:
 *         description: Chat data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/ConversationRecord'
 *                     - type: object
 *                       properties:
 *                         totalConversations:
 *                           type: number
 *                         conversations:
 *                           type: object
 *                           additionalProperties:
 *                             $ref: '#/components/schemas/ConversationRecord'
 *             examples:
 *               singleConversation:
 *                 summary: Get messages for specific conversation
 *                 value:
 *                   success: true
 *                   message: "Conversation messages fetched successfully"
 *                   data:
 *                     conversationId: "conv-123"
 *                     messages:
 *                       - id: "msg-1234567890-abc123"
 *                         conversationId: "conv-123"
 *                         username: "Agent-1"
 *                         message: "Hello, how can I help you?"
 *                         timestamp: "2025-01-05T10:30:00.000Z"
 *               allConversations:
 *                 summary: Get all conversations
 *                 value:
 *                   success: true
 *                   message: "Chat conversations fetched successfully"
 *                   data:
 *                     totalConversations: 2
 *                     conversations:
 *                       "conv-123":
 *                         conversationId: "conv-123"
 *                         messages:
 *                           - id: "msg-1234567890-abc123"
 *                             conversationId: "conv-123"
 *                             username: "Agent-1"
 *                             message: "Hello"
 *                             timestamp: "2025-01-05T10:30:00.000Z"
 *       404:
 *         description: Conversation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notFound:
 *                 summary: Conversation not found
 *                 value:
 *                   success: false
 *                   message: "Conversation not found for id: conv-123"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Save a chat message to the JSON database grouped by conversationId
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessageCreateRequest'
 *     responses:
 *       201:
 *         description: Chat message saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.query as { conversationId?: string };

    if (conversationId) {
      const conversation = await getConversationById(conversationId);
      if (!conversation) {
        return ResponseUtil.notFound(res, `Conversation not found for id: ${conversationId}`);
      }

      return ResponseUtil.success(res, conversation, 'Conversation messages fetched successfully');
    }

    const conversations = await getAllConversations();
    const data = {
      totalConversations: Object.keys(conversations).length,
      conversations,
    };

    return ResponseUtil.success(res, data, 'Chat conversations fetched successfully');
  } catch (error) {
    Logger.error('[chat.router] Failed to fetch chat messages', error);
    return ResponseUtil.error(res, 'Internal server error while fetching chat messages');
  }
});

type ConversationAnalytics = {
  conversationId: string;
  messageCount: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  participants: string[];
};

type UserAnalytics = {
  username: string;
  messageCount: number;
  conversations: string[];
};

function buildChatAnalytics(conversations: Record<string, ConversationRecord>) {
  const conversationIds = Object.keys(conversations);
  let totalMessages = 0;
  const messagesPerConversation: Record<string, number> = {};
  const conversationSummaries: ConversationAnalytics[] = [];
  const userStats: Record<string, { messageCount: number; conversations: Set<string> }> = {};

  let firstMessageAt: string | null = null;
  let lastMessageAt: string | null = null;

  for (const conversationId of conversationIds) {
    const messages = conversations[conversationId]?.messages ?? [];
    const messageCount = messages.length;
    const participants = new Set<string>();

    messagesPerConversation[conversationId] = messageCount;
    totalMessages += messageCount;

    let convFirst: string | null = null;
    let convLast: string | null = null;

    for (const message of messages) {
      if (message.username) {
        participants.add(message.username);
        if (!userStats[message.username]) {
          userStats[message.username] = { messageCount: 0, conversations: new Set<string>() };
        }
        userStats[message.username].messageCount += 1;
        userStats[message.username].conversations.add(conversationId);
      }

      if (message.timestamp) {
        const ts = new Date(message.timestamp).toISOString();
        if (!convFirst || ts < convFirst) convFirst = ts;
        if (!convLast || ts > convLast) convLast = ts;
        if (!firstMessageAt || ts < firstMessageAt) firstMessageAt = ts;
        if (!lastMessageAt || ts > lastMessageAt) lastMessageAt = ts;
      }
    }

    conversationSummaries.push({
      conversationId,
      messageCount,
      firstMessageAt: convFirst,
      lastMessageAt: convLast,
      participants: Array.from(participants),
    });
  }

  const users: UserAnalytics[] = Object.entries(userStats).map(([username, stats]) => ({
    username,
    messageCount: stats.messageCount,
    conversations: Array.from(stats.conversations),
  }));

  return {
    totalConversations: conversationIds.length,
    totalMessages,
    averageMessagesPerConversation:
      conversationIds.length === 0 ? 0 : Number((totalMessages / conversationIds.length).toFixed(2)),
    totalParticipants: users.length,
    conversationIds,
    messagesPerConversation,
    conversationSummaries,
    users,
    firstMessageAt,
    lastMessageAt,
  };
}

/**
 * @swagger
 * /api/chat/analytics:
 *   get:
 *     summary: Get aggregated analytics derived from the chat JSON database
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Analytics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalConversations:
 *                       type: number
 *                     totalMessages:
 *                       type: number
 *                     averageMessagesPerConversation:
 *                       type: number
 *                     totalParticipants:
 *                       type: number
 *                     conversationIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                     messagesPerConversation:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                     conversationSummaries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           conversationId:
 *                             type: string
 *                           messageCount:
 *                             type: number
 *                           firstMessageAt:
 *                             type: string
 *                             nullable: true
 *                           lastMessageAt:
 *                             type: string
 *                             nullable: true
 *                           participants:
 *                             type: array
 *                             items:
 *                               type: string
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           messageCount:
 *                             type: number
 *                           conversations:
 *                             type: array
 *                             items:
 *                               type: string
 *                     firstMessageAt:
 *                       type: string
 *                       nullable: true
 *                     lastMessageAt:
 *                       type: string
 *                       nullable: true
 *             examples:
 *               success:
 *                 summary: Analytics example
 *                 value:
 *                   success: true
 *                   message: "Chat analytics fetched successfully"
 *                   data:
 *                     totalConversations: 2
 *                     totalMessages: 4
 *                     averageMessagesPerConversation: 2
 *                     totalParticipants: 2
 *                     conversationIds: ["conv-123", "conv-456"]
 *                     messagesPerConversation:
 *                       conv-123: 2
 *                       conv-456: 2
 *                     conversationSummaries:
 *                       - conversationId: "conv-123"
 *                         messageCount: 2
 *                         firstMessageAt: "2025-01-05T10:30:00.000Z"
 *                         lastMessageAt: "2025-01-05T10:31:00.000Z"
 *                         participants: ["Agent-1", "User-1"]
 *                     users:
 *                       - username: "Agent-1"
 *                         messageCount: 2
 *                         conversations: ["conv-123"]
 *                       - username: "User-1"
 *                         messageCount: 2
 *                         conversations: ["conv-456"]
 *                     firstMessageAt: "2025-01-05T10:30:00.000Z"
 *                     lastMessageAt: "2025-01-05T11:00:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const conversations = await getAllConversations();
    const analytics = buildChatAnalytics(conversations);
    return ResponseUtil.success(res, analytics, 'Chat analytics fetched successfully');
  } catch (error) {
    Logger.error('[chat.router] Failed to build chat analytics', error);
    return ResponseUtil.error(res, 'Internal server error while building chat analytics');
  }
});

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get all conversations and their messages from the JSON database
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Conversations fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Chat conversations fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: object
 *                       additionalProperties:
 *                         $ref: '#/components/schemas/ConversationRecord'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   success: true
 *                   message: "Chat conversations fetched successfully"
 *                   data:
 *                     conversations:
 *                       "conv-123":
 *                         conversationId: "conv-123"
 *                         messages:
 *                           - id: "msg-1234567890-abc123"
 *                             conversationId: "conv-123"
 *                             username: "Agent-1"
 *                             message: "Hello, how can I help you?"
 *                             timestamp: "2025-01-05T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/conversations', async (_req: Request, res: Response) => {
  try {
    const conversations = await getAllConversations();
    // Return the full structure from db.json: { conversations: { [conversationId]: { conversationId, messages: [...] } } }
    const data = { conversations };
    return ResponseUtil.success(res, data, 'Chat conversations fetched successfully');
  } catch (error) {
    Logger.error('[chat.router] Failed to fetch conversations list', error);
    return ResponseUtil.error(res, 'Internal server error while fetching conversations');
  }
});

/**
 * @swagger
 * /api/chat/conversations/{conversationId}:
 *   get:
 *     summary: Get chat messages for a specific conversation ID from the JSON database
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The conversation ID to retrieve messages for
 *         example: "conv-123"
 *     responses:
 *       200:
 *         description: Conversation messages fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Conversation messages fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ConversationRecord'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   success: true
 *                   message: "Conversation messages fetched successfully"
 *                   data:
 *                     conversationId: "conv-123"
 *                     messages:
 *                       - id: "msg-1234567890-abc123"
 *                         conversationId: "conv-123"
 *                         username: "Agent-1"
 *                         message: "Hello, how can I help you?"
 *                         timestamp: "2025-01-05T10:30:00.000Z"
 *                       - id: "msg-1234567891-def456"
 *                         conversationId: "conv-123"
 *                         username: "User-1"
 *                         message: "I need help with my order"
 *                         timestamp: "2025-01-05T10:31:00.000Z"
 *       404:
 *         description: Conversation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notFound:
 *                 summary: Conversation not found
 *                 value:
 *                   success: false
 *                   message: "Conversation not found for id: conv-123"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/conversations/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return ResponseUtil.badRequest(res, 'conversationId is required');
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return ResponseUtil.notFound(res, `Conversation not found for id: ${conversationId}`);
    }

    return ResponseUtil.success(res, conversation, 'Conversation messages fetched successfully');
  } catch (error) {
    Logger.error('[chat.router] Failed to fetch conversation by ID', error);
    return ResponseUtil.error(res, 'Internal server error while fetching conversation');
  }
});

router.post('/messages', async (req: Request, res: Response) => {
  try {
    const { conversationId, message, username, socketId, file } = req.body as {
      conversationId?: string;
      message?: string;
      username?: string;
      socketId?: string;
      file?: StoredFileAttachment;
    };

    if (!conversationId || !message) {
      return ResponseUtil.badRequest(res, 'conversationId and message are required');
    }

    const storedMessage: StoredChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      message,
      username,
      userId: undefined,
      socketId,
      timestamp: new Date().toISOString(),
      file,
    };

    await appendChatMessage(storedMessage);

    return ResponseUtil.success(res, storedMessage, 'Chat message saved successfully', 201);
  } catch (error) {
    Logger.error('[chat.router] Failed to save chat message', error);
    return ResponseUtil.error(res, 'Internal server error while saving chat message');
  }
});

/**
 * @swagger
 * /api/chat/feedback:
 *   post:
 *     summary: Submit chat feedback/rating
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - rating
 *             properties:
 *               conversationId:
 *                 type: string
 *                 example: "conv-123"
 *               username:
 *                 type: string
 *                 example: "Agent-1"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               description:
 *                 type: string
 *                 example: "Great service, very helpful!"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-01-05T10:30:00.000Z"
 *           examples:
 *             basic:
 *               summary: Basic feedback submission
 *               value:
 *                 conversationId: "conv-123"
 *                 username: "Agent-1"
 *                 rating: 4
 *                 description: "Great service!"
 *             minimal:
 *               summary: Minimal feedback (no description)
 *               value:
 *                 conversationId: "conv-123"
 *                 rating: 5
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Feedback submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ChatFeedback'
 *             examples:
 *               success:
 *                 summary: Successful submission
 *                 value:
 *                   success: true
 *                   message: "Feedback submitted successfully"
 *                   data:
 *                     id: "feedback-1234567890-abc123"
 *                     conversationId: "conv-123"
 *                     username: "Agent-1"
 *                     rating: 4
 *                     description: "Great service!"
 *                     timestamp: "2025-01-05T10:30:00.000Z"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingConversationId:
 *                 summary: Missing conversationId
 *                 value:
 *                   success: false
 *                   message: "conversationId is required"
 *               invalidRating:
 *                 summary: Invalid rating
 *                 value:
 *                   success: false
 *                   message: "rating is required and must be between 1 and 5"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const { conversationId, username, rating, description, timestamp } = req.body as {
      conversationId?: string;
      username?: string;
      rating?: number;
      description?: string;
      timestamp?: string;
    };

    if (!conversationId) {
      return ResponseUtil.badRequest(res, 'conversationId is required');
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return ResponseUtil.badRequest(res, 'rating is required and must be between 1 and 5');
    }

    const feedback: ChatFeedback = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      username,
      rating,
      description: description?.trim() || undefined,
      timestamp: timestamp || new Date().toISOString(),
    };

    await appendFeedback(feedback);

    // Broadcast feedback to all users in the conversation room via socket
    SocketService.broadcastFeedback(conversationId, {
      id: feedback.id,
      username: feedback.username,
      rating: feedback.rating,
      description: feedback.description,
      timestamp: feedback.timestamp,
    });

    return ResponseUtil.success(res, feedback, 'Feedback submitted successfully', 201);
  } catch (error) {
    Logger.error('[chat.router] Failed to save feedback', error);
    return ResponseUtil.error(res, 'Internal server error while saving feedback');
  }
});

/**
 * @swagger
 * /api/chat/feedback:
 *   get:
 *     summary: Get all feedback or feedback for a specific conversation (using query parameter)
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: string
 *         description: Optional conversation ID to filter feedback. If not provided, returns all feedback.
 *         example: "conv-123"
 *     responses:
 *       200:
 *         description: Feedback fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Feedback fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalFeedback:
 *                       type: number
 *                       example: 2
 *                     feedback:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatFeedback'
 *             examples:
 *               allFeedback:
 *                 summary: Get all feedback
 *                 value:
 *                   success: true
 *                   message: "Feedback fetched successfully"
 *                   data:
 *                     totalFeedback: 2
 *                     feedback:
 *                       - id: "feedback-1234567890-abc123"
 *                         conversationId: "conv-123"
 *                         username: "Agent-1"
 *                         rating: 4
 *                         description: "Great service!"
 *                         timestamp: "2025-01-05T10:30:00.000Z"
 *                       - id: "feedback-1234567891-def456"
 *                         conversationId: "conv-456"
 *                         username: "User-1"
 *                         rating: 5
 *                         description: "Excellent support"
 *                         timestamp: "2025-01-05T11:00:00.000Z"
 *               filteredFeedback:
 *                 summary: Get feedback for specific conversation
 *                 value:
 *                   success: true
 *                   message: "Feedback fetched successfully"
 *                   data:
 *                     totalFeedback: 1
 *                     feedback:
 *                       - id: "feedback-1234567890-abc123"
 *                         conversationId: "conv-123"
 *                         username: "Agent-1"
 *                         rating: 4
 *                         description: "Great service!"
 *                         timestamp: "2025-01-05T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/feedback', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.query as { conversationId?: string };

    let feedback: ChatFeedback[];
    if (conversationId) {
      feedback = await getFeedbackByConversationId(conversationId);
    } else {
      feedback = await getAllFeedback();
    }

    const data = {
      totalFeedback: feedback.length,
      feedback,
    };

    return ResponseUtil.success(res, data, 'Feedback fetched successfully');
  } catch (error) {
    Logger.error('[chat.router] Failed to fetch feedback', error);
    return ResponseUtil.error(res, 'Internal server error while fetching feedback');
  }
});

/**
 * @swagger
 * /api/chat/feedback/{conversationId}:
 *   get:
 *     summary: Get feedback for a specific conversation ID from the feedback database
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The conversation ID to retrieve feedback for
 *         example: "conv-123"
 *     responses:
 *       200:
 *         description: Feedback fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Feedback fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversationId:
 *                       type: string
 *                       example: "conv-123"
 *                     totalFeedback:
 *                       type: number
 *                       example: 2
 *                     feedback:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatFeedback'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   success: true
 *                   message: "Feedback fetched successfully"
 *                   data:
 *                     conversationId: "conv-123"
 *                     totalFeedback: 2
 *                     feedback:
 *                       - id: "feedback-1234567890-abc123"
 *                         conversationId: "conv-123"
 *                         username: "Agent-1"
 *                         rating: 4
 *                         description: "Great service, very helpful!"
 *                         timestamp: "2025-01-05T10:30:00.000Z"
 *                       - id: "feedback-1234567891-def456"
 *                         conversationId: "conv-123"
 *                         username: "User-1"
 *                         rating: 5
 *                         description: "Excellent support team"
 *                         timestamp: "2025-01-05T11:00:00.000Z"
 *               empty:
 *                 summary: No feedback found
 *                 value:
 *                   success: true
 *                   message: "Feedback fetched successfully"
 *                   data:
 *                     conversationId: "conv-123"
 *                     totalFeedback: 0
 *                     feedback: []
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/feedback/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return ResponseUtil.badRequest(res, 'conversationId is required');
    }

    const feedback = await getFeedbackByConversationId(conversationId);

    const data = {
      conversationId,
      totalFeedback: feedback.length,
      feedback,
    };

    return ResponseUtil.success(res, data, 'Feedback fetched successfully');
  } catch (error) {
    Logger.error('[chat.router] Failed to fetch feedback by conversation ID', error);
    return ResponseUtil.error(res, 'Internal server error while fetching feedback');
  }
});

export default router;


