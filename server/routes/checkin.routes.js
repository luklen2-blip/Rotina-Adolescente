import { Router } from 'express';
import { JsonDB } from '../database/jsondb.js';

const router = Router();
const daysDb = new JsonDB('days');

// GET /api/day/:date/checkin
router.get('/day/:date/checkin', (req, res) => {
  const { date } = req.params;
  const day = daysDb.findOne(d => d.date === date);
  if (!day) {
    return res.json({
      success: true,
      data: { morning: null, evening: null }
    });
  }
  res.json({ success: true, data: day.affectiveCheckIn || { morning: null, evening: null } });
});

// POST /api/day/:date/checkin/morning
router.post('/day/:date/checkin/morning', (req, res) => {
  const { date } = req.params;
  const { energyLevel, stateTag, promptAnswer } = req.body;

  let day = daysDb.findOne(d => d.date === date);
  if (!day) {
    day = daysDb.insert({
      id: `day_${date}`,
      date,
      affectiveCheckIn: { morning: null, evening: null },
      timelineSlots: [],
      decompressionPad: { microDiary: '', writtenAt: null, privacyLock: true }
    });
  }

  const morningData = {
    timestamp: new Date().toISOString(),
    energyLevel: energyLevel || 'navegando',
    stateTag: stateTag || 'Presente',
    promptAnswer: promptAnswer || ''
  };

  const currentCheckIn = day.affectiveCheckIn || {};
  const updatedCheckIn = { ...currentCheckIn, morning: morningData };

  daysDb.update(day.id, { affectiveCheckIn: updatedCheckIn });

  let supportiveFeedback = 'Compasso registrado.';
  if (energyLevel === 'bateria_baixa') {
    supportiveFeedback = 'Bateria baixa identificada: vamos calibrar o dia sem forçar a barra.';
  } else if (energyLevel === 'piloto_automatico') {
    supportiveFeedback = 'Modo econômico ativo: priorize o que fluir mais leve hoje.';
  } else if (energyLevel === 'bateria_alta') {
    supportiveFeedback = 'Energia abundante: aproveite para os blocos que exigem mais foco.';
  }

  res.json({
    success: true,
    message: supportiveFeedback,
    data: morningData
  });
});

// POST /api/day/:date/checkin/evening
router.post('/day/:date/checkin/evening', (req, res) => {
  const { date } = req.params;
  const { heaviestFriction, lightestMoment } = req.body;

  let day = daysDb.findOne(d => d.date === date);
  if (!day) {
    return res.status(404).json({ success: false, error: 'Dia não encontrado' });
  }

  const eveningData = {
    timestamp: new Date().toISOString(),
    heaviestFriction: heaviestFriction || '',
    lightestMoment: lightestMoment || ''
  };

  const currentCheckIn = day.affectiveCheckIn || {};
  const updatedCheckIn = { ...currentCheckIn, evening: eveningData };

  daysDb.update(day.id, { affectiveCheckIn: updatedCheckIn });

  res.json({
    success: true,
    message: 'Dia acolhido e encerrado. A cabeça pode descansar agora.',
    data: eveningData
  });
});

export default router;
