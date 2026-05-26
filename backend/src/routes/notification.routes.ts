import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', notificationController.list);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.remove);

export default router;
