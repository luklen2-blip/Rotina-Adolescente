import { Router } from 'express';
import { JsonDB } from '../database/jsondb.js';

const router = Router();
const daysDb = new JsonDB('days');
const userDb = new JsonDB('user_profile');

// Inicializa perfil padrão do adolescente caso não exista
function getUserProfile() {
  let profile = userDb.findById('current_user');
  if (!profile) {
    profile = userDb.insert({
      id: 'current_user',
      displayName: 'Território de Maya',
      subtitle: 'No meu ritmo, do meu jeito.',
      avatarId: 'avatar_lofi_01',
      totalCredits: 120,
      createdAt: new Date().toISOString()
    });
  }
  return profile;
}

// Template inicial acolhedor para novos dias
function getDefaultDay(date) {
  return {
    id: `day_${date}`,
    date,
    affectiveCheckIn: {
      morning: {
        energyLevel: 'navegando',
        stateTag: 'Em Transição',
        promptAnswer: 'Começando sem pressa.'
      },
      evening: null
    },
    timelineSlots: [
      {
        id: `slot_${Date.now()}_1`,
        timeRange: { start: '08:00', end: '08:45' },
        customTitle: 'Despertar no compasso + café',
        internalState: 'recarregando',
        isFlexible: true,
        status: 'feito',
        authorCreditsEarned: 10,
        reflectionMicroNote: 'Começo tranquilo.'
      },
      {
        id: `slot_${Date.now()}_2`,
        timeRange: { start: '14:00', end: '15:30' },
        customTitle: 'Encarar o resumo de história',
        internalState: 'exige_energia',
        isFlexible: false,
        status: 'parcial',
        authorCreditsEarned: 5,
        reflectionMicroNote: 'Li 4 páginas e anotei os pontos.'
      },
      {
        id: `slot_${Date.now()}_3`,
        timeRange: { start: '16:00', end: '17:00' },
        customTitle: 'Ócio deliberado: olhar pro teto / música',
        internalState: 'ocio_deliberado',
        isFlexible: true,
        status: 'feito',
        authorCreditsEarned: 10,
        reflectionMicroNote: 'Bateria regenerada com sucesso.'
      },
      {
        id: `slot_${Date.now()}_4`,
        timeRange: { start: '20:00', end: '21:00' },
        customTitle: 'Desenho livre ou gameplay leve',
        internalState: 'foco_leve',
        isFlexible: true,
        status: 'reorganizado_amanha',
        authorCreditsEarned: 0,
        reflectionMicroNote: 'Ficou pra amanhã sem crise.'
      }
    ],
    decompressionPad: {
      microDiary: 'A mente estava agitada com os trabalhos da semana, mas organizar os blocos deu uma clareada.',
      writtenAt: new Date().toISOString(),
      privacyLock: true
    }
  };
}

// GET /api/territory
router.get('/territory', (req, res) => {
  const profile = getUserProfile();
  res.json({ success: true, data: profile });
});

// POST /api/territory
router.post('/territory', (req, res) => {
  const { displayName, subtitle, avatarId } = req.body;
  const profile = getUserProfile();
  const updated = userDb.update('current_user', {
    displayName: displayName || profile.displayName,
    subtitle: subtitle !== undefined ? subtitle : profile.subtitle,
    avatarId: avatarId || profile.avatarId
  });
  res.json({ success: true, data: updated });
});

// GET /api/day/:date
router.get('/day/:date', (req, res) => {
  const { date } = req.params;
  let day = daysDb.findOne(d => d.date === date);
  if (!day) {
    day = daysDb.insert(getDefaultDay(date));
  }
  res.json({ success: true, data: day });
});

// POST /api/day/:date/slots - Adiciona novo bloco
router.post('/day/:date/slots', (req, res) => {
  const { date } = req.params;
  const { customTitle, startTime, endTime, internalState, isFlexible } = req.body;

  let day = daysDb.findOne(d => d.date === date);
  if (!day) {
    day = daysDb.insert(getDefaultDay(date));
  }

  const newSlot = {
    id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timeRange: {
      start: startTime || '10:00',
      end: endTime || '11:00'
    },
    customTitle: customTitle || 'Espaço de tempo aberto',
    internalState: internalState || 'piloto_automatico',
    isFlexible: isFlexible ?? true,
    status: 'pendente', // pendente, feito, parcial, reorganizado_amanha
    authorCreditsEarned: 0,
    reflectionMicroNote: ''
  };

  const updatedSlots = [...day.timelineSlots, newSlot];
  const updatedDay = daysDb.update(day.id, { timelineSlots: updatedSlots });

  res.status(201).json({
    success: true,
    message: 'Novo bloco acolhido na timeline.',
    data: newSlot,
    day: updatedDay
  });
});

// PUT /api/day/:date/slots/:slotId - Edita bloco existente
router.put('/day/:date/slots/:slotId', (req, res) => {
  const { date, slotId } = req.params;
  const { customTitle, startTime, endTime, internalState, isFlexible, reflectionMicroNote } = req.body;

  const day = daysDb.findOne(d => d.date === date);
  if (!day) {
    return res.status(404).json({ success: false, error: 'Dia não encontrado' });
  }

  const slotIndex = day.timelineSlots.findIndex(s => s.id === slotId);
  if (slotIndex === -1) {
    return res.status(404).json({ success: false, error: 'Bloco não encontrado' });
  }

  const currentSlot = day.timelineSlots[slotIndex];
  const updatedSlot = {
    ...currentSlot,
    customTitle: customTitle !== undefined ? customTitle : currentSlot.customTitle,
    timeRange: {
      start: startTime || currentSlot.timeRange.start,
      end: endTime || currentSlot.timeRange.end
    },
    internalState: internalState || currentSlot.internalState,
    isFlexible: isFlexible !== undefined ? isFlexible : currentSlot.isFlexible,
    reflectionMicroNote: reflectionMicroNote !== undefined ? reflectionMicroNote : currentSlot.reflectionMicroNote
  };

  day.timelineSlots[slotIndex] = updatedSlot;
  daysDb.update(day.id, { timelineSlots: day.timelineSlots });

  res.json({ success: true, data: updatedSlot });
});

// PATCH /api/day/:date/slots/:slotId/status - Transição não-punitiva de status
router.patch('/day/:date/slots/:slotId/status', (req, res) => {
  const { date, slotId } = req.params;
  const { status, reflectionMicroNote } = req.body;

  const allowedStatuses = ['feito', 'parcial', 'reorganizado_amanha', 'pendente'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Status inválido. Permitidos apenas: ${allowedStatuses.join(', ')}`
    });
  }

  const day = daysDb.findOne(d => d.date === date);
  if (!day) {
    return res.status(404).json({ success: false, error: 'Dia não encontrado' });
  }

  const slotIndex = day.timelineSlots.findIndex(s => s.id === slotId);
  if (slotIndex === -1) {
    return res.status(404).json({ success: false, error: 'Bloco não encontrado' });
  }

  const currentSlot = day.timelineSlots[slotIndex];
  const previousEarned = currentSlot.authorCreditsEarned || 0;

  let newEarned = 0;
  let feedbackMessage = '';

  if (status === 'feito') {
    newEarned = 10;
    feedbackMessage = currentSlot.internalState === 'ocio_deliberado'
      ? 'Espaço respirado com intenção (+10 créditos de autoria).'
      : 'Bloco vivido e registrado (+10 créditos de autoria).';
  } else if (status === 'parcial') {
    newEarned = 5;
    feedbackMessage = 'Avanço registrado (+5 créditos de autoria). Nenhum esforço volta para o zero.';
  } else if (status === 'reorganizado_amanha') {
    newEarned = 0;
    feedbackMessage = 'Bloco movido com sucesso. Hoje o ritmo pediu outra coisa e tá tudo bem.';
  } else {
    newEarned = 0;
    feedbackMessage = 'Bloco reaberto no seu compasso.';
  }

  // Atualiza créditos do usuário de forma incremental
  const creditDiff = newEarned - previousEarned;
  const user = getUserProfile();
  const updatedCredits = Math.max(0, (user.totalCredits || 0) + creditDiff);
  userDb.update('current_user', { totalCredits: updatedCredits });

  const updatedSlot = {
    ...currentSlot,
    status,
    authorCreditsEarned: newEarned,
    reflectionMicroNote: reflectionMicroNote !== undefined ? reflectionMicroNote : currentSlot.reflectionMicroNote
  };

  day.timelineSlots[slotIndex] = updatedSlot;
  daysDb.update(day.id, { timelineSlots: day.timelineSlots });

  res.json({
    success: true,
    message: feedbackMessage,
    data: updatedSlot,
    creditsTotal: updatedCredits,
    creditDiff
  });
});

// DELETE /api/day/:date/slots/:slotId - Remove bloco
router.delete('/day/:date/slots/:slotId', (req, res) => {
  const { date, slotId } = req.params;
  const day = daysDb.findOne(d => d.date === date);
  if (!day) return res.status(404).json({ success: false, error: 'Dia não encontrado' });

  const filtered = day.timelineSlots.filter(s => s.id !== slotId);
  daysDb.update(day.id, { timelineSlots: filtered });

  res.json({ success: true, message: 'Espaço de tempo liberado.' });
});

// POST /api/day/:date/decompression - Microdiário (1-3 linhas)
router.post('/day/:date/decompression', (req, res) => {
  const { date } = req.params;
  const { microDiary } = req.body;

  let day = daysDb.findOne(d => d.date === date);
  if (!day) day = daysDb.insert(getDefaultDay(date));

  const updatedPad = {
    microDiary: (microDiary || '').slice(0, 500), // limite acolhedor para evitar sobrecarga
    writtenAt: new Date().toISOString(),
    privacyLock: true
  };

  daysDb.update(day.id, { decompressionPad: updatedPad });

  res.json({
    success: true,
    message: 'Pensamento guardado com segurança no seu cofre pessoal.',
    data: updatedPad
  });
});

export default router;
