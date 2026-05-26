import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { projectController } from '../controllers/project.controller';
import {
  addMemberSchema,
  createProjectSchema,
  updateProjectSchema,
} from '../validations/project.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', projectController.list);
router.post('/', validate(createProjectSchema), projectController.create);
router.get('/:id', projectController.get);
router.patch('/:id', validate(updateProjectSchema), projectController.update);
router.delete('/:id', projectController.remove);

router.get('/:id/analytics', projectController.analytics);
router.post('/:id/members', validate(addMemberSchema), projectController.addMember);
router.delete('/:id/members/:userId', projectController.removeMember);

export default router;
