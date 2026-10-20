module.exports = {
  apps: [
    {
      name: 'bookbrain-api',
      script: './apps/api/dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        MONGODB_URI: 'mongodb://127.0.0.1:27017/bookbrain_erp',
        JWT_SECRET: 'BookBrain_Prod_SuperSecret_JwtKey_2026!',
      },
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
    },
  ],
};
