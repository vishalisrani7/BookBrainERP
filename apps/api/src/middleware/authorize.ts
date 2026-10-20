import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { UserRole } from '@bookbrain/shared';

export function authorize(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: role ${req.user.role} does not have required permissions`,
      });
    }

    next();
  };
}
