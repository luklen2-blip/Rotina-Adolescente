// routine.js - Lógica do Quadro de Rotina Semanal e Sistema de Conquistas (Rotina do Miguel)

let routineState = {
  profile: null,
  board: null,
  dailyTotals: {},
  weeklyTotal: 0,
  cumulativePoints: 0,
  rewardsTiers: [],
  rules: []
};

// Mapeamento de ícones do Lucide
const ICON_MAP = {
  school: 'graduation-cap',
  smile: 'smile',
  'message-circle': 'message-circle',
  'book-open': 'book-open',
  'edit-3': 'edit-3',
  backpack: 'briefcase',
  book: 'book',
  moon: 'moon',
  activity: 'activity',
  bell: 'bell',
  briefcase: 'package',
  'user-check': 'user-check',
  heart: 'heart',
  popcorn: 'film',
  trees: 'palmtree',
  film: 'clapperboard',
  utensils: 'utensils',
  car: 'car',
  'check-circle': 'check-circle'
};

export async function fetchRoutineBoard() {
  try {
    const res = await fetch('/api/routine/week');
    const json = await res.json();
    if (json.success) {
      routineState = json.data;
      renderRoutineUI();
    }
  } catch (err) {
    console.error('Erro ao carregar quadro de rotina:', err);
  }
}

export function renderRoutineUI() {
  const { profile, board, dailyTotals, weeklyTotal, cumulativePoints, rewardsTiers, rules } = routineState;
  if (!board || !profile) return;

  // 1. Cabeçalho e Título
  const titleEl = document.getElementById('board-title');
  if (titleEl) titleEl.innerText = profile.title || 'Rotina do Miguel';

  const subtitleEl = document.getElementById('board-subtitle');
  if (subtitleEl) subtitleEl.innerText = profile.subtitle || 'Pequenas Ações, Grandes Conquistas!';

  const pointsBadge = document.getElementById('cumulative-points-badge');
  if (pointsBadge) pointsBadge.innerText = `${cumulativePoints} Pontos`;

  const weeklyTotalBadge = document.getElementById('weekly-total-badge');
  if (weeklyTotalBadge) weeklyTotalBadge.innerText = `${weeklyTotal} pts conquistados na semana`;

  // 2. Colunas dos Dias da Semana
  const gridContainer = document.getElementById('week-columns-grid');
  if (gridContainer) {
    const dayKeys = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

    gridContainer.innerHTML = dayKeys.map(dayKey => {
      const day = board.days[dayKey];
      if (!day) return '';
      const totalDay = dailyTotals[dayKey] || 0;

      const tasksHtml = day.tasks.map(task => {
        const iconName = ICON_MAP[task.icon] || 'check-circle';
        return `
          <div class="task-row flex items-start gap-2.5 p-2 rounded-lg transition-all cursor-pointer select-none ${task.done ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200' : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-slate-200'}"
               onclick="window.toggleRoutineTask('${dayKey}', '${task.id}')">
            <!-- Custom Checkbox -->
            <div class="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all ${task.done ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50' : 'border-2 border-slate-600 bg-slate-950'}">
              ${task.done ? '<i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>' : ''}
            </div>

            <!-- Título e Ícone -->
            <div class="flex-1 min-w-0 text-xs leading-tight">
              <span class="${task.done ? 'line-through opacity-75' : 'font-medium'}">${task.title}</span>
            </div>

            <!-- Badge de Pontos -->
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${task.done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">
              +${task.points}
            </span>
          </div>
        `;
      }).join('');

      return `
        <div class="day-column flex flex-col bg-[#131926] border border-[#27354A] rounded-xl overflow-hidden shadow-lg shadow-black/40">
          <!-- Cabeçalho do Dia com Cor Temática -->
          <div class="px-3 py-2.5 flex items-center justify-between text-white font-bold text-xs uppercase tracking-wider" style="background-color: ${day.themeColor};">
            <div class="flex items-center gap-1.5">
              <i data-lucide="calendar" class="w-4 h-4"></i>
              <span>${day.name}</span>
            </div>
            <button onclick="event.stopPropagation(); window.openAddTaskModal('${dayKey}', '${day.name}')" class="p-1 hover:bg-black/20 rounded text-white" title="Adicionar atividade">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Lista de Tarefas do Dia -->
          <div class="p-2.5 space-y-2 flex-1">
            ${tasksHtml}
          </div>

          <!-- Total do Dia Fixo na Base -->
          <div class="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span class="text-slate-400 font-semibold">TOTAL DO DIA:</span>
            <span class="font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
              ${totalDay} pts
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // 3. Regras Importantes
  const rulesList = document.getElementById('board-rules-list');
  if (rulesList && rules) {
    rulesList.innerHTML = rules.map(rule => `
      <li class="flex items-start gap-2 text-xs text-slate-300">
        <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i>
        <span>${rule}</span>
      </li>
    `).join('');
  }

  // 4. Painel de Conquistas (Tabela de Recompensas por Faixa de Pontos)
  const rewardsContainer = document.getElementById('rewards-tiers-container');
  if (rewardsContainer && rewardsTiers) {
    rewardsContainer.innerHTML = rewardsTiers.map(tier => {
      const isAffordable = cumulativePoints >= tier.tierPoints;
      const iconName = ICON_MAP[tier.icon] || 'gift';

      const itemsHtml = tier.items.map(item => `
        <div class="flex items-center justify-between gap-2 p-2 rounded bg-slate-950/60 border border-slate-800/80 text-xs">
          <span class="text-slate-200">${item}</span>
          <button onclick="window.claimRewardTier(${tier.tierPoints}, '${escapeHtml(item)}')" 
                  class="neo-btn text-[10px] py-1 px-2 shrink-0 ${isAffordable ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 hover:scale-105' : 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'}"
                  ${!isAffordable ? 'disabled' : ''}>
            ${isAffordable ? 'Resgatar 🎉' : `${tier.tierPoints} pts`}
          </button>
        </div>
      `).join('');

      return `
        <div class="reward-tier-card neo-box p-3.5 flex flex-col justify-between space-y-3 relative overflow-hidden" style="border-top: 4px solid ${tier.color};">
          <div>
            <!-- Cabeçalho do Nível -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center text-white" style="background-color: ${tier.color};">
                  <i data-lucide="${iconName}" class="w-4 h-4"></i>
                </span>
                <h4 class="font-bold text-sm text-white">${tier.title}</h4>
              </div>
              <span class="font-mono text-xs font-bold px-2 py-0.5 rounded text-white" style="background-color: ${tier.color}33; border: 1px solid ${tier.color};">
                ${tier.tierPoints} pts
              </span>
            </div>

            <!-- Lista de Itens Conquistáveis -->
            <div class="space-y-1.5">
              ${itemsHtml}
            </div>
          </div>

          <!-- Status do Nível -->
          <div class="pt-2 border-t border-slate-800/80 text-[11px] text-center font-mono">
            ${isAffordable 
              ? `<span class="text-emerald-400 font-bold">✓ Conquista Liberada!</span>` 
              : `<span class="text-slate-500">Faltam ${tier.tierPoints - cumulativePoints} pts</span>`}
          </div>
        </div>
      `;
    }).join('');
  }

  if (window.lucide) window.lucide.createIcons();
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Toggle de tarefa com animação e atualização em tempo real
window.toggleRoutineTask = async function(dayKey, taskId) {
  try {
    const res = await fetch('/api/routine/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayKey, taskId })
    });
    const json = await res.json();
    if (json.success) {
      if (window.showToast) {
        window.showToast(json.message, json.pointsDiff > 0 ? 'success' : 'info');
      }
      await fetchRoutineBoard();
    }
  } catch (err) {
    console.error('Erro ao marcar atividade:', err);
  }
};

// Resgate de conquista por pontos
window.claimRewardTier = async function(tierPoints, rewardName) {
  if (!confirm(`Confirmar o resgate de "${rewardName}" por ${tierPoints} pontos?`)) return;

  try {
    const res = await fetch('/api/routine/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierPoints, rewardName })
    });
    const json = await res.json();
    if (json.success) {
      if (window.showToast) {
        window.showToast(json.message, 'success');
      }
      await fetchRoutineBoard();
      await loadRedemptionHistory();
    } else {
      if (window.showToast) window.showToast(json.error, 'error');
    }
  } catch (err) {
    console.error('Erro ao resgatar conquista:', err);
  }
};

// Adicionar Bônus de Prova (+5 pontos)
window.addBonusPoints = async function() {
  const reason = prompt('Qual foi o motivo do bônus? (Ex: Nota 10 em Matemática, Superação na prova, Esforço especial)', 'Nota alta na prova ou evolução escolar');
  if (!reason) return;

  try {
    const res = await fetch('/api/routine/bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: 5, reason })
    });
    const json = await res.json();
    if (json.success) {
      if (window.showToast) window.showToast(json.message, 'success');
      await fetchRoutineBoard();
    }
  } catch (err) {
    console.error('Erro ao adicionar bônus:', err);
  }
};

// Reiniciar semana (limpar checkboxes mantendo o saldo de pontos acumulados)
window.resetRoutineWeek = async function() {
  if (!confirm('Deseja iniciar uma nova folha semanal? Suas tarefas serão desmarcadas para a nova semana, mas todo o seu saldo de pontos acumulados será 100% PRESERVADO!')) return;

  try {
    const res = await fetch('/api/routine/reset-week', { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      if (window.showToast) window.showToast(json.message, 'success');
      await fetchRoutineBoard();
    }
  } catch (err) {
    console.error('Erro ao reiniciar semana:', err);
  }
};

// Modal de Adicionar Atividade
let targetDayKey = null;
window.openAddTaskModal = function(dayKey, dayName) {
  targetDayKey = dayKey;
  const label = document.getElementById('add-task-day-label');
  if (label) label.innerText = dayName;
  const modal = document.getElementById('modal-add-routine-task');
  if (modal) modal.classList.remove('hidden');
};

export async function submitNewRoutineTask(title, points) {
  if (!targetDayKey || !title) return;
  try {
    const res = await fetch('/api/routine/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayKey: targetDayKey,
        title,
        points: Number(points) || 1
      })
    });
    const json = await res.json();
    if (json.success) {
      if (window.showToast) window.showToast(json.message, 'success');
      await fetchRoutineBoard();
      document.getElementById('modal-add-routine-task').classList.add('hidden');
    }
  } catch (err) {
    console.error('Erro ao adicionar tarefa:', err);
  }
}

// Histórico de Conquistas Resgatadas
export async function loadRedemptionHistory() {
  try {
    const res = await fetch('/api/routine/history');
    const json = await res.json();
    if (json.success) {
      const listEl = document.getElementById('routine-history-list');
      if (!listEl) return;

      if (json.data.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-slate-500">Nenhuma conquista resgatada ainda. Continue pontuando!</p>';
        return;
      }

      listEl.innerHTML = json.data.map(item => `
        <div class="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <p class="font-bold text-slate-200">${item.rewardName}</p>
            <p class="text-[10px] text-slate-500">${new Date(item.claimedAt).toLocaleDateString('pt-BR')} às ${new Date(item.claimedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <span class="font-mono font-bold text-amber-300">-${item.cost} pts</span>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
  }
}
