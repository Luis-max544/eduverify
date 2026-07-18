import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { ensureBucket } from './config/minio.js';
import { checkDbConnection } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import videosRouter from './routes/videos.js';
import commentsRouter from './routes/comments.js';
import favoritesRouter from './routes/favorites.js';
import historyRouter from './routes/history.js';
import playlistsRouter from './routes/playlists.js';
import profesorPlaylistsRouter from './routes/profesorPlaylists.js';
import subscriptionsRouter from './routes/subscriptions.js';
import notificationsRouter from './routes/notifications.js';
import premiumRouter from './routes/premium.js';
import cursosRouter from './routes/cursos.js';
import aiRouter from './routes/ai.js';
import channelSubsRouter from './routes/channelSubs.js';
import coursePurchasesRouter from './routes/coursePurchases.js';
import couponsRouter from './routes/coupons.js';
import earningsRouter from './routes/earnings.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const globalLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });

// Skip json parser for video streaming upload route
const jsonParser = express.json();
app.use((req, res, next) => {
  if (req.path.match(/^\/api\/videos\/\d+\/upload$/)) return next();
  jsonParser(req, res, next);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(globalLimiter);

// Auth
app.use('/api/auth', authLimiter, authRouter);

// Users — includes /me and /:id/profile and /:id/videos
app.use('/api/users', usersRouter);

// Videos
app.use('/api/videos', videosRouter);

// Comments: videoId flows via mergeParams on commentsRouter
app.use('/api/videos/:videoId/comments', commentsRouter);
app.use('/api/comments', commentsRouter);

// Social
app.use('/api/favorites', favoritesRouter);
app.use('/api/history', historyRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/profesor/playlists', profesorPlaylistsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/premium', premiumRouter);
app.use('/api/cursos', cursosRouter);
app.use('/api/ai', aiRouter);
app.use('/api/channel-subs', channelSubsRouter);
app.use('/api', coursePurchasesRouter);
app.use('/api', couponsRouter);
app.use('/api/profesor/earnings', earningsRouter);

// Global error handler (must be last)
app.use(errorHandler);

Promise.all([checkDbConnection(), ensureBucket()]).then(() => {
  app.listen(env.port, () => {
    console.log(`EduVerify backend → http://localhost:${env.port}`);
  });
}).catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
