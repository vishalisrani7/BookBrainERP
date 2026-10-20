import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookbrain_erp',
  jwtSecret: process.env.JWT_SECRET || 'bookbrain_jwt_secret_dev_2026',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminInit: {
    username: process.env.ADMIN_INIT_USERNAME || 'admin',
    password: process.env.ADMIN_INIT_PASSWORD || '123',
    email: process.env.ADMIN_INIT_EMAIL || 'admin@bookbrain.com',
    fullName: process.env.ADMIN_INIT_NAME || 'System Administrator',
  },
};
