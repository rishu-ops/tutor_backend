import { Request, Response, NextFunction } from 'express';
import { prisma } from 'database';

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: Session missing' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roleRef: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, error: 'Forbidden: Account has been deactivated' });
        return;
      }

      // Must be classified under the ADMIN userRole
      if (user.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
        return;
      }

      // Super Admin role overrides all permission checks
      if (user.roleRef?.name === 'Super Admin') {
        return next();
      }

      // Check if permission matches
      const hasPerm = user.roleRef?.permissions.some((p) => p.name === permission);
      if (!hasPerm) {
        res.status(403).json({
          success: false,
          error: `Forbidden: Missing required permission: ${permission}`,
        });
        return;
      }

      return next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ success: false, error: 'Internal server error during authorization' });
    }
  };
};
