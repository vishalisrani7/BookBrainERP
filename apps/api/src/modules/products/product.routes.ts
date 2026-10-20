import { Router } from 'express';
import { ProductController } from './product.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', ProductController.getProducts);
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN']), ProductController.createProduct);

export const productRoutes = router;
