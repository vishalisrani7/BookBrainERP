import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/authenticate';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { usernameOrEmail, password } = req.body;
      const result = await AuthService.login(usernameOrEmail, password);
      return res.json({ success: true, data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return res.status(401).json({ success: false, error: msg });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    return res.json({
      success: true,
      data: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.fullName,
        role: req.user.role,
      },
    });
  }

  static async logout(_req: Request, res: Response) {
    return res.json({ success: true, message: 'Logged out successfully' });
  }
}
