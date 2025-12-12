import { Router, Request, Response } from 'express';
import { SocketService } from '../services/socket.service';
import { ResponseUtil } from '../utils/response.util';

const router = Router();

/**
 * @swagger
 * /api/socket/stats:
 *   get:
 *     summary: Get Socket.IO connection statistics
 *     tags: [Socket]
 *     responses:
 *       200:
 *         description: Socket.IO statistics
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
 *                     totalConnections:
 *                       type: number
 *                     activeRooms:
 *                       type: array
 *                       items:
 *                         type: string
 *                     roomCount:
 *                       type: number
 *                     roomDetails:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 */
router.get('/stats', (_req: Request, res: Response) => {
  const roomDetails = SocketService.getRoomDetails();
  const activeRooms = SocketService.getActiveRooms();

  const stats = {
    totalConnections: SocketService.getTotalConnections(),
    activeRooms,
    roomCount: activeRooms.length,
    roomDetails,
    socketIOInitialized: SocketService.getIO() !== null,
    architecture: 'Map-based room management (O(1) lookup)',
  };
  
  ResponseUtil.success(res, stats, 'Socket.IO statistics retrieved successfully');
});

export default router;

