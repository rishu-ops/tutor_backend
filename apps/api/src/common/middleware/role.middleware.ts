import { Request, Response, NextFunction } from 'express';
import { prisma } from 'database';

export const requireRole = (allowedRole: 'STUDENT' | 'TUTOR') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(401).json({ success: false, error: 'User not found' });
        return;
      }

      if (user.role !== allowedRole) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You do not have the required permissions to access this resource',
        });
        return;
      }

      next();
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
};
