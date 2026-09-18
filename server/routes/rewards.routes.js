import { Router } from 'express';
import { JsonDB } from '../database/jsondb.js';

const router = Router();
const userDb = new JsonDB('user_profile');
const goalsDb = new JsonDB('reward_goals');

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

// Inicializa catálogo de sugestões de autorrecompensas se vazio
function getGoalsCatalog() {
  let goals = goalsDb.findAll();
  if (goals.length === 0) {
    goals = [
      goalsDb.insert({
        id: 'goal_01',
        title: 'Pedir hambúrguer especial ou sushi na sexta-feira',
        targetCredits: 150,
        negotiatedWith: 'Mãe / Autoacordo',
        category: 'comida',
        active: true,
        claimed: false
      }),
      goalsDb.insert({
        id: 'goal_02',
        title: 'Tarde inteira de videogame/série sem ninguém pedir favores',
        targetCredits: 120,
        negotiatedWith: 'Pais',
        category: 'lazer',
        active: false,
        claimed: false
      }),
      goalsDb.insert({
        id: 'goal_03',
        title: 'Comprar um livro novo ou skin de jogo',
        targetCredits: 250,
        negotiatedWith: 'Autoacordo',
        category: 'compras',
        active: false,
        claimed: false
      }),
      goalsDb.insert({
        id: 'goal_04',
        title: 'Passeio ou cinema no fim de semana com amigos',
        targetCredits: 180,
        negotiatedWith: 'Responsáveis',
        category: 'social',
        active: false,
        claimed: false
      })
    ];
  }
  return goals;
}

// GET /api/rewards
router.get('/', (req, res) => {
  const user = getUserProfile();
  const allGoals = getGoalsCatalog();
  const activeGoal = allGoals.find(g => g.active && !g.claimed) || allGoals[0];

  res.json({
    success: true,
    data: {
      totalCredits: user.totalCredits || 0,
      activeGoal,
      catalog: allGoals
    }
  });
});

// POST /api/rewards/goals - Define ou cria nova meta
router.post('/goals', (req, res) => {
  const { title, targetCredits, negotiatedWith, category } = req.body;

  if (!title || !targetCredits) {
    return res.status(400).json({ success: false, error: 'Título e meta de créditos são obrigatórios' });
  }

  // Desativa metas anteriores
  const allGoals = goalsDb.findAll();
  allGoals.forEach(g => {
    if (g.active) goalsDb.update(g.id, { active: false });
  });

  const newGoal = goalsDb.insert({
    title,
    targetCredits: Number(targetCredits) || 100,
    negotiatedWith: negotiatedWith || 'Autoacordo',
    category: category || 'pessoal',
    active: true,
    claimed: false
  });

  res.status(201).json({
    success: true,
    message: 'Meta de autorrecompensa pactuada com sucesso!',
    data: newGoal
  });
});

// POST /api/rewards/claim - Resgata a recompensa
router.post('/claim', (req, res) => {
  const { goalId } = req.body;
  const user = getUserProfile();
  const goal = goalsDb.findById(goalId);

  if (!goal) {
    return res.status(404).json({ success: false, error: 'Meta não encontrada' });
  }

  if (user.totalCredits < goal.targetCredits) {
    return res.status(400).json({
      success: false,
      error: `Créditos insuficientes (${user.totalCredits}/${goal.targetCredits}). Continue no seu ritmo!`
    });
  }

  // Deduz créditos e marca como resgatada
  const updatedCredits = user.totalCredits - goal.targetCredits;
  userDb.update('current_user', { totalCredits: updatedCredits });
  goalsDb.update(goal.id, { claimed: true, active: false, claimedAt: new Date().toISOString() });

  res.json({
    success: true,
    message: `Parabéns pela autoria do seu tempo! Recompensa "${goal.title}" resgatada com honras.`,
    remainingCredits: updatedCredits
  });
});

export default router;
