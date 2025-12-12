import { Router } from 'express';
import userRouter from './user.router';
import socketRouter from './socket.router';
import socketRoomsRouter from './socketRooms.router';
import chatRouter from './chat.router';

const router = Router();

router.use('/users', userRouter);
router.use('/socket', socketRouter);
router.use('/socket/rooms', socketRoomsRouter);
router.use('/chat', chatRouter);

export default router;

