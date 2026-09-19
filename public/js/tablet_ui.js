// tablet_ui.js - Controlador da Interface Clean Tech Dark Mode (Ritmo Autonomia V2)
// "Sua rotina. Seu ritmo. Sua autonomia."

let currentRoutineData = null;
let activeDayKey = 'terca'; // Terça ativa por padrão
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
  checkOnboardingStatus();
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
  if (titleEl) titleEl.innerHTML = `ROTINA DO <span class="text-glow-lime">${(profile.name || 'MIGUEL').toUpperCase()}</span>`;

  const xpEl = document.getElementById('xp-level-display');
  if (xpEl) xpEl.innerText = `NÍVEL DE XP: ${xpLevel}`;

  const pointsEl = document.getElementById('saldo-points-display');
  if (pointsEl) pointsEl.innerText = `SALDO: ${points} PONTOS`;

  // 2. Card de Destaque Prioritário: PRÓXIMA ATIVIDADE & PROGRESSO DO DIA
  renderNextActivitySection();

  // 3. Barra de Nível e XP Comercial (NÍVEL 12 - 72% - 155 XP para o próximo nível)
  renderXPLevelProgress(points, xpLevel);

  // 4. Timeline do Dia Ativo
  renderDayCarousel();
  renderTimelineSlots(activeDayKey);

  // 5. Barra de Conquistas e Marcos (Milestones)
  renderMilestonesBar(points);

  // 6. Humor e Reflexão
  updateMoodUI();
  updateReflectionUI();

  if (window.lucide) window.lucide.createIcons();
}

// Renderiza a Próxima Atividade com foco imediato e barra de progresso do dia
function renderNextActivitySection() {
  const container = document.getElementById('next-activity-container');
  if (!container || !currentRoutineData) return;

  const day = currentRoutineData.board.days[activeDayKey];
  const tasks = day?.tasks || [];
  const nextTask = tasks.find(t => !t.done);
  const doneCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Atualiza barra de progresso do dia
  const progressText = document.getElementById('daily-progress-text');
  if (progressText) {
    progressText.innerText = `Progresso do dia: ${doneCount} de ${totalCount} concluídas (${progressPct}%)`;
  }
  const progressBar = document.getElementById('daily-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progressPct}%`;
  }

  if (!nextTask) {
    container.innerHTML = `
      <div class="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-2">
        <span class="inline-block p-2 rounded-full bg-emerald-500/20 text-emerald-400 text-xl">🎉</span>
        <h3 class="text-base font-bold text-white">Todas as atividades de hoje foram concluídas no teu ritmo!</h3>
        <p class="text-xs text-slate-400">Excelente consistência. Aproveite o restante do dia com tranquilidade ou ative o Ócio Deliberado.</p>
        <button onclick="window.openReorganizeModal()" class="mt-2 text-xs font-semibold text-cyan-400 hover:underline">
          Ajustar agenda de amanhã
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="next-activity-card p-4 sm:p-5 space-y-3">
      <div class="flex items-center justify-between">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          PRÓXIMA ATIVIDADE EM FOCO
        </span>
        <span class="text-xs font-mono font-bold text-lime-400 bg-lime-950/60 px-2 py-0.5 rounded-md border border-lime-500/30">
          +50 XP
        </span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div class="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-cyan-400"></i>
            Horário previsto: <strong class="text-white font-mono">${nextTask.time || 'Em andamento'}</strong>
          </div>
          <h3 class="text-base sm:text-lg font-black text-white uppercase tracking-tight mt-0.5">
            ${nextTask.title}
          </h3>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button onclick="window.completeNextActivity('${nextTask.id}')" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-lime-400 text-slate-950 font-extrabold text-xs tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5">
            <i data-lucide="check" class="w-4 h-4"></i>
            Concluir Atividade (+50 XP)
          </button>
          <button onclick="window.openReorganizeModal()" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition hover:bg-slate-800" title="Ajustar horário sem punição">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Conclusão com 1 toque da próxima atividade
window.completeNextActivity = async function(taskId) {
  await window.toggleCleanTechTask(activeDayKey, taskId);
};

// Renderiza a barra de XP detalhada
function renderXPLevelProgress(points, level) {
  const levelTitle = document.getElementById('gamification-level-title');
  const levelFill = document.getElementById('gamification-bar-fill');
  const levelSub = document.getElementById('gamification-level-sub');

  const pointsInCurrentLevel = points % 30;
  const pct = Math.min(100, Math.round((pointsInCurrentLevel / 30) * 100));
  const xpNeeded = (30 - pointsInCurrentLevel) * 5;

  if (levelTitle) {
    levelTitle.innerText = `NÍVEL ${level}`;
  }
  if (levelFill) {
    levelFill.style.width = `${pct}%`;
  }
  if (levelSub) {
    levelSub.innerText = `${pct}% • ${xpNeeded} XP para o próximo nível`;
  }
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
  renderNextActivitySection();
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
    const isDone = task.done;
    const isFocusActive = !isDone && (day.tasks.findIndex(t => !t.done) === idx);

    return `
      <div class="relative pl-6">
        <!-- Nó da Timeline -->
        <span class="track-node ${isFocusActive ? 'active-node' : ''} ${isDone ? 'border-cyan-400 bg-cyan-400' : ''}"></span>

        <!-- Card Modular -->
        <div class="timeline-slot-card flex items-center justify-between gap-3 ${isFocusActive ? 'active-focus' : ''} ${isDone ? 'is-done' : ''}"
             onclick="window.toggleCleanTechTask('${dayKey}', '${task.id}')">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Ícone da Atividade -->
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isFocusActive ? 'bg-lime-950/60 text-lime-400 border border-lime-400/40' : isDone ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800' : 'bg-slate-900/80 text-slate-400 border border-slate-800'}">
              <i data-lucide="${getTaskIcon(task.icon, task.title)}" class="w-4 h-4"></i>
            </div>

            <!-- Horário e Nome -->
            <div class="min-w-0">
              <p class="text-[11px] font-mono font-semibold ${isFocusActive ? 'text-lime-300' : isDone ? 'text-cyan-400' : 'text-slate-400'}">
                ${task.time || getDefaultTime(idx)}
              </p>
              <h4 class="text-xs sm:text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}">
                ${task.title.toUpperCase()}
              </h4>
            </div>
          </div>

          <!-- Badge de Pontos / Status -->
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg ${isFocusActive ? 'text-lime-400 bg-lime-950/50 border border-lime-500/40' : isDone ? 'text-cyan-300 bg-cyan-950/50 border border-cyan-500/40' : 'text-slate-300 bg-slate-900 border border-slate-800'}">
              ${isDone ? '✓ Concluído' : `+${task.points || 5}P`}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getTaskIcon(icon, title) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('skate') || lower.includes('esporte') || lower.includes('futebol') || lower.includes('treino')) return 'activity';
  if (lower.includes('leitura') || lower.includes('ler') || lower.includes('livro')) return 'book-open';
  if (lower.includes('gaming') || lower.includes('lazer') || lower.includes('jogo')) return 'gamepad-2';
  if (lower.includes('dormir') || lower.includes('desconexão') || lower.includes('descanso') || lowerócio(lower)) return 'moon';
  if (lower.includes('escola') || lower.includes('estudo') || lower.includes('foco')) return 'graduation-cap';
  if (lower.includes('kumon') || lower.includes('reforço')) return 'edit-3';
  return 'circle-dot';
}

function lowerócio(str) {
  return str.includes('ócio') || str.includes('pausa');
}

function getDefaultTime(idx) {
  const times = ['17:30', '19:00', '21:30', '22:30', '08:00', '14:00', '16:00', '20:00'];
  return times[idx % times.length];
}

// Toggle de Atividade com feedback gamificado de alta qualidade
window.toggleCleanTechTask = async function(dayKey, taskId) {
  try {
    const res = await fetch('/api/routine/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayKey, taskId })
    });
    const json = await res.json();
    if (json.success) {
      if (json.pointsDiff > 0) {
        showVisualFeedback('+50 XP', 'Atividade concluída', 'Você avançou mais um passo.');
      } else {
        if (window.showToast) {
          window.showToast('Tarefa marcada como pendente.', 'info');
        }
      }
      await fetchCleanTechData();
    }
  } catch (err) {
    console.error('Erro ao alternar tarefa:', err);
  }
};

// Feedback visual ao concluir tarefas (não infantilizado)
function showVisualFeedback(xpText, title, subtitle) {
  if (window.showToast) {
    window.showToast(`${xpText} • ${title} — ${subtitle}`, 'success');
  }
}

// Renderiza a Barra de Progresso com os Milestones
function renderMilestonesBar(currentPoints) {
  const barFill = document.getElementById('milestone-bar-fill');
  const targetLabel = document.getElementById('milestone-target-label');
  const milestonesContainer = document.getElementById('milestones-icons-row');

  const nextTarget = MILESTONES.find(m => currentPoints < m.points) || MILESTONES[MILESTONES.length - 1];
  const maxScale = 1000;
  const percent = Math.min(100, Math.round((currentPoints / maxScale) * 100));

  if (barFill) barFill.style.width = `${percent}%`;
  if (targetLabel) {
    targetLabel.innerText = `PRÓXIMO MARCO: ${nextTarget.points}P ${nextTarget.label} (${currentPoints}/${nextTarget.points})`;
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

// Humor Pós-Tarefa (não diagnóstico, focado em percepção pessoal)
window.selectMood = function(mood) {
  activeMood = mood;
  updateMoodUI();
  const labels = { 
    foco_total: 'Foco Total registrado! Excelente presença.', 
    cansado: 'Cansaço acolhido. Respeite o teu ritmo e desacelere se necessário.', 
    relaxado: 'Modo relaxado registrado. Fluindo com tranquilidade.' 
  };
  if (window.showToast) {
    window.showToast(labels[mood] || 'Percepção registrada!', 'success');
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
    window.showToast(`Reflexão: "${tag}" anotada com sucesso.`, 'success');
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

// Reorganização sem Culpa (Core Differentiator)
window.openReorganizeModal = function() {
  const modal = document.getElementById('modal-reorganize');
  if (modal) modal.classList.remove('hidden');
};

// Ativação do Ócio Deliberado (Descanso Consciente)
window.activateOcioDeliberado = async function() {
  try {
    const res = await fetch('/api/routine/bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        points: 5, 
        reason: 'Ócio Deliberado: Descanso Consciente Protegido' 
      })
    });
    const json = await res.json();
    if (json.success) {
      document.getElementById('modal-reorganize')?.classList.add('hidden');
      if (window.showToast) {
        window.showToast('Ócio Deliberado ativado com sucesso (+5P). Descansar faz parte de uma rotina saudável!', 'success');
      }
      await fetchCleanTechData();
    }
  } catch (err) {
    console.error('Erro ao ativar Ócio Deliberado:', err);
  }
};

// Onboarding: "Descubra Seu Ritmo"
function checkOnboardingStatus() {
  const done = localStorage.getItem('ritmo_onboarding_done');
  if (!done) {
    // Abre automaticamente no primeiro acesso
    setTimeout(() => {
      window.openOnboardingModal();
    }, 400);
  }
}

window.openOnboardingModal = function() {
  const modal = document.getElementById('modal-onboarding');
  if (modal) modal.classList.remove('hidden');
};

window.closeOnboardingModal = function() {
  const modal = document.getElementById('modal-onboarding');
  if (modal) modal.classList.add('hidden');
};

window.skipOnboarding = function() {
  localStorage.setItem('ritmo_onboarding_done', 'true');
  window.closeOnboardingModal();
  if (window.showToast) {
    window.showToast('Você pode descobrir seu ritmo a qualquer momento clicando no botão do topo!', 'info');
  }
};

// Salvar respostas do onboarding e adaptar a rotina
window.saveOnboardingPreferences = function() {
  const selectedFocus = document.querySelector('.onboarding-option[data-group="focus"].selected')?.dataset.value || 'Minha rotina';
  const selectedTime = document.querySelector('.onboarding-option[data-group="time"].selected')?.dataset.value || 'Normal';
  const selectedEnergy = document.querySelector('.onboarding-option[data-group="energy"].selected')?.dataset.value || 'Média';

  const preferences = { focus: selectedFocus, time: selectedTime, energy: selectedEnergy };
  localStorage.setItem('ritmo_user_profile', JSON.stringify(preferences));
  localStorage.setItem('ritmo_onboarding_done', 'true');

  window.closeOnboardingModal();

  // Adaptação imediata do dia
  if (selectedEnergy === 'Baixa' || selectedTime === 'Pouco') {
    window.selectMood('cansado');
    if (window.showToast) {
      window.showToast(`Ritmo Suave ativado para hoje (${selectedFocus} • Energia ${selectedEnergy}). Sem sobrecarga!`, 'success');
    }
  } else if (selectedEnergy === 'Alta') {
    window.selectMood('foco_total');
    if (window.showToast) {
      window.showToast(`Ritmo de Alto Foco ativado (${selectedFocus} • Energia Alta). Excelente momento para avançar!`, 'success');
    }
  } else {
    window.selectMood('relaxado');
    if (window.showToast) {
      window.showToast(`Ritmo equilibrado gerado com sucesso para ${selectedFocus}!`, 'success');
    }
  }

  fetchCleanTechData();
};

function setupEventListeners() {
  // Reorganizar Dia
  const btnReorganize = document.getElementById('btn-reorganize-day');
  if (btnReorganize) {
    btnReorganize.addEventListener('click', () => window.openReorganizeModal());
  }

  // Confirmar Reorganização padrão
  const btnConfirmReorg = document.getElementById('btn-confirm-reorganize');
  if (btnConfirmReorg) {
    btnConfirmReorg.addEventListener('click', () => {
      const selectedOption = document.querySelector('input[name="reorg-option"]:checked')?.value;
      if (selectedOption === 'ocio') {
        window.activateOcioDeliberado();
      } else {
        document.getElementById('modal-reorganize').classList.add('hidden');
        if (window.showToast) {
          window.showToast('Vamos reorganizar. Seu dia mudou e você pode continuar amanhã com tranquilidade!', 'success');
        }
      }
    });
  }

  // Configuração das opções de Onboarding
  document.querySelectorAll('.onboarding-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const group = btn.dataset.group;
      document.querySelectorAll(`.onboarding-option[data-group="${group}"]`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}
