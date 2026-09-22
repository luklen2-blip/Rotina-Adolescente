// Proteção para ambiente Node.js de testes
const _win = typeof window !== 'undefined' ? window : globalThis;
const _doc = typeof document !== 'undefined' ? document : {
  getElementById: () => null,
  querySelectorAll: () => []
};
const _storage = typeof localStorage !== 'undefined' ? localStorage : {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};
// tablet_ui.js - Controlador da Interface Clean Tech Dark Mode (Ritmo Autonomia V2)
// "Sua rotina. Seu ritmo. Sua autonomia."

let currentRoutineData = null;
let activeDayKey = 'terca'; // Terça ativa por padrão
let activeMood = 'foco_total';
let activeReflection = 'Dia Fluido';
_win.inProgressTaskId = null;

const MILESTONES = [
  { points: 5, label: 'Filme / Jogo', icon: 'popcorn', emoji: '🍿' },
  { points: 10, label: 'Passeio / Sorvete', icon: 'trees', emoji: '🍦' },
  { points: 20, label: 'Cinema', icon: 'film', emoji: '🎬' },
  { points: 30, label: 'Lanche Especial', icon: 'utensils', emoji: '🍔' },
  { points: 50, label: 'Viagem / Dia Livre', icon: 'car', emoji: '🚗' }
];

// -------------------------------------------------------------
// SEPARAÇÃO RIGOROSA: CONTA REAL vs MODO DEMO
// Novo usuário inicia do ZERO: Nível 1, 0 XP, 0 Pontos, 0 Conquistas
// -------------------------------------------------------------
export function isDemoMode() {
  return _storage.getItem('ritmo_mode') === 'demo';
}

export function getUserRealState() {
  const stored = _storage.getItem('ritmo_real_user_state');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return {
    name: '',
    points: 0,
    xp: 0,
    level: 1,
    conquistas: [],
    completedTasks: {},
    lastFocus: '',
    lastTime: '',
    lastEnergy: ''
  };
}

export function saveUserRealState(state) {
  _storage.setItem('ritmo_real_user_state', JSON.stringify(state));
}

_win.toggleDemoMode = function() {
  if (isDemoMode()) {
    _win.exitDemoMode();
  } else {
    _win.enableDemoMode();
  }
};

_win.enableDemoMode = function() {
  _storage.setItem('ritmo_mode', 'demo');
  if (_win.showToast) {
    _win.showToast('Exibindo dados de demonstração (Exemplo de rotina avançada: Nível 12)', 'info');
  }
  updateUI();
};

_win.exitDemoMode = function() {
  _storage.removeItem('ritmo_mode');
  if (_win.showToast) {
    _win.showToast('Retornando para Minha Rotina (Conta Real do Usuário)', 'success');
  }
  updateUI();
};

export async function initCleanTechUI() {
  await fetchCleanTechData();
  setupEventListeners();
  checkOnboardingStatus();
}

export async function fetchCleanTechData() {
  try {
    const modeParam = isDemoMode() ? 'demo' : 'real';
    const res = await fetch(`/api/routine/week?mode=${modeParam}`);
    const json = await res.json();
    if (json.success) {
      currentRoutineData = json.data;

      // Se o usuário possui rotina adaptada customizada salva localmente, integra no dia ativo
      const savedCustom = _storage.getItem('ritmo_custom_daily_tasks');
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentRoutineData.board.days[activeDayKey].tasks = parsed;
          }
        } catch (e) {}
      }

      updateUI();
    }
  } catch (err) {
    console.error('Erro ao carregar dados Clean Tech:', err);
  }
}

export function updateUI() {
  if (!currentRoutineData) return;

  const demoActive = isDemoMode();
  const realState = getUserRealState();

  // Valores calculados com base em DEMO ou CONTA REAL
  const points = demoActive ? 345 : (realState.points || 0);
  const xp = demoActive ? 3450 : (realState.xp || 0);
  const level = demoActive ? 12 : (realState.level || 1);

  // 1. Cabeçalho Superior — "MINHA ROTINA" (ou com o nome do usuário)
  const titleEl = _doc.getElementById('user-header-title');
  const userProfile = JSON.parse(_storage.getItem('ritmo_user_profile') || '{}');
  const customName = userProfile.name || realState.name || '';

  if (titleEl) {
    if (demoActive) {
      titleEl.innerHTML = `EXEMPLO DE ROTINA <span class="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono align-middle">DEMONSTRAÇÃO</span>`;
    } else if (customName) {
      titleEl.innerHTML = `ROTINA DE <span class="text-glow-lime">${customName.toUpperCase()}</span>`;
    } else {
      titleEl.innerHTML = `MINHA <span class="text-glow-lime">ROTINA</span>`;
    }
  }

  // Banner e botões de Modo Demo vs Real
  const demoBanner = _doc.getElementById('demo-mode-banner');
  const demoToggleLabel = _doc.getElementById('demo-toggle-label');
  const progressModeBadge = _doc.getElementById('progress-mode-badge');

  if (demoActive) {
    if (demoBanner) demoBanner.classList.remove('hidden');
    if (demoToggleLabel) demoToggleLabel.innerText = 'Sair da Demo (Voltar à Minha Conta)';
    if (progressModeBadge) {
      progressModeBadge.innerText = 'MODO DEMO (EXEMPLO DE ROTINA)';
      progressModeBadge.className = 'text-[11px] font-mono text-amber-400 font-bold';
    }
  } else {
    if (demoBanner) demoBanner.classList.add('hidden');
    if (demoToggleLabel) demoToggleLabel.innerText = 'Ver rotina de exemplo (Demo)';
    if (progressModeBadge) {
      progressModeBadge.innerText = 'CONTA REAL (COMEÇANDO DO ZERO)';
      progressModeBadge.className = 'text-[11px] font-mono text-cyan-400 font-bold';
    }
  }

  // 2. Renderiza HIERARQUIA 1: PRÓXIMA ATIVIDADE
  renderNextActivitySection();

  // 3. Renderiza HIERARQUIA 2: COMO VOCÊ ESTÁ? (Percepção)
  updateMoodUI();

  // 4. Renderiza HIERARQUIA 3: SEU PROGRESSO (XP, Nível e Pontos)
  renderProgressSection(points, xp, level);

  // 5. Renderiza HIERARQUIA 5: AGENDA DO DIA, MARCOS E REFLEXÕES
  renderDayCarousel();
  renderTimelineSlots(activeDayKey);
  renderMilestonesBar(points);
  updateReflectionUI();

  if (_win.lucide) _win.lucide.createIcons();
}

// -------------------------------------------------------------
// HIERARQUIA 1: PRÓXIMA ATIVIDADE
// Exemplo: 📚 Estudar por 20 minutos [COMEÇAR] [CONCLUIR (+50 XP)]
// -------------------------------------------------------------
export function renderNextActivitySection() {
  const container = _doc.getElementById('next-activity-container');
  if (!container || !currentRoutineData) return;

  const day = currentRoutineData.board.days[activeDayKey];
  const tasks = day?.tasks || [];
  const nextTask = tasks.find(t => !t.done);
  const doneCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Atualiza contadores da seção de progresso
  const progressText = _doc.getElementById('daily-progress-text');
  if (progressText) {
    progressText.innerText = `Progresso de hoje: ${doneCount} de ${totalCount} concluídas (${progressPct}%)`;
  }
  const progressBar = _doc.getElementById('daily-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progressPct}%`;
  }

  if (!nextTask) {
    container.innerHTML = `
      <div class="tech-card p-5 sm:p-6 bg-emerald-950/20 border-emerald-500/40 text-center space-y-3">
        <span class="inline-block p-3 rounded-full bg-emerald-500/20 text-emerald-400 text-2xl">🎉</span>
        <h3 class="text-base sm:text-lg font-black text-white">Todas as atividades de hoje foram concluídas no teu ritmo!</h3>
        <p class="text-xs text-slate-300 max-w-lg mx-auto">
          Excelente avanço hoje. Você construiu consistência sem cobranças excessivas. Aproveite o restante do dia para descansar ou ative o Ócio Deliberado.
        </p>
        <div class="flex items-center justify-center gap-3 pt-2">
          <button onclick="_win.activateOcioDeliberado()" class="px-4 py-2 rounded-xl bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 text-xs font-bold hover:bg-indigo-800 transition flex items-center gap-1.5">
            <i data-lucide="moon" class="w-3.5 h-3.5"></i>
            Ativar Ócio Deliberado (+5P)
          </button>
          <button onclick="_win.openReorganizeModal()" class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-semibold hover:border-cyan-400 transition">
            Planejar amanhã
          </button>
        </div>
      </div>
    `;
    if (_win.lucide) _win.lucide.createIcons();
    return;
  }

  const isInProgress = _win.inProgressTaskId === nextTask.id;

  container.innerHTML = `
    <div class="next-activity-card p-5 sm:p-6 space-y-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/30 shadow-lg shadow-black/30">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-400/30">
          <span class="w-2.5 h-2.5 rounded-full ${isInProgress ? 'bg-emerald-400 animate-ping' : 'bg-sky-400 animate-pulse'}"></span>
          ${isInProgress ? 'EM ANDAMENTO • FOCO ATIVO' : 'PRÓXIMA ATIVIDADE EM FOCO'}
        </span>
        <span class="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
          +50 XP
        </span>
      </div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="text-xs font-mono text-slate-400 flex items-center gap-2">
            <i data-lucide="clock" class="w-4 h-4 text-sky-400"></i>
            <span>Horário sugerido:</span>
            <strong class="text-slate-100 font-mono">${nextTask.time || 'Agora'}</strong>
            <span class="text-slate-500">•</span>
            <span class="text-emerald-400 font-mono">+${nextTask.points || 2}P conquista</span>
          </div>
          <h3 class="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span>${nextTask.title}</span>
          </h3>
          <p class="text-xs text-slate-400">
            ${isInProgress ? 'Mantenha sua atenção plena. No seu tempo, no seu compasso.' : 'Dê o primeiro passo no seu ritmo. Cada bloco concluído fortalece sua autonomia.'}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 shrink-0 pt-1 md:pt-0">
          ${!isInProgress ? `
            <button onclick="_win.startNextActivity('${nextTask.id}')" class="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs hover:border-sky-400 hover:text-sky-300 active:scale-95 transition-all flex items-center gap-2 shadow-sm" title="Iniciar foco agora">
              <i data-lucide="play" class="w-4 h-4 fill-current text-sky-400"></i>
              <span>Começar</span>
            </button>
          ` : `
            <span class="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-400/30 text-emerald-300 font-mono text-xs flex items-center gap-1.5">
              <i data-lucide="activity" class="w-3.5 h-3.5 animate-pulse"></i>
              Foco iniciado
            </span>
          `}

          <button onclick="_win.completeNextActivity('${nextTask.id}')" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 text-slate-950 font-bold text-xs hover:brightness-105 active:scale-95 transition-all shadow-md shadow-sky-500/20 flex items-center gap-2" title="Concluir atividade e ganhar 50 XP">
            <i data-lucide="check-circle-2" class="w-4 h-4"></i>
            <span>Concluir (+50 XP)</span>
          </button>

          <button onclick="_win.openReorganizeModal()" class="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-emerald-400 text-xs font-semibold transition" title="Reorganizar sem culpa se o dia mudou">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  if (_win.lucide) _win.lucide.createIcons();
}

_win.startNextActivity = function(taskId) {
  _win.inProgressTaskId = taskId;
  if (_win.showToast) {
    _win.showToast('Atividade iniciada! Concentre-se no seu ritmo e sem cobrança.', 'info');
  }
  renderNextActivitySection();
};

_win.completeNextActivity = async function(taskId) {
  await completeActivity(taskId);
};

async function completeActivity(taskId) {
  const day = currentRoutineData?.board?.days[activeDayKey];
  const task = day?.tasks?.find(t => t.id === taskId);
  if (!task) return;

  task.done = true;
  _win.inProgressTaskId = null;
  const taskPoints = Number(task.points) || 2;

  if (isDemoMode()) {
    try {
      await fetch('/api/routine/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayKey: activeDayKey, taskId })
      });
    } catch (e) {}
  } else {
    // CONTA REAL DO USUÁRIO
    const realState = getUserRealState();
    realState.xp = (realState.xp || 0) + 50;
    realState.points = (realState.points || 0) + taskPoints;
    realState.level = 1 + Math.floor(realState.xp / 100);
    if (!realState.completedTasks) realState.completedTasks = {};
    realState.completedTasks[taskId] = true;
    saveUserRealState(realState);

    // Persiste localmente a rotina do dia
    _storage.setItem('ritmo_custom_daily_tasks', JSON.stringify(day.tasks));

    // Sincroniza toggle com o backend
    try {
      await fetch('/api/routine/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayKey: activeDayKey, taskId })
      });
    } catch (e) {}
  }

  // Notificação de Sucesso Oficial:
  showVisualFeedback('+50 XP', 'Atividade concluída.', 'Mais um passo no seu ritmo.');
  updateUI();
}

// -------------------------------------------------------------
// HIERARQUIA 3: SEU PROGRESSO (XP, Nível e Pontos)
// -------------------------------------------------------------
export function renderProgressSection(points, xp, level) {
  const levelTitle = _doc.getElementById('gamification-level-title');
  const levelFill = _doc.getElementById('gamification-bar-fill');
  const levelSub = _doc.getElementById('gamification-level-sub');
  const xpNumber = _doc.getElementById('gamification-xp-number');
  const pointsDisplay = _doc.getElementById('saldo-points-display');

  const xpInCurrentLevel = xp % 100;
  const pct = Math.min(100, Math.round((xpInCurrentLevel / 100) * 100));
  const xpNeeded = 100 - xpInCurrentLevel;

  if (levelTitle) levelTitle.innerText = `NÍVEL ${level}`;
  if (xpNumber) xpNumber.innerText = `${xp} XP`;
  if (levelFill) levelFill.style.width = `${pct}%`;
  if (levelSub) levelSub.innerText = `${pct}% • ${xpNeeded} XP para o próximo nível`;
  if (pointsDisplay) pointsDisplay.innerText = points;
}

// -------------------------------------------------------------
// HIERARQUIA 5: AGENDA DETALHADA E CONQUISTAS
// -------------------------------------------------------------
export function renderDayCarousel() {
  const container = _doc.getElementById('day-carousel');
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
            onclick="_win.selectDay('${d.key}')">
      ${d.label}
    </button>
  `).join('');
}

_win.selectDay = function(dayKey) {
  activeDayKey = dayKey;
  renderDayCarousel();
  renderNextActivitySection();
  renderTimelineSlots(dayKey);
  if (_win.lucide) _win.lucide.createIcons();
};

export function renderTimelineSlots(dayKey) {
  const container = _doc.getElementById('timeline-slots-container');
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
    const isDone = task.done;
    const isFocusActive = !isDone && (day.tasks.findIndex(t => !t.done) === idx);

    return `
      <div class="relative pl-6">
        <span class="track-node ${isFocusActive ? 'active-node' : ''} ${isDone ? 'border-sky-400 bg-sky-400' : ''}"></span>

        <div class="timeline-slot-card flex items-center justify-between gap-3 ${isFocusActive ? 'active-focus' : ''} ${isDone ? 'is-done' : ''}"
             onclick="_win.toggleCleanTechTask('${dayKey}', '${task.id}')">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isFocusActive ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-400/30' : isDone ? 'bg-sky-950/40 text-sky-400 border border-sky-800/60' : 'bg-slate-900 text-slate-400 border border-slate-800'}">
              <i data-lucide="${getTaskIcon(task.icon, task.title)}" class="w-4 h-4"></i>
            </div>

            <div class="min-w-0">
              <p class="text-[11px] font-mono font-semibold ${isFocusActive ? 'text-emerald-300' : isDone ? 'text-sky-400' : 'text-slate-400'}">
                ${task.time || getDefaultTime(idx)}
              </p>
              <h4 class="text-xs sm:text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}">
                ${task.title.toUpperCase()}
              </h4>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg ${isFocusActive ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30' : isDone ? 'text-sky-300 bg-sky-950/40 border border-sky-500/30' : 'text-slate-300 bg-slate-900 border border-slate-800'}">
              ${isDone ? '✓ Concluído' : `+${task.points || 2}P`}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getTaskIcon(icon, title) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('leitura') || lower.includes('livro')) return 'book-open';
  if (lower.includes('estudo') || lower.includes('revisão') || lower.includes('escola') || lower.includes('estudar')) return 'graduation-cap';
  if (lower.includes('pausa') || lower.includes('café') || lower.includes('água')) return 'coffee';
  if (lower.includes('sono') || lower.includes('dormir') || lower.includes('descanso') || lower.includes('ócio')) return 'moon';
  if (lower.includes('exercício') || lower.includes('esporte') || lower.includes('treino') || lower.includes('movimento')) return 'activity';
  if (lower.includes('trabalho') || lower.includes('projeto') || lower.includes('meta')) return 'briefcase';
  if (lower.includes('tarefa') || lower.includes('organizar') || lower.includes('planejar')) return 'clipboard-list';
  return icon || 'check-circle-2';
}

function getDefaultTime(idx) {
  const times = ['08:30', '10:00', '14:00', '15:30', '17:00', '19:00', '21:00', '22:30'];
  return times[idx % times.length];
}

_win.toggleCleanTechTask = async function(dayKey, taskId) {
  const day = currentRoutineData?.board?.days[dayKey];
  const task = day?.tasks?.find(t => t.id === taskId);
  if (!task) return;

  if (task.done) {
    task.done = false;
    if (!isDemoMode()) {
      const realState = getUserRealState();
      realState.points = Math.max(0, (realState.points || 0) - (task.points || 2));
      saveUserRealState(realState);
      _storage.setItem('ritmo_custom_daily_tasks', JSON.stringify(day.tasks));
    }
    if (_win.showToast) {
      _win.showToast('Tarefa marcada como pendente no seu ritmo.', 'info');
    }
    updateUI();
  } else {
    await completeActivity(taskId);
  }
};

function showVisualFeedback(xpText, title, subtitle) {
  if (_win.showToast) {
    _win.showToast(`${xpText} • ${title} ${subtitle}`, 'success');
  }
}

export function renderMilestonesBar(currentPoints) {
  const barFill = _doc.getElementById('milestone-bar-fill');
  const targetLabel = _doc.getElementById('milestone-target-label');
  const milestonesContainer = _doc.getElementById('milestones-icons-row');

  const nextTarget = MILESTONES.find(m => currentPoints < m.points) || MILESTONES[MILESTONES.length - 1];
  const maxScale = 50;
  const percent = Math.min(100, Math.round((currentPoints / maxScale) * 100));

  if (barFill) barFill.style.width = `${percent}%`;
  if (targetLabel) {
    targetLabel.innerText = `PRÓXIMO MARCO: ${nextTarget.points}P ${nextTarget.label} (${currentPoints}/${nextTarget.points} Pontos)`;
  }

  if (milestonesContainer) {
    milestonesContainer.innerHTML = MILESTONES.map(m => {
      const isReached = currentPoints >= m.points;
      const isNext = nextTarget.points === m.points;

      return `
        <div class="flex flex-col items-center text-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 transition-all ${isReached ? 'bg-sky-500/15 text-sky-300 border-2 border-sky-400 shadow-sm' : isNext ? 'border-2 border-emerald-400 text-emerald-400 bg-emerald-950/30 shadow-sm' : 'border border-slate-700 text-slate-500 bg-slate-900'}">
            ${m.emoji}
          </div>
          <span class="text-[11px] font-mono font-bold ${isReached ? 'text-sky-300' : isNext ? 'text-emerald-400' : 'text-slate-500'}">${m.points}P</span>
          <span class="text-[10px] text-slate-400 truncate max-w-[60px]">${m.label}</span>
        </div>
      `;
    }).join('');
  }
}

// -------------------------------------------------------------
// HIERARQUIA 2: COMO VOCÊ ESTÁ? (Percepção Emocional)
// -------------------------------------------------------------
_win.selectMood = function(mood) {
  activeMood = mood;
  updateMoodUI();
  const labels = { 
    foco_total: '😤 Foco Total registrado! Excelente presença e dedicação.', 
    cansado: '😩 Cansaço acolhido. Respeite o teu ritmo e desacelere sem culpa.', 
    relaxado: '😌 Modo relaxado registrado. Fluindo com tranquilidade e clareza.' 
  };
  
  const storedPerceptions = JSON.parse(_storage.getItem('ritmo_perceptions') || '[]');
  storedPerceptions.push({ mood, timestamp: new Date().toISOString() });
  _storage.setItem('ritmo_perceptions', JSON.stringify(storedPerceptions.slice(-20)));

  if (_win.showToast) {
    _win.showToast(labels[mood] || 'Percepção registrada com sucesso!', 'success');
  }
};

export function updateMoodUI() {
  _doc.querySelectorAll('.mood-pill').forEach(pill => {
    if (pill.dataset.mood === activeMood) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

_win.selectReflection = function(tag) {
  activeReflection = tag;
  updateReflectionUI();
  if (_win.showToast) {
    _win.showToast(`Reflexão: "${tag}" anotada no teu diário de bordo.`, 'success');
  }
};

export function updateReflectionUI() {
  _doc.querySelectorAll('.quick-tag').forEach(tag => {
    if (tag.dataset.tag === activeReflection) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });
}

// -------------------------------------------------------------
// REORGANIZAÇÃO SEM PUNIÇÃO & ÓCIO DELIBERADO
// -------------------------------------------------------------
_win.openReorganizeModal = function() {
  const modal = _doc.getElementById('modal-reorganize');
  if (modal) modal.classList.remove('hidden');
};

_win.activateOcioDeliberado = async function() {
  if (!isDemoMode()) {
    const realState = getUserRealState();
    realState.points = (realState.points || 0) + 5;
    saveUserRealState(realState);
  }

  try {
    await fetch('/api/routine/bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        points: 5, 
        reason: 'Ócio Deliberado: Descanso Consciente' 
      })
    });
  } catch (err) {}

  _doc.getElementById('modal-reorganize')?.classList.add('hidden');
  if (_win.showToast) {
    _win.showToast('Ócio Deliberado ativado (+5P). Descansar também faz parte de uma rotina saudável!', 'success');
  }
  updateUI();
};

// -------------------------------------------------------------
// -------------------------------------------------------------
// -------------------------------------------------------------
// GERADOR DETERMINÍSTICO DE ROTINA ADAPTADA
// Fórmula: OBJETIVO + TEMPO DISPONÍVEL + ENERGIA = ROTINA ADAPTADA
// -------------------------------------------------------------
export function generateAdaptiveRoutine(focus, time, energy) {
  const f = focus || 'Minha rotina';
  const t = time || 'Normal';
  const e = energy || 'Média';

  // --- 1. ESTUDOS ---
  if (f === 'Estudos') {
    // CENÁRIO A: Pouco tempo e Baixa energia (Carga mínima, tarefas simples, sem sobrecarga)
    if (t === 'Pouco' && e === 'Baixa') {
      return [
        { id: 'est_1', title: 'Estudar — 15 min', points: 2, icon: 'book-open', time: '14:00', done: false },
        { id: 'est_2', title: 'Pausa — 5 min', points: 1, icon: 'coffee', time: '14:15', done: false },
        { id: 'est_3', title: 'Revisão — 10 min', points: 2, icon: 'check-circle-2', time: '14:20', done: false },
        { id: 'est_4', title: 'Descanso (Ócio Deliberado)', points: 1, icon: 'moon', time: '14:30', done: false }
      ];
    }
    // CENÁRIO B: Bastante tempo e Alta energia (Carga máxima, estudo completo, sprints)
    if (t === 'Bastante' && e === 'Alta') {
      return [
        { id: 'est_b1', title: 'Planejamento e Separação de Conteúdo (10 min)', points: 1, icon: 'clipboard-list', time: '09:00', done: false },
        { id: 'est_b2', title: 'Bloco 1: Estudo Teórico em Foco Total (35 min)', points: 3, icon: 'book-open', time: '09:10', done: false },
        { id: 'est_b3', title: 'Pausa Ativa e Hidratação (10 min)', points: 1, icon: 'coffee', time: '09:45', done: false },
        { id: 'est_b4', title: 'Bloco 2: Resolução de Exercícios & Fixação (35 min)', points: 3, icon: 'edit-3', time: '09:55', done: false },
        { id: 'est_b5', title: 'Síntese dos Pontos-Chave & Mapeamento (20 min)', points: 2, icon: 'check-circle-2', time: '10:30', done: false },
        { id: 'est_b6', title: 'Ócio Deliberado: Tempo Livre Protegido (30 min)', points: 1, icon: 'moon', time: '10:50', done: false }
      ];
    }
    // Estudos - Outras variações
    if (t === 'Pouco') {
      return [
        { id: 'est_p1', title: 'Foco Essencial de Estudo (20 min)', points: 3, icon: 'book-open', time: '14:00', done: false },
        { id: 'est_p2', title: 'Pausa Restaurativa Rápida (5 min)', points: 1, icon: 'coffee', time: '14:20', done: false },
        { id: 'est_p3', title: 'Revisão dos Pontos Principais (10 min)', points: 2, icon: 'check-circle-2', time: '14:25', done: false }
      ];
    }
    if (e === 'Baixa') {
      return [
        { id: 'est_eb1', title: 'Leitura Suave sem Pressão (20 min)', points: 2, icon: 'book-open', time: '14:00', done: false },
        { id: 'est_eb2', title: 'Intervalo Restaurativo (10 min)', points: 1, icon: 'coffee', time: '14:20', done: false },
        { id: 'est_eb3', title: 'Resumo Rápido em Tópicos (15 min)', points: 2, icon: 'edit-3', time: '14:30', done: false },
        { id: 'est_eb4', title: 'Ócio Deliberado & Descanso (20 min)', points: 1, icon: 'moon', time: '14:45', done: false }
      ];
    }
    if (t === 'Bastante') {
      return [
        { id: 'est_bas1', title: 'Organização do Cronograma de Estudos (10 min)', points: 1, icon: 'clipboard-list', time: '09:00', done: false },
        { id: 'est_bas2', title: 'Sessão 1: Conceitos e Teoria (30 min)', points: 3, icon: 'book-open', time: '09:10', done: false },
        { id: 'est_bas3', title: 'Pausa Consciente & Lanche (10 min)', points: 1, icon: 'coffee', time: '09:40', done: false },
        { id: 'est_bas4', title: 'Sessão 2: Prática e Aplicação (30 min)', points: 3, icon: 'edit-3', time: '09:50', done: false },
        { id: 'est_bas5', title: 'Ócio Deliberado Merecido (25 min)', points: 1, icon: 'moon', time: '10:20', done: false }
      ];
    }
    // Estudos - Normal / Média (Padrão)
    return [
      { id: 'est_m1', title: 'Organizar Material e Metas de Estudo (10 min)', points: 1, icon: 'clipboard-list', time: '14:00', done: false },
      { id: 'est_m2', title: 'Estudo em Foco Contínuo (25 min)', points: 3, icon: 'book-open', time: '14:10', done: false },
      { id: 'est_m3', title: 'Pausa Consciente & Água (10 min)', points: 1, icon: 'coffee', time: '14:35', done: false },
      { id: 'est_m4', title: 'Exercícios de Fixação no Seu Ritmo (20 min)', points: 2, icon: 'check-circle-2', time: '14:45', done: false },
      { id: 'est_m5', title: 'Ócio Deliberado & Descanso (15 min)', points: 1, icon: 'moon', time: '15:05', done: false }
    ];
  }

  // --- 2. HÁBITOS ---
  if (f === 'Hábitos') {
    // CENÁRIO C: Tempo Normal e Média energia (Autocuidado, saúde e equilíbrio sustentável)
    if (t === 'Normal' && e === 'Média') {
      return [
        { id: 'hab_c1', title: 'Hidratação Matinal e Despertar Consciente (10 min)', points: 1, icon: 'heart', time: '08:00', done: false },
        { id: 'hab_c2', title: 'Alongamento ou Caminhada Leve (20 min)', points: 2, icon: 'activity', time: '08:10', done: false },
        { id: 'hab_c3', title: 'Leitura e Presença Tranquila (20 min)', points: 2, icon: 'book-open', time: '19:00', done: false },
        { id: 'hab_c4', title: 'Higiene do Sono & Desconexão Noturna (15 min)', points: 1, icon: 'moon', time: '22:00', done: false }
      ];
    }
    if (t === 'Pouco' || e === 'Baixa') {
      return [
        { id: 'hab_p1', title: 'Copão de Água e Respiração Consciente (5 min)', points: 1, icon: 'heart', time: '08:00', done: false },
        { id: 'hab_p2', title: 'Alongamento Suave (10 min)', points: 1, icon: 'activity', time: '08:05', done: false },
        { id: 'hab_p3', title: 'Desconexão Precoce de Telas (10 min)', points: 1, icon: 'moon', time: '21:30', done: false }
      ];
    }
    if (t === 'Bastante' && e === 'Alta') {
      return [
        { id: 'hab_b1', title: 'Hidratação e Respiração Guiada (10 min)', points: 1, icon: 'heart', time: '07:00', done: false },
        { id: 'hab_b2', title: 'Treino Físico ou Caminhada Ativa (35 min)', points: 3, icon: 'activity', time: '07:10', done: false },
        { id: 'hab_b3', title: 'Alimentação Consciente & Café com Calma (25 min)', points: 2, icon: 'coffee', time: '07:45', done: false },
        { id: 'hab_b4', title: 'Organização do Espaço de Vivência (20 min)', points: 2, icon: 'clipboard-list', time: '14:00', done: false },
        { id: 'hab_b5', title: 'Leitura e Expansão Pessoal (25 min)', points: 2, icon: 'book-open', time: '19:30', done: false },
        { id: 'hab_b6', title: 'Higiene do Sono & Telas Desligadas (15 min)', points: 1, icon: 'moon', time: '22:00', done: false }
      ];
    }
    return [
      { id: 'hab_std1', title: 'Hidratação Matinal (5 min)', points: 1, icon: 'heart', time: '07:30', done: false },
      { id: 'hab_std2', title: 'Movimento Corporal Leve (20 min)', points: 2, icon: 'activity', time: '07:35', done: false },
      { id: 'hab_std3', title: 'Leitura Tranquila (20 min)', points: 2, icon: 'book-open', time: '19:00', done: false },
      { id: 'hab_std4', title: 'Ócio Deliberado & Preparação do Sono (15 min)', points: 1, icon: 'moon', time: '22:00', done: false }
    ];
  }

  // --- 3. TRABALHO ---
  if (f === 'Trabalho') {
    if (t === 'Pouco' || e === 'Baixa') {
      return [
        { id: 'tra_p1', title: 'Definir a Única Prioridade do Dia (10 min)', points: 2, icon: 'clipboard-list', time: '09:00', done: false },
        { id: 'tra_p2', title: 'Execução Essencial sem Pressa (15 min)', points: 2, icon: 'briefcase', time: '09:10', done: false },
        { id: 'tra_p3', title: 'Ócio Deliberado & Descompressão (15 min)', points: 1, icon: 'moon', time: '09:25', done: false }
      ];
    }
    if (t === 'Bastante' && e === 'Alta') {
      return [
        { id: 'tra_b1', title: 'Alinhar Objetivos e Entregas (15 min)', points: 1, icon: 'clipboard-list', time: '08:30', done: false },
        { id: 'tra_b2', title: 'Sprint 1 de Produção (35 min)', points: 3, icon: 'briefcase', time: '08:45', done: false },
        { id: 'tra_b3', title: 'Intervalo Restaurativo (10 min)', points: 1, icon: 'coffee', time: '09:20', done: false },
        { id: 'tra_b4', title: 'Sprint 2 Foco Profundo (35 min)', points: 3, icon: 'briefcase', time: '09:30', done: false },
        { id: 'tra_b5', title: 'Fechamento de Pendências (20 min)', points: 2, icon: 'check-check', time: '10:05', done: false },
        { id: 'tra_b6', title: 'Ócio Deliberado (20 min)', points: 1, icon: 'moon', time: '10:25', done: false }
      ];
    }
    return [
      { id: 'tra_m1', title: 'Planejamento das Metas Principais (10 min)', points: 1, icon: 'clipboard-list', time: '09:00', done: false },
      { id: 'tra_m2', title: 'Bloco de Foco Profissional (30 min)', points: 3, icon: 'briefcase', time: '09:10', done: false },
      { id: 'tra_m3', title: 'Pausa Consciente (10 min)', points: 1, icon: 'coffee', time: '09:40', done: false },
      { id: 'tra_m4', title: 'Finalização de Tarefas Chave (20 min)', points: 2, icon: 'check-circle-2', time: '09:50', done: false }
    ];
  }

  // --- 4. TAREFAS ---
  if (f === 'Tarefas') {
    if (t === 'Pouco' || e === 'Baixa') {
      return [
        { id: 'tar_p1', title: 'Escolher a Tarefa Mais Urgente (5 min)', points: 1, icon: 'clipboard-list', time: '10:00', done: false },
        { id: 'tar_p2', title: 'Executar no Seu Ritmo (15 min)', points: 2, icon: 'check-circle-2', time: '10:05', done: false },
        { id: 'tar_p3', title: 'Pausa Restaurativa sem Cobrança (10 min)', points: 1, icon: 'coffee', time: '10:20', done: false }
      ];
    }
    if (t === 'Bastante' && e === 'Alta') {
      return [
        { id: 'tar_b1', title: 'Listar e Priorizar Demandas do Dia (10 min)', points: 1, icon: 'clipboard-list', time: '09:00', done: false },
        { id: 'tar_b2', title: 'Tarefa de Maior Impacto (30 min)', points: 3, icon: 'check-circle-2', time: '09:10', done: false },
        { id: 'tar_b3', title: 'Pausa Restaurativa e Água (10 min)', points: 1, icon: 'coffee', time: '09:40', done: false },
        { id: 'tar_b4', title: 'Segunda Tarefa Essencial (25 min)', points: 2, icon: 'check-circle-2', time: '09:50', done: false },
        { id: 'tar_b5', title: 'Pequenas Pendências e Organização (15 min)', points: 1, icon: 'check-check', time: '10:15', done: false },
        { id: 'tar_b6', title: 'Ócio Deliberado: Pausa Merecida (20 min)', points: 1, icon: 'moon', time: '10:30', done: false }
      ];
    }
    return [
      { id: 'tar_m1', title: 'Listar 3 Tarefas Chave (10 min)', points: 1, icon: 'clipboard-list', time: '10:00', done: false },
      { id: 'tar_m2', title: 'Executar Primeira Tarefa (25 min)', points: 3, icon: 'check-circle-2', time: '10:10', done: false },
      { id: 'tar_m3', title: 'Pausa de Descompressão (10 min)', points: 1, icon: 'coffee', time: '10:35', done: false },
      { id: 'tar_m4', title: 'Segunda Tarefa sem Pressa (20 min)', points: 2, icon: 'check-circle-2', time: '10:45', done: false }
    ];
  }

  // --- 5. MEU DIA / MINHA ROTINA ---
  if (t === 'Pouco' || e === 'Baixa') {
    return [
      { id: 'rot_p1', title: 'Acolher a Energia e Escolher 1 Prioridade (10 min)', points: 1, icon: 'smile', time: '10:00', done: false },
      { id: 'rot_p2', title: 'Atividade Essencial no Seu Ritmo (15 min)', points: 2, icon: 'check-circle-2', time: '10:10', done: false },
      { id: 'rot_p3', title: 'Ócio Deliberado: Descanso Merecido (10 min)', points: 1, icon: 'moon', time: '10:25', done: false }
    ];
  }
  if (t === 'Bastante' && e === 'Alta') {
    return [
      { id: 'rot_b1', title: 'Planejamento Geral do Dia (10 min)', points: 1, icon: 'clipboard-list', time: '08:30', done: false },
      { id: 'rot_b2', title: 'Bloco 1: Foco e Autonomia (35 min)', points: 3, icon: 'check-circle-2', time: '08:40', done: false },
      { id: 'rot_b3', title: 'Pausa Ativa e Hidratação (10 min)', points: 1, icon: 'coffee', time: '09:15', done: false },
      { id: 'rot_b4', title: 'Bloco 2: Atividade Prática ou Estudos (30 min)', points: 3, icon: 'book-open', time: '09:25', done: false },
      { id: 'rot_b5', title: 'Leitura ou Prática Pessoal (25 min)', points: 2, icon: 'heart', time: '15:00', done: false },
      { id: 'rot_b6', title: 'Ócio Deliberado & Tempo Protegido (25 min)', points: 1, icon: 'moon', time: '21:00', done: false }
    ];
  }
  return [
    { id: 'rot_m1', title: 'Organização do Dia no Seu Compasso (10 min)', points: 1, icon: 'clipboard-list', time: '09:00', done: false },
    { id: 'rot_m2', title: 'Bloco de Foco do Momento (30 min)', points: 3, icon: 'check-circle-2', time: '09:10', done: false },
    { id: 'rot_m3', title: 'Pausa Restaurativa (10 min)', points: 1, icon: 'coffee', time: '09:40', done: false },
    { id: 'rot_m4', title: 'Prática Leve ou Leitura (20 min)', points: 2, icon: 'book-open', time: '15:00', done: false }
  ];
}

// -------------------------------------------------------------
// ONBOARDING: "VAMOS DESCOBRIR SEU RITMO"
// -------------------------------------------------------------
export function checkOnboardingStatus() {
  const done = _storage.getItem('ritmo_onboarding_done');
  if (!done) {
    setTimeout(() => {
      _win.openOnboardingModal();
    }, 350);
  }
}

_win.openOnboardingModal = function() {
  const modal = _doc.getElementById('modal-onboarding');
  if (modal) modal.classList.remove('hidden');
};

_win.closeOnboardingModal = function() {
  const modal = _doc.getElementById('modal-onboarding');
  if (modal) modal.classList.add('hidden');
};

// "Fazer depois" - Pula o onboarding e permite usar rotina leve inicial
_win.postponeOnboarding = function() {
  _storage.setItem('ritmo_onboarding_done', 'postponed');
  if (!_storage.getItem('ritmo_custom_daily_tasks')) {
    const starterTasks = generateAdaptiveRoutine('Minha rotina', 'Normal', 'Média');
    _storage.setItem('ritmo_custom_daily_tasks', JSON.stringify(starterTasks));
    if (currentRoutineData && currentRoutineData.board && currentRoutineData.board.days[activeDayKey]) {
      currentRoutineData.board.days[activeDayKey].tasks = starterTasks;
    }
  }
  _win.closeOnboardingModal();
  if (_win.showToast) {
    _win.showToast('Tudo bem! Você pode descobrir seu ritmo a qualquer momento no botão "Redefinir Ritmo".', 'info');
  }
  updateUI();
};

_win.skipOnboarding = _win.postponeOnboarding;

// "Gerar Minha Rotina" - Executa a adaptação real com base nas 3 respostas
_win.saveOnboardingPreferences = async function() {
  const selectedFocus = _doc.querySelector('.onboarding-option[data-group="focus"].selected')?.dataset.value || 'Minha rotina';
  const selectedTime = _doc.querySelector('.onboarding-option[data-group="time"].selected')?.dataset.value || 'Normal';
  const selectedEnergy = _doc.querySelector('.onboarding-option[data-group="energy"].selected')?.dataset.value || 'Média';

  const preferences = { focus: selectedFocus, time: selectedTime, energy: selectedEnergy };
  _storage.setItem('ritmo_user_profile', JSON.stringify(preferences));
  _storage.setItem('ritmo_onboarding_done', 'true');

  // GERAÇÃO REAL DA ROTINA ADAPTADA DETERMINÍSTICA
  const adaptedTasks = generateAdaptiveRoutine(selectedFocus, selectedTime, selectedEnergy);
  _storage.setItem('ritmo_custom_daily_tasks', JSON.stringify(adaptedTasks));

  // Atualiza em memória o dia ativo
  if (currentRoutineData && currentRoutineData.board && currentRoutineData.board.days[activeDayKey]) {
    currentRoutineData.board.days[activeDayKey].tasks = adaptedTasks;
  }

  // Notifica o backend para registro
  try {
    await fetch('/api/routine/adapt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        focus: selectedFocus,
        time: selectedTime,
        energy: selectedEnergy,
        tasks: adaptedTasks,
        dayKey: activeDayKey
      })
    });
  } catch (err) {}

  _win.closeOnboardingModal();

  if (selectedEnergy === 'Baixa' || selectedTime === 'Pouco') {
    _win.selectMood('cansado');
    showVisualFeedback('🧭 Ritmo Adaptado', `Rotina suave gerada para ${selectedFocus}:`, `${adaptedTasks.length} blocos leves e acolhedores.`);
  } else if (selectedEnergy === 'Alta') {
    _win.selectMood('foco_total');
    showVisualFeedback('🧭 Ritmo Adaptado', `Rotina de foco gerada para ${selectedFocus}:`, `${adaptedTasks.length} blocos para avançar no seu compasso.`);
  } else {
    _win.selectMood('relaxado');
    showVisualFeedback('🧭 Ritmo Adaptado', `Rotina equilibrada gerada para ${selectedFocus}:`, `${adaptedTasks.length} blocos sem pressa e sem cobrança.`);
  }

  updateUI();
};

function setupEventListeners() {
  // Reorganizar Dia
  const btnReorganize = _doc.getElementById('btn-reorganize-day');
  if (btnReorganize) {
    btnReorganize.addEventListener('click', () => _win.openReorganizeModal());
  }

  // Confirmar Reorganização com opções sem culpa
  const btnConfirmReorg = _doc.getElementById('btn-confirm-reorganize');
  if (btnConfirmReorg) {
    btnConfirmReorg.addEventListener('click', () => {
      const selectedOption = _doc.querySelector('input[name="reorg-option"]:checked')?.value;
      
      if (selectedOption === 'ocio') {
        _win.activateOcioDeliberado();
        return;
      }

      if (selectedOption === 'partial') {
        // Conclusão parcial (+25 XP por ter feito o que foi possível)
        if (!isDemoMode()) {
          const realState = getUserRealState();
          realState.xp = (realState.xp || 0) + 25;
          realState.level = 1 + Math.floor(realState.xp / 100);
          saveUserRealState(realState);
        }
        _doc.getElementById('modal-reorganize')?.classList.add('hidden');
        if (_win.showToast) {
          _win.showToast('+25 XP • Conclusão parcial registrada. Fazer o que é possível hoje já é vitória!', 'success');
        }
        updateUI();
        return;
      }

      if (selectedOption === 'essential') {
        // Reduz tarefas para focar no essencial
        if (currentRoutineData && currentRoutineData.board.days[activeDayKey]) {
          const tasks = currentRoutineData.board.days[activeDayKey].tasks;
          const pending = tasks.filter(t => !t.done);
          if (pending.length > 1) {
            const essentialTasks = tasks.filter((t) => t.done || t.id === pending[0].id);
            essentialTasks.push({
              id: 'rest_today_' + Date.now(),
              title: 'Ócio Deliberado: Pausa Consciente',
              points: 1,
              icon: 'moon',
              time: 'Descanso',
              done: false
            });
            _storage.setItem('ritmo_custom_daily_tasks', JSON.stringify(essentialTasks));
            currentRoutineData.board.days[activeDayKey].tasks = essentialTasks;
          }
        }
        _doc.getElementById('modal-reorganize')?.classList.add('hidden');
        if (_win.showToast) {
          _win.showToast('Prioridades reduzidas com sucesso. Focando no essencial sem sobrecarga!', 'success');
        }
        updateUI();
        return;
      }

      // Default: mover para amanhã (sem perda de XP)
      _doc.getElementById('modal-reorganize')?.classList.add('hidden');
      if (_win.showToast) {
        _win.showToast('Tarefas pendentes organizadas para amanhã. Seu dia mudou e está tudo bem!', 'success');
      }
      updateUI();
    });
  }

  // Configuração das opções de Onboarding
  _doc.querySelectorAll('.onboarding-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      _doc.querySelectorAll(`.onboarding-option[data-group="${group}"]`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}
