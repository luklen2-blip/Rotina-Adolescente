import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: process.env.APP_NAME || 'Ritmo: Autonomia através da Autoria',
    version: '2.0.0',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    core_concept: 'Cada um tem a sua rotina — autonomia através da autoria',
    non_punitive: true
  });
});

export default router;
