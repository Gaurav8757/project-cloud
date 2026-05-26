import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { userController } from '../controllers/user.controller';
import {
  adminUpdateUserSchema,
  changePasswordSchema,
  updateNotificationPrefsSchema,
  updateProfileSchema,
} from '../validations/user.validation';
import { ROLES } from '../constants';

const router = Router();

router.use(authMiddleware);

router.get('/me', userController.me);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.post('/change-password', validate(changePasswordSchema), userController.changePassword);
router.patch(
  '/notification-preferences',
  validate(updateNotificationPrefsSchema),
  userController.updateNotificationPrefs,
);

// Admin
router.get('/', requireRoles(ROLES.ADMIN), userController.listUsers);
router.patch(
  '/:id',
  requireRoles(ROLES.ADMIN),
  validate(adminUpdateUserSchema),
  userController.adminUpdateUser,
);
router.delete('/:id', requireRoles(ROLES.ADMIN), userController.deleteUser);

export default router;
