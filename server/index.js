import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import healthRoutes from './routes/health.routes.js';
import timelineRoutes from './routes/timeline.routes.js';
import checkinRoutes from './routes/checkin.routes.js';
import rewardsRoutes from './routes/rewards.routes.js';
import pixRoutes from './routes/pix.routes.js';
import routineRoutes from './routes/routine.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Middleware de Proteção de Cabeçalhos (OWASP Hardening)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Limitador de requisições simples em memória (Anti-DDoS / Brute Force)
const requestCounts = new Map();
app.use('/api', (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  requestCounts.set(ip, record);

  // Limite generoso para uso normal (1000 requisições por 15 min por IP)
  if (record.count > 1000) {
    return res.status(429).json({
      success: false,
      error: 'Muitas requisições. Por favor, aguarde alguns instantes.'
    });
  }
  next();
});

// Log de requisições simplificado
app.use((req, res, next) => {
  if (!req.path.startsWith('/public') && !req.path.includes('.')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// 1. Resolução Universal e Resiliente de Arquivos Estáticos
const staticCandidatePaths = [
  path.join(process.cwd(), 'public'),
  path.join(__dirname, '..', 'public'),
  process.cwd()
];

staticCandidatePaths.forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use(express.static(dir));
  }
});

// 2. Registro de Rotas da API
app.use('/api', healthRoutes);
app.use('/api/routine', routineRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api', timelineRoutes);
app.use('/api', checkinRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/pix', pixRoutes);

// 3. Fallback SPA Resiliente para navegação client-side
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();

  const candidates = [
    path.join(process.cwd(), 'public', 'index.html'),
    path.join(__dirname, '..', 'public', 'index.html'),
    path.join(process.cwd(), 'index.html')
  ];

  const htmlPath = candidates.find(p => fs.existsSync(p));
  if (htmlPath) {
    return res.sendFile(htmlPath);
  }
  next();
});

// Middleware de tratamento de erro
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Erro interno no servidor do Ritmo',
      details: err.message
    }
  });
});

const isMain = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('server/index.js') ||
  process.argv[1].endsWith('server\\index.js')
);

function startServer(portToTry) {
  const srv = app.listen(portToTry, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Ritmo: Autonomia através da Autoria iniciado!`);
    console.log(`📡 Servidor ativo em: http://localhost:${portToTry}`);
    console.log(`🩺 Health Check: http://localhost:${portToTry}/api/health`);
    console.log(`✨ Premissa: Sem culpa, sem streaks tóxicos, ritmo próprio.`);
    console.log(`====================================================`);
  });

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !process.env.PORT) {
      console.warn(`[Aviso] Porta ${portToTry} ocupada. Tentando porta ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Erro no servidor:', err);
    }
  });
}

if (isMain && process.env.NODE_ENV !== 'test') {
  startServer(Number(PORT));
}

export default app;
