import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/environment';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import { authRoutes } from './modules/auth/auth.routes';
import { purchaseRoutes } from './modules/purchases/purchase.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { batchRoutes } from './modules/production/batch.routes';
import { scrapRoutes } from './modules/scrap/scrap.routes';
import { productRoutes } from './modules/products/product.routes';
import { finishedGoodsRoutes } from './modules/finished-goods/fg.routes';
import { wipOutRoutes } from './modules/wip-out/wip-out.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { reportRoutes } from './modules/reports/report.routes';
import { migrationRoutes } from './modules/migration/migration.routes';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: '*', // Allows development and local network production access
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'BookBrain WIP Inventory System',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Mount versioned API routes (/api/v1)
const apiV1 = express.Router();

apiV1.use('/auth', authRoutes);
apiV1.use('/purchases', purchaseRoutes);
apiV1.use('/inventory', inventoryRoutes);
apiV1.use('/production', batchRoutes);
apiV1.use('/scrap', scrapRoutes);
apiV1.use('/products', productRoutes);
apiV1.use('/finished-goods', finishedGoodsRoutes);
apiV1.use('/wip-out', wipOutRoutes);
apiV1.use('/dashboard', dashboardRoutes);
apiV1.use('/reports', reportRoutes);
apiV1.use('/migration', migrationRoutes);

app.use('/api/v1', apiV1);

// Centralized error handler
app.use(errorHandler);

export { app };
