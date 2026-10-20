import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validate';
import { LoginSchema } from '@bookbrain/shared';

const router = Router();

router.post('/login', validateBody(LoginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

export const authRoutes = router;
