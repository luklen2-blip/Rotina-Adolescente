// timeline.js - Renderização e interação do Trilho Temporal Editável

const STATE_CONFIG = {
  recarregando: { label: 'Recarregando', icon: 'zap', cssClass: 'tag-recarregando' },
  exige_energia: { label: 'Exige Energia', icon: 'flame', cssClass: 'tag-exige_energia' },
  ocio_deliberado: { label: 'Ócio Deliberado', icon: 'coffee', cssClass: 'tag-ocio_deliberado' },
  foco_leve: { label: 'Foco Leve', icon: 'compass', cssClass: 'tag-foco_leve' },
  piloto_automatico: { label: 'Piloto Automático', icon: 'shield', cssClass: 'tag-piloto_automatico' }
};

export function renderSlots(slots, containerEl, currentDate) {
  if (!containerEl) return;

  if (!slots || slots.length === 0) {
    containerEl.innerHTML = `
      <div class="neo-box p-6 text-center text-slate-400 space-y-2">
        <p class="font-bold text-slate-300">Nenhum bloco agendado para este dia.</p>
        <p class="text-xs">Seu tempo está em branco para você desenhar o ritmo que quiser.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  containerEl.innerHTML = slots.map(slot => {
    const stateInfo = STATE_CONFIG[slot.internalState] || STATE_CONFIG.piloto_automatico;
    const isDone = slot.status === 'feito';
    const isPartial = slot.status === 'parcial';
    const isRescheduled = slot.status === 'reorganizado_amanha';

    let cardStatusClass = '';
    if (isDone) cardStatusClass = 'status-feito';
    else if (isPartial) cardStatusClass = 'status-parcial';
    else if (isRescheduled) cardStatusClass = 'status-reorganizado';

    return `
      <div class="slot-card neo-box p-3.5 relative space-y-2.5 transition-all ${cardStatusClass}" data-slot-id="${slot.id}">
        <!-- Marcador no trilho vertical -->
        <span class="slot-dot"></span>

        <!-- Cabeçalho do Bloco: Horário + Estado Interno + Exclusão -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Seletor de Horário -->
            <div class="flex items-center gap-1 text-xs font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <input type="time" value="${slot.timeRange.start}" class="bg-transparent text-slate-200 outline-none text-xs w-14" 
                onchange="window.updateSlotTime('${currentDate}', '${slot.id}', this.value, null)" />
              <span class="text-slate-600">→</span>
              <input type="time" value="${slot.timeRange.end}" class="bg-transparent text-slate-200 outline-none text-xs w-14" 
                onchange="window.updateSlotTime('${currentDate}', '${slot.id}', null, this.value)" />
            </div>

            <!-- Seletor de Estado Afetivo -->
            <select class="tag-badge ${stateInfo.cssClass} bg-transparent outline-none cursor-pointer py-1"
              onchange="window.updateSlotState('${currentDate}', '${slot.id}', this.value)">
              <option value="recarregando" class="bg-slate-900 text-slate-200" ${slot.internalState === 'recarregando' ? 'selected' : ''}>● Recarregando</option>
              <option value="exige_energia" class="bg-slate-900 text-slate-200" ${slot.internalState === 'exige_energia' ? 'selected' : ''}>▲ Exige Energia</option>
              <option value="ocio_deliberado" class="bg-slate-900 text-slate-200" ${slot.internalState === 'ocio_deliberado' ? 'selected' : ''}>■ Ócio Deliberado</option>
              <option value="foco_leve" class="bg-slate-900 text-slate-200" ${slot.internalState === 'foco_leve' ? 'selected' : ''}>⚡ Foco Leve</option>
              <option value="piloto_automatico" class="bg-slate-900 text-slate-200" ${slot.internalState === 'piloto_automatico' ? 'selected' : ''}>◎ Piloto Automático</option>
            </select>
          </div>

          <!-- Ação de Liberar Bloco -->
          <button onclick="window.deleteSlot('${currentDate}', '${slot.id}')" class="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors" title="Liberar este espaço">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Título Aberto de Autoria (Nomeie como quiser) -->
        <div>
          <input type="text" value="${escapeHtml(slot.customTitle)}" 
            class="title-input text-sm" 
            placeholder="Nomeie este bloco como você quiser..."
            onblur="window.updateSlotTitle('${currentDate}', '${slot.id}', this.value)"
            onkeydown="if(event.key==='Enter') this.blur()" />
        </div>

        <!-- Botões de Status Não-Punitivos -->
        <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button onclick="window.setSlotStatus('${currentDate}', '${slot.id}', 'feito')" 
              class="neo-btn neo-btn-done text-xs py-1 px-2.5 ${isDone ? 'active' : ''}">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> Feito (+10)
            </button>

            <button onclick="window.setSlotStatus('${currentDate}', '${slot.id}', 'parcial')" 
              class="neo-btn neo-btn-partial text-xs py-1 px-2.5 ${isPartial ? 'active' : ''}">
              <i data-lucide="minus" class="w-3.5 h-3.5"></i> Parcial (+5)
            </button>

            <button onclick="window.setSlotStatus('${currentDate}', '${slot.id}', 'reorganizado_amanha')" 
              class="neo-btn neo-btn-reschedule text-xs py-1 px-2.5 ${isRescheduled ? 'active' : ''}">
              <i data-lucide="corner-up-right" class="w-3.5 h-3.5"></i> Reorganizar ↷
            </button>
          </div>

          ${slot.status && slot.status !== 'pendente' ? `
            <button onclick="window.setSlotStatus('${currentDate}', '${slot.id}', 'pendente')" class="text-[11px] text-slate-500 hover:text-slate-300 underline">
              Reabrir
            </button>
          ` : ''}
        </div>

        <!-- Micro-reflexão Opcional de 1 Linha -->
        <div class="pt-1">
          <input type="text" value="${escapeHtml(slot.reflectionMicroNote || '')}" 
            placeholder="Anotação breve: como fluiu? (opcional)"
            class="reflection-input text-xs"
            onblur="window.updateSlotReflection('${currentDate}', '${slot.id}', this.value)" />
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Manipuladores globais disparados inline
window.updateSlotTitle = async function(date, slotId, customTitle) {
  try {
    await fetch(`/api/day/${date}/slots/${slotId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customTitle })
    });
  } catch (err) {
    console.error('Erro ao atualizar título do bloco:', err);
  }
};

window.updateSlotTime = async function(date, slotId, startTime, endTime) {
  try {
    const payload = {};
    if (startTime) payload.startTime = startTime;
    if (endTime) payload.endTime = endTime;
    await fetch(`/api/day/${date}/slots/${slotId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Erro ao atualizar horário do bloco:', err);
  }
};

window.updateSlotState = async function(date, slotId, internalState) {
  try {
    await fetch(`/api/day/${date}/slots/${slotId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internalState })
    });
    window.refreshDayData();
  } catch (err) {
    console.error('Erro ao atualizar estado afetivo:', err);
  }
};

window.updateSlotReflection = async function(date, slotId, reflectionMicroNote) {
  try {
    await fetch(`/api/day/${date}/slots/${slotId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reflectionMicroNote })
    });
  } catch (err) {
    console.error('Erro ao salvar micro-reflexão:', err);
  }
};

window.setSlotStatus = async function(date, slotId, status) {
  try {
    const res = await fetch(`/api/day/${date}/slots/${slotId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      window.refreshDayData();
      if (window.fetchRewards) window.fetchRewards();
    }
  } catch (err) {
    window.showToast('Erro ao atualizar status do bloco.', 'error');
  }
};

window.deleteSlot = async function(date, slotId) {
  if (!confirm('Deseja liberar este espaço de tempo na sua rotina?')) return;
  try {
    const res = await fetch(`/api/day/${date}/slots/${slotId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'info');
      window.refreshDayData();
    }
  } catch (err) {
    window.showToast('Erro ao remover bloco.', 'error');
  }
};
