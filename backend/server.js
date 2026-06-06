import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import signatureRoutes from './routes/signatureRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import { verifyResendConnection } from './middleware/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust Railway reverse proxy for rate-limiting IP detection

// Railway injects PORT automatically — must not hardcode 5000 in production
const PORT = process.env.PORT || 8080;

// ─── Startup Environment Diagnostics ─────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  SignFlow AI — Backend Starting');
console.log(`  NODE_ENV      : ${process.env.NODE_ENV || 'development'}`);
console.log(`  PORT          : ${PORT}`);
console.log(`  MONGODB_URI   : ${process.env.MONGODB_URI ? '✓ Set' : '✗ MISSING — server will fail to connect!'}`);
console.log(`  JWT_SECRET    : ${process.env.JWT_SECRET ? '✓ Set' : '✗ MISSING — using insecure fallback!'}`);
console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✓ Set' : '✗ MISSING — emails will fail'}`);
console.log(`  FROM_EMAIL    : ${process.env.FROM_EMAIL || '(not set — will use onboarding@resend.dev)'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
  // Production custom domain
  'https://signflow.abhinavsai.com',
  'https://www.signflow.abhinavsai.com',
  // Allow overriding from env (e.g. Railway or Vercel custom domain)
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  // Local development
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow any localhost port (local development)
    if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, origin);
    }

    // Strict regex for Vercel preview deployments (e.g., https://signflow-ai-git-main-username.vercel.app)
    if (/^https:\/\/([a-zA-Z0-9-]+)\.vercel\.app$/.test(origin)) {
      return callback(null, origin);
    }

    // Strict regex for Railway preview deployments
    if (/^https:\/\/([a-zA-Z0-9-]+)\.railway\.app$/.test(origin)) {
      return callback(null, origin);
    }

    // Allow known production origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }

    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const publicSignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many signing attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/docs', generalLimiter, documentRoutes);
app.use('/api/documents', generalLimiter, documentRoutes);
app.use('/api/signatures', generalLimiter, signatureRoutes);
app.use('/api/audit', generalLimiter, auditRoutes);
app.use('/api/workspaces', generalLimiter, workspaceRoutes);
app.use('/api/billing', generalLimiter, billingRoutes);
app.use('/api/admin', generalLimiter, adminRoutes);
app.use('/api/email', generalLimiter, emailRoutes);

// Health check endpoint (used by Railway health checks and uptime monitors)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('SignFlow AI Document Signature API is running');
});

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('  FATAL: MONGODB_URI environment variable is not set.');
  console.error('  Go to Railway Dashboard → Your Service → Variables');
  console.error('  Add: MONGODB_URI = mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

import { startEmailScheduler } from './jobs/emailScheduler.js';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('[+] MongoDB Atlas connected successfully.');
    // Start the hourly email scheduler after DB is ready
    startEmailScheduler();
  })
  .catch(err => {
    console.error('[-] MongoDB connection failed:', err.message);
    console.error('    Ensure MONGODB_URI in Railway Variables points to Atlas, not localhost.');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[+] Server running on port ${PORT}`);
  try {
    await verifyResendConnection();
  } catch (err) {
    console.error('Failed to run Resend startup verification:', err);
  }
});
