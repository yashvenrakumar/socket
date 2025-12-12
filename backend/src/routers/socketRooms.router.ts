import { Router, Request, Response } from 'express';
import { SocketService } from '../services/socket.service';
import { ResponseUtil } from '../utils/response.util';

const router = Router();

/**
 * @swagger
 * /api/socket/rooms:
 *   get:
 *     summary: Get all active Socket.IO rooms with connection counts
 *     tags: [Socket]
 *     responses:
 *       200:
 *         description: List of active rooms
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
 *                     rooms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           conversationId:
 *                             type: string
 *                           roomSize:
 *                             type: number
 *                     totalConnections:
 *                       type: number
 *                     roomCount:
 *                       type: number
 */
router.get('/', (_req: Request, res: Response) => {
  const roomDetails = SocketService.getRoomDetails();
  const activeRooms = SocketService.getActiveRooms();

  const rooms = activeRooms.map((conversationId) => ({
    conversationId,
    roomSize: roomDetails[conversationId] ?? 0,
  }));

  const payload = {
    rooms,
    totalConnections: SocketService.getTotalConnections(),
    roomCount: activeRooms.length,
  };

  return ResponseUtil.success(res, payload, 'Active Socket.IO rooms retrieved successfully');
});

export default router;


