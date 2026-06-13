import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { logger } from './lib/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { setSocketServer } from './services/notification.service';
import { startScheduler } from './jobs/scheduler';

// Routes
import authRoutes          from './routes/auth.routes';
import appointmentRoutes   from './routes/appointments.routes';
import patientRoutes       from './routes/patients.routes';
import messageRoutes       from './routes/messages.routes';
import aiRoutes            from './routes/ai.routes';
import analyticsRoutes     from './routes/analytics.routes';
import staffRoutes         from './routes/staff.routes';
import billingRoutes       from './routes/billing.routes';
import settingsRoutes      from './routes/settings.routes';
import notificationRoutes  from './routes/notifications.routes';
import superadminRoutes    from './routes/superadmin.routes';
import publicRoutes        from './routes/public.routes';
import patientPortalRoutes from './routes/patient.routes';
import reviewsRoutes       from './routes/reviews.routes';

// Webhooks
import twilioWebhook from './webhooks/twilio.webhook';
import stripeWebhook from './webhooks/stripe.webhook';

const app        = express();
const httpServer = createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setSocketServer(io);

io.on('connection', (socket) => {
  socket.on('join:clinic', (clinicId: string) => {
    socket.join(clinicId);
    logger.debug(`Socket joined clinic room: ${clinicId}`);
  });
  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

// ── Security ──────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.', code: 'RATE_LIMIT' },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Try again in 15 minutes.', code: 'AUTH_RATE_LIMIT' },
});

// ── Stripe webhook MUST receive raw body — register BEFORE express.json() ────
app.use(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── HSTS in production ────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use((_req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'ClinicOS AI',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/appointments',  appointmentRoutes);
app.use('/api/patients',      patientRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/staff',         staffRoutes);
app.use('/api/billing',       billingRoutes);
app.use('/api/settings',      settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/superadmin',    superadminRoutes);
app.use('/api/public',        publicRoutes);
app.use('/api/patient',       patientPortalRoutes);
app.use('/api/reviews',       reviewsRoutes);
app.use('/api/webhooks/twilio', twilioWebhook);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorMiddleware);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);

httpServer.listen(PORT, () => {
  logger.info(`🚀 ClinicOS AI API running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
  if (process.env.NODE_ENV !== 'test') {
    startScheduler();
  }
});

export { app, httpServer, io };
