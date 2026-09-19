import { Router } from 'express';
import { JsonDB } from '../database/jsondb.js';

const router = Router();

const routineDb = new JsonDB('routine_board');
const profileDb = new JsonDB('routine_profile');
const redemptionsDb = new JsonDB('routine_redemptions');

// Perfil padrão baseado na foto
function getProfile() {
  let profile = profileDb.findById('miguel_profile');
  if (!profile) {
    profile = profileDb.insert({
      id: 'miguel_profile',
      name: 'Miguel',
      title: 'Rotina do Miguel',
      subtitle: 'Pequenas Ações, Grandes Conquistas!',
      slogans: [
        'Disciplina hoje, liberdade amanhã!',
        'Você consegue! Você se esforça! Você evolui! Você é capaz!',
        'Esforço hoje, resultados sempre!'
      ],
      values: ['FOCO', 'ORGANIZAÇÃO', 'RESPONSABILIDADE', 'RESPEITO', 'APRENDIZADO', 'ESPORTES', 'AUTONOMIA', 'SONHOS'],
      cumulativePoints: 45,
      updatedAt: new Date().toISOString()
    });
  }
  return profile;
}

// Inicializa a grade semanal de tarefas exatamente como no quadro
function getDefaultWeek() {
  return {
    id: 'current_week',
    weekTitle: 'Semana Ativa',
    days: {
      segunda: {
        name: 'Segunda',
        themeColor: '#0284c7', // azul
        tasks: [
          { id: 'seg_1', title: 'Ir para a escola', points: 1, icon: 'school', done: true },
          { id: 'seg_2', title: 'Dia na escola sem reclamações', points: 3, icon: 'smile', done: true },
          { id: 'seg_3', title: 'Fono (ao voltar da escola)', points: 1, icon: 'message-circle', done: true },
          { id: 'seg_4', title: 'Reforço escolar', points: 3, icon: 'book-open', done: false },
          { id: 'seg_5', title: 'Fazer a atividade do Kumon', points: 3, icon: 'edit-3', done: false },
          { id: 'seg_6', title: 'Arrumar a mochila para o dia seguinte', points: 1, icon: 'backpack', done: false },
          { id: 'seg_7', title: '30 min de leitura', points: 3, icon: 'book', done: false },
          { id: 'seg_8', title: '21h: hora de dormir', points: 1, icon: 'moon', done: false }
        ]
      },
      terca: {
        name: 'Terça',
        themeColor: '#16a34a', // verde
        tasks: [
          { id: 'ter_1', title: 'Ir para a escola', points: 1, icon: 'school', done: false },
          { id: 'ter_2', title: 'Dia na escola sem reclamações', points: 3, icon: 'smile', done: false },
          { id: 'ter_3', title: 'Ir ao Kumon (ao voltar da escola)', points: 3, icon: 'edit-3', done: false },
          { id: 'ter_4', title: 'Psicopedagoga Tia Alyne', points: 1, icon: 'user-check', done: false },
          { id: 'ter_5', title: 'Psicólogo Tio Luan', points: 1, icon: 'heart', done: false },
          { id: 'ter_6', title: 'Reforço escolar (Tiana)', points: 3, icon: 'book-open', done: false },
          { id: 'ter_7', title: 'Arrumar a mochila para o dia seguinte', points: 1, icon: 'backpack', done: false },
          { id: 'ter_8', title: '30 min de leitura', points: 3, icon: 'book', done: false },
          { id: 'ter_9', title: '21h: hora de dormir', points: 1, icon: 'moon', done: false }
        ]
      },
      quarta: {
        name: 'Quarta',
        themeColor: '#eab308', // amarelo
        tasks: [
          { id: 'qua_1', title: 'Ir para a escola', points: 1, icon: 'school', done: false },
          { id: 'qua_2', title: 'Dia na escola sem reclamações', points: 3, icon: 'smile', done: false },
          { id: 'qua_3', title: 'Centro Esportivo (futebol + judô)', points: 1, icon: 'activity', done: false },
          { id: 'qua_4', title: 'Lembrar do uniforme do judô!', points: 1, icon: 'bell', done: false },
          { id: 'qua_5', title: 'Reforço escolar', points: 3, icon: 'book-open', done: false },
          { id: 'qua_6', title: 'Fazer a atividade do Kumon', points: 3, icon: 'edit-3', done: false },
          { id: 'qua_7', title: 'Arrumar a mochila para o dia seguinte', points: 1, icon: 'backpack', done: false },
          { id: 'qua_8', title: '30 min de leitura', points: 3, icon: 'book', done: false },
          { id: 'qua_9', title: '21h: hora de dormir', points: 1, icon: 'moon', done: false }
        ]
      },
      quinta: {
        name: 'Quinta',
        themeColor: '#ec4899', // rosa
        tasks: [
          { id: 'qui_1', title: 'Ir para a escola', points: 1, icon: 'school', done: false },
          { id: 'qui_2', title: 'Dia na escola sem reclamações', points: 3, icon: 'smile', done: false },
          { id: 'qui_3', title: 'Ir ao Kumon (ao voltar da escola)', points: 3, icon: 'edit-3', done: false },
          { id: 'qui_4', title: 'Reforço escolar', points: 3, icon: 'book-open', done: false },
          { id: 'qui_5', title: 'Arrumar a mochila para o dia seguinte', points: 1, icon: 'backpack', done: false },
          { id: 'qui_6', title: '30 min de leitura', points: 3, icon: 'book', done: false },
          { id: 'qui_7', title: '21h: hora de dormir', points: 1, icon: 'moon', done: false }
        ]
      },
      sexta: {
        name: 'Sexta',
        themeColor: '#8b5cf6', // roxo
        tasks: [
          { id: 'sex_1', title: 'Ir para a escola', points: 1, icon: 'school', done: false },
          { id: 'sex_2', title: 'Dia na escola sem reclamações', points: 3, icon: 'smile', done: false },
          { id: 'sex_3', title: 'Preparar a bolsa do Centro Esportivo', points: 1, icon: 'briefcase', done: false },
          { id: 'sex_4', title: 'Centro Esportivo (futebol + judô)', points: 1, icon: 'activity', done: false },
          { id: 'sex_5', title: 'Reforço escolar', points: 3, icon: 'book-open', done: false },
          { id: 'sex_6', title: 'Fazer a atividade do Kumon', points: 3, icon: 'edit-3', done: false },
          { id: 'sex_7', title: '30 min de leitura', points: 3, icon: 'book', done: false },
          { id: 'sex_8', title: '21h: hora de dormir', points: 1, icon: 'moon', done: false }
        ]
      },
      sabado: {
        name: 'Sábado',
        themeColor: '#06b6d4', // ciano
        tasks: [
          { id: 'sab_1', title: 'Fazer a atividade do Kumon', points: 3, icon: 'edit-3', done: false },
          { id: 'sab_2', title: '30 min de leitura', points: 3, icon: 'book', done: false }
        ]
      },
      domingo: {
        name: 'Domingo',
        themeColor: '#f97316', // laranja
        tasks: [
          { id: 'dom_1', title: 'Fazer a atividade do Kumon', points: 3, icon: 'edit-3', done: false },
          { id: 'dom_2', title: '30 min de leitura', points: 3, icon: 'book', done: false }
        ]
      }
    }
  };
}

// Tabela de Conquistas fiel à foto
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
  'Faça o seu melhor!',
  'Se organize e seja responsável.',
  'Os pontos são acumulativos. Você pode usar agora ou guardar para uma conquista maior!',
  'Notas altas nas provas ou melhora na nota: +5 pontos de bônus!',
  'O mais importante é o seu esforço e evolução contínua!'
];

// GET /api/routine/week - Retorna o quadro completo com soma de pontos
router.get('/week', (req, res) => {
  let board = routineDb.findById('current_week');
  if (!board) {
    board = routineDb.insert(getDefaultWeek());
  }

  const profile = getProfile();

  // Calcula total por dia
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
  const { dayKey, taskId } = req.body;

  let board = routineDb.findById('current_week');
  if (!board) board = routineDb.insert(getDefaultWeek());

  const day = board.days[dayKey];
  if (!day) {
    return res.status(404).json({ success: false, error: 'Dia inválido' });
  }

  const task = day.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
  }

  // Inverte status
  const wasDone = task.done;
  task.done = !wasDone;

  const pointsDiff = task.done ? task.points : -task.points;

  // Atualiza perfil com os pontos acumulados
  const profile = getProfile();
  const newCumulative = Math.max(0, (profile.cumulativePoints || 0) + pointsDiff);
  profileDb.update('miguel_profile', { cumulativePoints: newCumulative });

  routineDb.update('current_week', { days: board.days });

  const message = task.done
    ? `Parabéns! "${task.title}" marcada com sucesso (+${task.points} pts)!`
    : `"${task.title}" desmarcada (-${task.points} pts).`;

  res.json({
    success: true,
    message,
    task,
    pointsDiff,
    cumulativePoints: newCumulative
  });
});

// POST /api/routine/bonus - Adiciona bônus manual (+5 notas, esforço especial com trava de segurança)
router.post('/bonus', (req, res) => {
  const { points = 5, reason = 'Nota alta na prova ou superação escolar' } = req.body;

  const profile = getProfile();
  const added = Math.min(Math.max(1, Number(points) || 5), 10);
  const cleanReason = String(reason || 'Superação do dia').slice(0, 100);
  const newCumulative = (profile.cumulativePoints || 0) + added;

  profileDb.update('miguel_profile', { cumulativePoints: newCumulative });

  res.json({
    success: true,
    message: `Incrível! Bônus de +${added} pontos adicionado: ${cleanReason}`,
    cumulativePoints: newCumulative
  });
});

// POST /api/routine/claim - Resgata uma conquista
router.post('/claim', (req, res) => {
  const { tierPoints, rewardName } = req.body;

  const profile = getProfile();
  const cost = Number(tierPoints);

  if (profile.cumulativePoints < cost) {
    return res.status(400).json({
      success: false,
      error: `Pontos insuficientes (${profile.cumulativePoints}/${cost}). Continue se esforçando no seu ritmo!`
    });
  }

  const newCumulative = profile.cumulativePoints - cost;
  profileDb.update('miguel_profile', { cumulativePoints: newCumulative });

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

// POST /api/routine/reset-week - Inicia uma nova folha semanal preservando o saldo
router.post('/reset-week', (req, res) => {
  let board = routineDb.findById('current_week');
  if (!board) board = getDefaultWeek();

  Object.keys(board.days).forEach(dayKey => {
    board.days[dayKey].tasks.forEach(task => {
      task.done = false;
    });
  });

  routineDb.update('current_week', { days: board.days });
  const profile = getProfile();

  res.json({
    success: true,
    message: 'Nova folha semanal iniciada! Seu saldo de pontos acumulados foi 100% preservado.',
    cumulativePoints: profile.cumulativePoints
  });
});

// POST /api/routine/task - Adiciona tarefa personalizada em um dia
router.post('/task', (req, res) => {
  const { dayKey, title, points = 1, icon = 'check-circle' } = req.body;

  let board = routineDb.findById('current_week');
  if (!board) board = routineDb.insert(getDefaultWeek());

  const day = board.days[dayKey];
  if (!day) return res.status(404).json({ success: false, error: 'Dia não encontrado' });

  const newTask = {
    id: `${dayKey}_${Date.now()}`,
    title: title || 'Nova atividade',
    points: Number(points) || 1,
    icon: icon || 'check-circle',
    done: false
  };

  day.tasks.push(newTask);
  routineDb.update('current_week', { days: board.days });

  res.status(201).json({
    success: true,
    message: 'Nova atividade adicionada à rotina!',
    data: newTask
  });
});

// POST /api/routine/profile - Atualiza nome e título da rotina
router.post('/profile', (req, res) => {
  const { name, title, subtitle } = req.body;
  const profile = getProfile();

  const updated = profileDb.update('miguel_profile', {
    name: name || profile.name,
    title: title || profile.title,
    subtitle: subtitle || profile.subtitle
  });

  res.json({ success: true, data: updated });
});

// POST /api/routine/adapt - Adapta a rotina funcionalmente com base no Onboarding (Objetivo + Tempo + Energia)
router.post('/adapt', (req, res) => {
  const { focus, time, energy, tasks, dayKey = 'segunda' } = req.body;

  let board = routineDb.findById('current_week');
  if (!board) board = routineDb.insert(getDefaultWeek());

  if (tasks && Array.isArray(tasks) && tasks.length > 0) {
    if (board.days && board.days[dayKey]) {
      board.days[dayKey].tasks = tasks.map((t, idx) => ({
        id: `${dayKey}_adapt_${idx + 1}`,
        title: String(t.title || 'Atividade adaptada').slice(0, 80),
        points: Number(t.points) || 2,
        icon: t.icon || 'check-circle-2',
        done: false
      }));
      routineDb.update('current_week', { days: board.days });
    }
  }

  // Atualiza perfil com preferências
  profileDb.update('miguel_profile', {
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
