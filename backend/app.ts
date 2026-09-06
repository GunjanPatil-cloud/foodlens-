import express from 'express';
import cors from 'cors';
import apiRouter from './routes/apiRoutes.js';

export function createExpressApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Router mounted at /api
  app.use('/api', apiRouter);

  return app;
}
