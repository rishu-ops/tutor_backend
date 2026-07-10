import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requirePermission } from '../../common/middleware/permission.middleware.js';
import { adminRateLimiter } from '../../common/middleware/admin-rate-limiter.middleware.js';

const controller = new AdminController();

// 1. Auth Router (/api/admin)
const adminAuthRouter = Router();
adminAuthRouter.post('/login', adminRateLimiter(5, 60), controller.login.bind(controller));
adminAuthRouter.post('/logout', controller.logout.bind(controller));
adminAuthRouter.post('/refresh', controller.refresh.bind(controller));

// 2. Admins Router (/api/admins)
const adminsRouter = Router();
adminsRouter.use(requireAuth);
adminsRouter.get('/', requirePermission('admin.create'), controller.getAdmins.bind(controller));
adminsRouter.post('/', requirePermission('admin.create'), controller.createAdmin.bind(controller));
adminsRouter.patch(
  '/:id',
  requirePermission('admin.edit'),
  controller.updateAdmin.bind(controller)
);
adminsRouter.delete(
  '/:id',
  requirePermission('admin.delete'),
  controller.deleteAdmin.bind(controller)
);

// 3. Roles Router (/api/roles)
const rolesRouter = Router();
rolesRouter.use(requireAuth);
rolesRouter.get('/', requirePermission('admin.permissions'), controller.getRoles.bind(controller));
rolesRouter.post(
  '/',
  requirePermission('admin.permissions'),
  controller.createRole.bind(controller)
);
rolesRouter.patch(
  '/:id',
  requirePermission('admin.permissions'),
  controller.updateRole.bind(controller)
);

// 4. Permissions Router (/api/permissions)
const permissionsRouter = Router();
permissionsRouter.use(requireAuth);
permissionsRouter.get(
  '/',
  requirePermission('admin.permissions'),
  controller.getPermissions.bind(controller)
);
permissionsRouter.get(
  '/roles/:id',
  requirePermission('admin.permissions'),
  controller.getRolePermissions.bind(controller)
);
permissionsRouter.patch(
  '/roles/:id',
  requirePermission('admin.permissions'),
  controller.updateRolePermissions.bind(controller)
);

// 5. Users Router (/api/users)
const usersRouter = Router();
usersRouter.use(requireAuth);
usersRouter.get('/', requirePermission('user.view'), controller.getUsers.bind(controller));
usersRouter.get('/:id', requirePermission('user.view'), controller.getUserDetail.bind(controller));
usersRouter.patch(
  '/:id',
  requirePermission('user.suspend'),
  controller.updateUserStatus.bind(controller)
);
usersRouter.delete(
  '/:id',
  requirePermission('user.delete'),
  controller.deleteUser.bind(controller)
);

// 6. Verifications Router (/api/verifications)
const verificationsRouter = Router();
verificationsRouter.use(requireAuth);
verificationsRouter.get(
  '/',
  requirePermission('verification.view'),
  controller.getPendingVerifications.bind(controller)
);
verificationsRouter.patch(
  '/:id/approve',
  requirePermission('verification.approve'),
  controller.approveVerification.bind(controller)
);
verificationsRouter.patch(
  '/:id/reject',
  requirePermission('verification.reject'),
  controller.rejectVerification.bind(controller)
);

// 7. Reports Router (/api/reports)
const reportsRouter = Router();
// public endpoint to create a report
reportsRouter.post('/', requireAuth, controller.createReport.bind(controller));
// admin endpoint to resolve/view
reportsRouter.get(
  '/',
  requireAuth,
  requirePermission('report.view'),
  controller.getReports.bind(controller)
);
reportsRouter.patch(
  '/:id/resolve',
  requireAuth,
  requirePermission('report.resolve'),
  controller.resolveReport.bind(controller)
);

// 8. Admin Posts Router (/api/admin/posts)
const adminPostsRouter = Router();
adminPostsRouter.use(requireAuth);
adminPostsRouter.get('/public', controller.getPublicPosts.bind(controller));
adminPostsRouter.get(
  '/',
  requirePermission('content.create'),
  controller.getPosts.bind(controller)
);
adminPostsRouter.post(
  '/',
  requirePermission('content.create'),
  controller.createPost.bind(controller)
);
adminPostsRouter.patch(
  '/:id',
  requirePermission('content.edit'),
  controller.updatePost.bind(controller)
);
adminPostsRouter.delete(
  '/:id',
  requirePermission('content.delete'),
  controller.deletePost.bind(controller)
);

// 9. Analytics Router (/api/analytics)
const analyticsRouter = Router();
analyticsRouter.get(
  '/overview',
  requireAuth,
  requirePermission('analytics.view'),
  controller.getOverview.bind(controller)
);

// 10. Audit Logs Router (/api/audit-logs)
const auditLogsRouter = Router();
auditLogsRouter.get(
  '/',
  requireAuth,
  requirePermission('audit.view'),
  controller.getAuditLogs.bind(controller)
);

export {
  adminAuthRouter,
  adminsRouter,
  rolesRouter,
  permissionsRouter,
  usersRouter,
  verificationsRouter,
  reportsRouter,
  adminPostsRouter,
  analyticsRouter,
  auditLogsRouter,
};
