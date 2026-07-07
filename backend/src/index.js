import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env.js';
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

const app = express();

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth
app.use('/api/auth', authRouter);

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

// Global error handler (must be last)
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`EduVerify backend → http://localhost:${env.port}`);
});
