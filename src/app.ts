import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middleware/requestLogger';
import { globalErrorHandler, notFoundHandler } from './middleware/error';
import authRoutes from './routes/auth.routes';
import animeRoutes from './routes/anime.routes';
import episodeRoutes from './routes/episode.routes';
import streamRoutes from './routes/stream.routes';
import watchRoutes from './routes/watch.routes';
import historyRoutes from './routes/history.routes';
import favoriteRoutes from './routes/favorite.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SHIINIME API',
      version: '1.0.0',
      description: 'Firebase-authenticated backend for SHIINIME Android app.',
    },
    servers: [{ url: 'http://localhost:4000' }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/episode', episodeRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/watch', watchRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
