import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';
import { dashboardController } from '../controllers/dashboard.controller';
import { ROLES } from '../constants';

const router = Router();

router.use(authMiddleware);

router.get('/overview', dashboardController.overview);
router.get('/upcoming', dashboardController.upcoming);
router.get('/system', requireRoles(ROLES.ADMIN), dashboardController.systemAnalytics);

export default router;
