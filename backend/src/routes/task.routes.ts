import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { taskController } from '../controllers/task.controller';
import {
  checklistItemSchema,
  commentSchema,
  createTaskSchema,
  listTasksQuerySchema,
  moveTaskSchema,
  updateTaskSchema,
} from '../validations/task.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(listTasksQuerySchema, 'query'), taskController.list);
router.post('/', validate(createTaskSchema), taskController.create);
router.get('/board/:projectId', taskController.board);

router.get('/:id', taskController.get);
router.patch('/:id', validate(updateTaskSchema), taskController.update);
router.patch('/:id/move', validate(moveTaskSchema), taskController.move);
router.delete('/:id', taskController.remove);

// Comments
router.post('/:id/comments', validate(commentSchema), taskController.comment);
router.delete('/:id/comments/:commentId', taskController.deleteComment);

// Checklist
router.post('/:id/checklist', validate(checklistItemSchema), taskController.addChecklistItem);
router.patch('/:id/checklist/:itemId', taskController.toggleChecklistItem);
router.delete('/:id/checklist/:itemId', taskController.deleteChecklistItem);

export default router;
