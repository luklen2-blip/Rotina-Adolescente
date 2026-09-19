import { Router } from 'express';
import { JsonDB } from '../database/jsondb.js';

const router = Router();

const routineDb = new JsonDB('routine_board');
const profileDb = new JsonDB('routine_profile');
const redemptionsDb = new JsonDB('routine_redemptions');

// Recupera perfil (Conta Real começando do zero ou Demo)
function getProfile(mode = 'real') {
  const profileId = mode === 'demo' ? 'demo_profile' : 'real_user_profile';
  let profile = profileDb.findById(profileId);
  if (!profile) {
    if (mode === 'demo') {
      profile = profileDb.insert({
        id: 'demo_profile',
        name: 'Demonstração',
        title: 'Exemplo de Rotina (Demonstração) (Exemplo)',
        subtitle: 'Pequenas Ações, Grandes Conquistas!',
        isDemo: true,
        values: ['FOCO', 'ORGANIZAÇÃO', 'RESPONSABILIDADE', 'RESPEITO', 'APRENDIZADO', 'ESPORTES', 'AUTONOMIA', 'SONHOS'],
        cumulativePoints: 345,
        updatedAt: new Date().toISOString()
      });
    } else {
      profile = profileDb.insert({
        id: 'real_user_profile',
        name: '',
        title: 'Minha rotina',
        subtitle: 'Cada um tem a sua rotina — autonomia através da autoria.',
        isDemo: false,
        values: ['FOCO', 'ORGANIZAÇÃO', 'AUTONOMIA', 'RITMO'],
        cumulativePoints: 0,
        updatedAt: new Date().toISOString()
      });
    }
  }
  return profile;
}

// Inicializa a grade semanal de tarefas padrão
function getDefaultWeek() {
  return {
    id: 'current_week',
    weekTitle: 'Semana Ativa',
    days: {
      segunda: {
        name: 'Segunda',
        themeColor: '#0284c7',
        tasks: [
          { id: 'seg_1', title: 'Iniciar o dia com calma', points: 1, icon: 'smile', done: false },
          { id: 'seg_2', title: 'Bloco de foco principal', points: 3, icon: 'check-circle-2', done: false },
          { id: 'seg_3', title: 'Pausa restaurativa', points: 1, icon: 'coffee', done: false },
          { id: 'seg_4', title: 'Reforço escolar ou leitura', points: 3, icon: 'book-open', done: false },
          { id: 'seg_5', title: 'Ócio Deliberado: Descanso Consciente', points: 1, icon: 'moon', done: false }
        ]
      },
      terca: {
        name: 'Terça',
        themeColor: '#16a34a',
        tasks: [
          { id: 'ter_1', title: 'Organizar prioridades do dia', points: 1, icon: 'clipboard-list', done: false },
          { id: 'ter_2', title: 'Bloco de estudo ou projeto', points: 3, icon: 'book-open', done: false },
          { id: 'ter_3', title: 'Pausa consciente & hidratação', points: 1, icon: 'coffee', done: false },
          { id: 'ter_4', title: 'Ócio Deliberado & Descanso', points: 1, icon: 'moon', done: false }
        ]
      },
      quarta: {
        name: 'Quarta',
        themeColor: '#eab308',
        tasks: [
          { id: 'qua_1', title: 'Alongamento ou movimento leve', points: 1, icon: 'activity', done: false },
          { id: 'qua_2', title: 'Foco no essencial', points: 3, icon: 'check-circle-2', done: false },
          { id: 'qua_3', title: 'Ócio Deliberado & Descompressão', points: 1, icon: 'moon', done: false }
        ]
      },
      quinta: {
        name: 'Quinta',
        themeColor: '#ec4899',
        tasks: [
          { id: 'qui_1', title: 'Planejamento e metas', points: 1, icon: 'clipboard-list', done: false },
          { id: 'qui_2', title: 'Bloco produtivo no seu ritmo', points: 3, icon: 'check-circle-2', done: false },
          { id: 'qui_3', title: 'Ócio Deliberado', points: 1, icon: 'moon', done: false }
        ]
      },
      sexta: {
        name: 'Sexta',
        themeColor: '#8b5cf6',
        tasks: [
          { id: 'sex_1', title: 'Fechamento da semana com leveza', points: 2, icon: 'check-check', done: false },
          { id: 'sex_2', title: 'Celebrar pequenas conquistas', points: 2, icon: 'award', done: false },
          { id: 'sex_3', title: 'Ócio Deliberado & Lazer', points: 1, icon: 'moon', done: false }
        ]
      },
      sabado: {
        name: 'Sábado',
        themeColor: '#06b6d4',
        tasks: [
          { id: 'sab_1', title: 'Tempo livre protegido', points: 2, icon: 'smile', done: false },
          { id: 'sab_2', title: 'Leitura ou hobby pessoal', points: 2, icon: 'book', done: false }
        ]
      },
      domingo: {
        name: 'Domingo',
        themeColor: '#f97316',
        tasks: [
          { id: 'dom_1', title: 'Descanso e recarregamento', points: 2, icon: 'moon', done: false },
          { id: 'dom_2', title: 'Planejar suavemente a próxima semana', points: 2, icon: 'calendar', done: false }
        ]
      }
    }
  };
}

// Tabela de Conquistas (5 níveis: 5, 10, 20, 30, 50 pts)
const REWARDS_TIERS = [
  {
    tierPoints: 5,
    title: '5 PONTOS',
    color: '#22c55e',
    icon: 'popcorn',
    items: [
      'Escolher o filme da noite',
      'Escolher o jantar',
      'Escolher um jogo em família'
    ]
  },
  {
    tierPoints: 10,
    title: '10 PONTOS',
    color: '#0ea5e9',
    icon: 'trees',
    items: [
      'Passeio no parque',
      'Praia',
      'Piquenique',
      'Andar de bicicleta',
      'Sorvete especial'
    ]
  },
  {
    tierPoints: 20,
    title: '20 PONTOS',
    color: '#a855f7',
    icon: 'film',
    items: [
      'Cinema (com pipoca / meia-entrada / promoção)'
    ]
  },
  {
    tierPoints: 30,
    title: '30 PONTOS',
    color: '#ef4444',
    icon: 'utensils',
    items: [
      'Um lanche ou restaurante (escolhido por você)'
    ]
  },
  {
    tierPoints: 50,
    title: '50 PONTOS',
    color: '#eab308',
    icon: 'car',
    items: [
      'Viagem de 1 dia',
      'Passeio especial em família'
    ]
  }
];

// Regras importantes do quadro
const IMPORTANT_RULES = [
  'Os pontos são conquistados ao realizar as atividades.',
  'Faça o seu melhor no seu próprio ritmo.',
  'Se organize e desenvolva autonomia.',
  'Os pontos são acumulativos e sem expiração para autorrecompensas.',
  'Notas altas nas provas ou superação: +5 pontos de bônus!',
  'Descansar também faz parte de uma rotina saudável (Ócio Deliberado).'
];

// GET /api/routine/week - Retorna o quadro com suporte a mode=real ou mode=demo
router.get('/week', (req, res) => {
  const mode = req.query.mode === 'demo' ? 'demo' : 'real';

  let board = routineDb.findById('current_week');
  if (!board) {
    board = routineDb.insert(getDefaultWeek());
  }

  const profile = getProfile(mode);

  const dailyTotals = {};
  let weeklyTotal = 0;

  Object.keys(board.days).forEach(dayKey => {
    const day = board.days[dayKey];
    const total = day.tasks
      .filter(t => t.done)
      .reduce((acc, t) => acc + (t.points || 0), 0);
    dailyTotals[dayKey] = total;
    weeklyTotal += total;
  });

  res.json({
    success: true,
    data: {
      profile,
      board,
      dailyTotals,
      weeklyTotal,
      cumulativePoints: profile.cumulativePoints,
      rewardsTiers: REWARDS_TIERS,
      rules: IMPORTANT_RULES
    }
  });
});

// POST /api/routine/toggle - Marca ou desmarca tarefa
router.post('/toggle', (req, res) => {
  const { dayKey, taskId, mode = 'real' } = req.body;

  let board = routineDb.findById('current_week');
  if (!board) board = routineDb.insert(getDefaultWeek());

  const day = board.days[dayKey];
  if (!day) {
    return res.status(404).json({ success: false, error: 'Dia inválido' });
  }

  let task = day.tasks.find(t => t.id === taskId);
  if (!task) {
    // Pode ser tarefa adaptada
    task = { id: taskId, title: 'Atividade no ritmo', points: 2, done: false };
    day.tasks.push(task);
  }

  const wasDone = task.done;
  task.done = !wasDone;

  const pointsDiff = task.done ? (task.points || 2) : -(task.points || 2);

  const profile = getProfile(mode);
  const newCumulative = Math.max(0, (profile.cumulativePoints || 0) + pointsDiff);
  profileDb.update(profile.id, { cumulativePoints: newCumulative });

  routineDb.update('current_week', { days: board.days });

  const message = task.done
    ? `Parabéns! "${task.title}" marcada com sucesso (+50 XP / +${task.points || 2} pts)!`
    : `"${task.title}" desmarcada.`;

  res.json({
    success: true,
    message,
    task,
    pointsDiff,
    cumulativePoints: newCumulative
  });
});

// POST /api/routine/bonus - Adiciona bônus manual com segurança
router.post('/bonus', (req, res) => {
  const { points = 5, reason = 'Superação no ritmo', mode = 'real' } = req.body;

  const profile = getProfile(mode);
  const added = Math.min(Math.max(1, Number(points) || 5), 10);
  const cleanReason = String(reason || 'Superação do dia').slice(0, 100);
  const newCumulative = (profile.cumulativePoints || 0) + added;

  profileDb.update(profile.id, { cumulativePoints: newCumulative });

  res.json({
    success: true,
    message: `Incrível! Bônus de +${added} pontos adicionado: ${cleanReason}`,
    cumulativePoints: newCumulative
  });
});

// POST /api/routine/claim - Resgata uma conquista
router.post('/claim', (req, res) => {
  const { tierPoints, rewardName, mode = 'real' } = req.body;

  const profile = getProfile(mode);
  const cost = Number(tierPoints);

  if (profile.cumulativePoints < cost) {
    return res.status(400).json({
      success: false,
      error: `Pontos insuficientes (${profile.cumulativePoints}/${cost}). Continue se esforçando no seu ritmo!`
    });
  }

  const newCumulative = profile.cumulativePoints - cost;
  profileDb.update(profile.id, { cumulativePoints: newCumulative });

  const record = redemptionsDb.insert({
    rewardName,
    cost,
    claimedAt: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Sensacional! Conquista "${rewardName}" resgatada com orgulho!`,
    newBalance: newCumulative,
    redemption: record
  });
});

// GET /api/routine/history - Histórico de conquistas resgatadas
router.get('/history', (req, res) => {
  const history = redemptionsDb.findAll();
  res.json({ success: true, data: history.reverse() });
});

// POST /api/routine/profile - Atualiza nome e título da rotina
router.post('/profile', (req, res) => {
  const { name, title, mode = 'real' } = req.body;
  const profile = getProfile(mode);

  const updated = profileDb.update(profile.id, {
    name: name || profile.name,
    title: title || profile.title
  });

  res.json({ success: true, data: updated });
});

// POST /api/routine/adapt - Adapta a rotina com base no Onboarding (Objetivo + Tempo + Energia)
router.post('/adapt', (req, res) => {
  const { focus, time, energy, tasks, dayKey = 'terca', mode = 'real' } = req.body;

  let board = routineDb.findById('current_week');
  if (!board) board = routineDb.insert(getDefaultWeek());

  if (tasks && Array.isArray(tasks) && tasks.length > 0) {
    if (board.days && board.days[dayKey]) {
      board.days[dayKey].tasks = tasks.map((t, idx) => ({
        id: `${dayKey}_adapt_${idx + 1}`,
        title: String(t.title || 'Atividade adaptada').slice(0, 80),
        points: Number(t.points) || 2,
        icon: t.icon || 'check-circle-2',
        time: t.time || '10:00',
        done: false
      }));
      routineDb.update('current_week', { days: board.days });
    }
  }

  const profile = getProfile(mode);
  profileDb.update(profile.id, {
    lastFocus: focus,
    lastTime: time,
    lastEnergy: energy,
    adaptedAt: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Rotina adaptada com sucesso para ${focus} (Tempo: ${time}, Energia: ${energy})!`,
    tasks: board.days ? board.days[dayKey]?.tasks : []
  });
});

export default router;
