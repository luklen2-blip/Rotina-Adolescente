// tablet_ui.js - Controlador da Interface Clean Tech Dark Mode (Rotina do Miguel)

let currentRoutineData = null;
let activeDayKey = 'terca'; // Terça ativa por padrão como no mockup
let activeMood = 'foco_total';
let activeReflection = 'Dia Fluido';

const MILESTONES = [
  { points: 100, label: 'Popcorn', icon: 'popcorn', emoji: '🍿' },
  { points: 250, label: 'Cinema', icon: 'film', emoji: '🎬' },
  { points: 500, label: 'Jantar', icon: 'utensils', emoji: '🍔' },
  { points: 1000, label: 'Viagem', icon: 'car', emoji: '🚗' }
];

export async function initCleanTechUI() {
  await fetchCleanTechData();
  setupEventListeners();
}

async function fetchCleanTechData() {
  try {
    const res = await fetch('/api/routine/week');
    const json = await res.json();
    if (json.success) {
      currentRoutineData = json.data;
      updateUI();
    }
  } catch (err) {
    console.error('Erro ao carregar dados Clean Tech:', err);
  }
}

function updateUI() {
  if (!currentRoutineData) return;

  const { profile, board } = currentRoutineData;
  const points = profile.cumulativePoints || 345;
  const xpLevel = Math.max(1, Math.floor(points / 30));

  // 1. Cabeçalho Superior
  const titleEl = document.getElementById('user-header-title');
  if (titleEl) titleEl.innerText = (profile.title || 'ROTINA DO MIGUEL').toUpperCase();

  const xpEl = document.getElementById('xp-level-display');
  if (xpEl) xpEl.innerText = `NÍVEL DE XP: ${xpLevel}`;

  const pointsEl = document.getElementById('saldo-points-display');
  if (pointsEl) pointsEl.innerText = `SALDO: ${points} PONTOS`;

  // 2. Timeline do Dia Ativo
  renderDayCarousel();
  renderTimelineSlots(activeDayKey);

  // 3. Barra de Conquistas e Marcos (Milestones)
  renderMilestonesBar(points);

  // 4. Humor e Reflexão
  updateMoodUI();
  updateReflectionUI();

  if (window.lucide) window.lucide.createIcons();
}

// Renderiza Carrossel de Dias (SEG, TER, QUA...)
function renderDayCarousel() {
  const container = document.getElementById('day-carousel');
  if (!container) return;

  const days = [
    { key: 'segunda', label: 'SEG' },
    { key: 'terca', label: 'TER' },
    { key: 'quarta', label: 'QUA' },
    { key: 'quinta', label: 'QUI' },
    { key: 'sexta', label: 'SEX' },
    { key: 'sabado', label: 'SÁB' },
    { key: 'domingo', label: 'DOM' }
  ];

  container.innerHTML = days.map(d => `
    <button class="day-pill ${d.key === activeDayKey ? 'active' : ''}" 
            onclick="window.selectDay('${d.key}')">
      ${d.label}
    </button>
  `).join('');
}

window.selectDay = function(dayKey) {
  activeDayKey = dayKey;
  renderDayCarousel();
  renderTimelineSlots(dayKey);
  if (window.lucide) window.lucide.createIcons();
};

// Renderiza os Cards Modulares da Timeline
function renderTimelineSlots(dayKey) {
  const container = document.getElementById('timeline-slots-container');
  if (!container || !currentRoutineData) return;

  const day = currentRoutineData.board.days[dayKey];
  if (!day || !day.tasks || day.tasks.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-500 text-xs">
        Nenhuma atividade cadastrada para este dia.
      </div>
    `;
    return;
  }

  container.innerHTML = day.tasks.map((task, idx) => {
    // Destaque visual no segundo item ativo (como no mockup)
    const isFocusActive = idx === 1;
    const isDone = task.done;

    return `
      <div class="relative pl-6">
        <!-- Nó da Timeline -->
        <span class="track-node ${isFocusActive ? 'active-node' : ''} ${isDone ? 'border-cyan-400 bg-cyan-400' : ''}"></span>

        <!-- Card Modular -->
        <div class="timeline-slot-card flex items-center justify-between gap-3 ${isFocusActive ? 'active-focus' : ''} ${isDone ? 'is-done' : ''}"
             onclick="window.toggleCleanTechTask('${dayKey}', '${task.id}')">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Ícone da Atividade -->
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isFocusActive ? 'bg-lime-950/60 text-lime-400 border border-lime-400/40' : 'bg-slate-900/80 text-cyan-400 border border-slate-800'}">
              <i data-lucide="${getTaskIcon(task.icon, task.title)}" class="w-4 h-4"></i>
            </div>

            <!-- Horário e Nome -->
            <div class="min-w-0">
              <p class="text-[11px] font-mono font-semibold ${isFocusActive ? 'text-lime-300' : 'text-slate-400'}">
                ${task.time || getDefaultTime(idx)}
              </p>
              <h4 class="text-xs sm:text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}">
                ${task.title.toUpperCase()}
              </h4>
            </div>
          </div>

          <!-- Badge de Pontos -->
          <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg shrink-0 ${isFocusActive ? 'text-lime-400 bg-lime-950/50 border border-lime-500/40' : isDone ? 'text-cyan-300 bg-cyan-950/50 border border-cyan-500/40' : 'text-slate-300 bg-slate-900 border border-slate-800'}">
            (+${task.points}P)
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function getTaskIcon(icon, title) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('skate') || lower.includes('esporte') || lower.includes('futebol') || lower.includes('judô')) return 'activity';
  if (lower.includes('leitura') || lower.includes('ler') || lower.includes('livro')) return 'book-open';
  if (lower.includes('gaming') || lower.includes('lazer') || lower.includes('jogo')) return 'gamepad-2';
  if (lower.includes('dormir') || lower.includes('desconexão') || lower.includes('noite')) return 'moon';
  if (lower.includes('escola') || lower.includes('estudo')) return 'graduation-cap';
  if (lower.includes('kumon') || lower.includes('reforço')) return 'edit-3';
  return 'circle-dot';
}

function getDefaultTime(idx) {
  const times = ['17:30', '19:00', '21:30', '22:30', '08:00', '14:00', '16:00', '20:00'];
  return times[idx % times.length];
}

// Toggle de Atividade
window.toggleCleanTechTask = async function(dayKey, taskId) {
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
      await fetchCleanTechData();
    }
  } catch (err) {
    console.error('Erro ao alternar tarefa:', err);
  }
};

// Renderiza a Barra de Progresso com os Milestones
function renderMilestonesBar(currentPoints) {
  const barFill = document.getElementById('milestone-bar-fill');
  const targetLabel = document.getElementById('milestone-target-label');
  const milestonesContainer = document.getElementById('milestones-icons-row');

  // Encontra o próximo objetivo
  const nextTarget = MILESTONES.find(m => currentPoints < m.points) || MILESTONES[MILESTONES.length - 1];
  const maxScale = 1000;
  const percent = Math.min(100, Math.round((currentPoints / maxScale) * 100));

  if (barFill) barFill.style.width = `${percent}%`;
  if (targetLabel) {
    targetLabel.innerText = `PRÓXIMO OBJETIVO: ${nextTarget.points}P ${nextTarget.label} (${currentPoints}/${nextTarget.points})`;
  }

  if (milestonesContainer) {
    milestonesContainer.innerHTML = MILESTONES.map(m => {
      const isReached = currentPoints >= m.points;
      const isNext = nextTarget.points === m.points;

      return `
        <div class="flex flex-col items-center text-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 transition-all ${isReached ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-400 shadow-sm shadow-cyan-400/50' : isNext ? 'border-2 border-lime-400 text-lime-400 bg-lime-950/40 shadow-sm shadow-lime-400/50' : 'border border-slate-700 text-slate-500 bg-slate-900'}">
            ${m.emoji}
          </div>
          <span class="text-[11px] font-mono font-bold ${isReached ? 'text-cyan-300' : isNext ? 'text-lime-400' : 'text-slate-500'}">${m.points}P</span>
          <span class="text-[10px] text-slate-400">${m.label}</span>
        </div>
      `;
    }).join('');
  }
}

// Humor Pós-Tarefa
window.selectMood = function(mood) {
  activeMood = mood;
  updateMoodUI();
  if (window.showToast) {
    const labels = { foco_total: 'Foco Total ativado!', cansado: 'Cansaço acolhido. Respeite o ritmo.', relaxado: 'Modo relaxado registrado.' };
    window.showToast(labels[mood] || 'Humor registrado!', 'success');
  }
};

function updateMoodUI() {
  document.querySelectorAll('.mood-pill').forEach(pill => {
    if (pill.dataset.mood === activeMood) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

// Reflexão Rápida
window.selectReflection = function(tag) {
  activeReflection = tag;
  updateReflectionUI();
  if (window.showToast) {
    window.showToast(`Reflexão: "${tag}" validada com sucesso!`, 'success');
  }
};

function updateReflectionUI() {
  document.querySelectorAll('.quick-tag').forEach(tag => {
    if (tag.dataset.tag === activeReflection) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });
}

// Botão Reorganizar Dia (Modal sem culpa)
window.openReorganizeModal = function() {
  const modal = document.getElementById('modal-reorganize');
  if (modal) modal.classList.remove('hidden');
};

function setupEventListeners() {
  // Reorganizar Dia
  const btnReorganize = document.getElementById('btn-reorganize-day');
  if (btnReorganize) {
    btnReorganize.addEventListener('click', () => window.openReorganizeModal());
  }

  // Confirmar Reorganização
  const btnConfirmReorg = document.getElementById('btn-confirm-reorganize');
  if (btnConfirmReorg) {
    btnConfirmReorg.addEventListener('click', () => {
      document.getElementById('modal-reorganize').classList.add('hidden');
      if (window.showToast) {
        window.showToast('Dia reorganizado sem perda de pontos ou culpa. O tempo se adapta a você!', 'success');
      }
    });
  }
}
