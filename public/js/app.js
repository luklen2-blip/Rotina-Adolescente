// app.js - Orquestrador principal do Ritmo (Autonomia através da Autoria)

import { renderSlots } from './timeline.js';
import { setupCheckinHandlers, updateCheckinUI } from './checkin.js';
import { fetchRewards, updateRewardsUI, createRewardGoal, loadPixDetails } from './rewards.js';

window.fetchRewards = fetchRewards;

let currentDate = new Date().toISOString().split('T')[0];

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Formatação elegante de data em português
function formatDisplayDate(dateStr) {
  const today = getTodayString();
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const dayOfWeek = weekDays[targetDate.getDay()];
  const monthName = months[targetDate.getMonth()];

  if (dateStr === today) {
    return `Hoje, ${day} de ${monthName}`;
  }

  // Comparações de ontem / amanhã
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((targetDate - todayDate) / (1000 * 60 * 60 * 24));

  if (diffDays === -1) return `Ontem (${dayOfWeek}), ${day} de ${monthName}`;
  if (diffDays === 1) return `Amanhã (${dayOfWeek}), ${day} de ${monthName}`;

  return `${dayOfWeek}, ${day} de ${monthName}`;
}

// Sistema de Toasts Empáticos e Não-Punitivos
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  let iconName = 'info';
  let accentColor = 'text-indigo-400';
  if (type === 'success') {
    iconName = 'check-circle';
    accentColor = 'text-emerald-400';
  } else if (type === 'error') {
    iconName = 'alert-triangle';
    accentColor = 'text-rose-400';
  }

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 shrink-0 ${accentColor}"></i>
    <div class="flex-1 text-xs text-slate-200 leading-snug">${message}</div>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Carrega dados do perfil e do território
async function loadTerritoryProfile() {
  try {
    const res = await fetch('/api/territory');
    const json = await res.json();
    if (json.success) {
      const { displayName, subtitle } = json.data;
      document.getElementById('user-territory-title').innerText = displayName;
      document.getElementById('user-territory-subtitle').innerText = subtitle;
      document.getElementById('user-avatar-text').innerText = (displayName.replace('Território de ', '').charAt(0) || 'M').toUpperCase();
    }
  } catch (err) {
    console.error('Erro ao carregar perfil do território:', err);
  }
}

// Atualiza o dia completo
export async function refreshDayData() {
  try {
    const res = await fetch(`/api/day/${currentDate}`);
    const json = await res.json();
    if (json.success) {
      const day = json.data;

      // Renderiza slots da timeline
      const slotsContainer = document.getElementById('slots-container');
      renderSlots(day.timelineSlots, slotsContainer, currentDate);

      // Atualiza Check-in Afetivo
      updateCheckinUI(day.affectiveCheckIn);

      // Atualiza Microdiário
      const decompInput = document.getElementById('decompression-input');
      if (decompInput) {
        decompInput.value = day.decompressionPad?.microDiary || '';
      }
    }
  } catch (err) {
    console.error('Erro ao carregar rotina do dia:', err);
  }
}
window.refreshDayData = refreshDayData;

// Inicialização da Aplicação ao Carregar o DOM
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializa ícones Lucide
  if (window.lucide) window.lucide.createIcons();

  // Atualiza label da data
  document.getElementById('current-day-label').innerText = formatDisplayDate(currentDate);

  // Inicializa controladores
  await loadTerritoryProfile();
  await refreshDayData();
  await fetchRewards();

  setupCheckinHandlers(() => currentDate);

  // Navegação de Dias
  document.getElementById('btn-prev-day').addEventListener('click', () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    currentDate = date.toISOString().split('T')[0];
    document.getElementById('current-day-label').innerText = formatDisplayDate(currentDate);
    refreshDayData();
  });

  document.getElementById('btn-next-day').addEventListener('click', () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    currentDate = date.toISOString().split('T')[0];
    document.getElementById('current-day-label').innerText = formatDisplayDate(currentDate);
    refreshDayData();
  });

  // Botão Adicionar Novo Bloco na Timeline
  document.getElementById('btn-add-slot').addEventListener('click', async () => {
    try {
      const res = await fetch(`/api/day/${currentDate}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customTitle: 'Novo momento do meu dia',
          startTime: '14:00',
          endTime: '15:00',
          internalState: 'foco_leve'
        })
      });
      const json = await res.json();
      if (json.success) {
        window.showToast('Novo espaço de tempo aberto na sua rotina.', 'success');
        refreshDayData();
      }
    } catch (err) {
      window.showToast('Falha ao abrir novo bloco.', 'error');
    }
  });

  // Microdiário (Válvula de Escape) - Salvar
  const btnSaveDecomp = document.getElementById('btn-save-decompression');
  if (btnSaveDecomp) {
    btnSaveDecomp.addEventListener('click', async () => {
      const input = document.getElementById('decompression-input');
      const microDiary = input.value.trim();
      try {
        const res = await fetch(`/api/day/${currentDate}/decompression`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ microDiary })
        });
        const json = await res.json();
        if (json.success) {
          window.showToast(json.message, 'success');
          const status = document.getElementById('decompression-status');
          if (status) status.innerText = 'Pensamento protegido no cofre.';
        }
      } catch (err) {
        window.showToast('Erro ao salvar descompressão.', 'error');
      }
    });
  }

  // Modais - Fechamento universal
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.add('hidden'));
    });
  });

  // Abertura de Modais
  document.getElementById('btn-open-rewards').addEventListener('click', () => {
    document.getElementById('modal-rewards').classList.remove('hidden');
  });
  document.getElementById('btn-bar-action').addEventListener('click', () => {
    document.getElementById('modal-rewards').classList.remove('hidden');
  });
  document.getElementById('btn-open-evening-checkin').addEventListener('click', () => {
    document.getElementById('modal-evening').classList.remove('hidden');
  });

  // Modal de Território
  const openTerritoryModal = () => {
    const currentTitle = document.getElementById('user-territory-title').innerText;
    const currentSub = document.getElementById('user-territory-subtitle').innerText;
    document.getElementById('input-territory-title').value = currentTitle;
    document.getElementById('input-territory-subtitle').value = currentSub;
    document.getElementById('modal-territory').classList.remove('hidden');
  };
  document.getElementById('btn-edit-profile').addEventListener('click', openTerritoryModal);
  document.getElementById('btn-edit-title-quick').addEventListener('click', openTerritoryModal);

  document.getElementById('btn-save-territory').addEventListener('click', async () => {
    const displayName = document.getElementById('input-territory-title').value.trim();
    const subtitle = document.getElementById('input-territory-subtitle').value.trim();
    try {
      const res = await fetch('/api/territory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, subtitle })
      });
      const json = await res.json();
      if (json.success) {
        window.showToast('Território personalizado com sucesso!', 'success');
        await loadTerritoryProfile();
        document.getElementById('modal-territory').classList.add('hidden');
      }
    } catch (err) {
      window.showToast('Erro ao atualizar território.', 'error');
    }
  });

  // Criar nova meta no modal de recompensas
  document.getElementById('btn-create-reward').addEventListener('click', async () => {
    const title = document.getElementById('new-reward-title').value.trim();
    const targetCredits = Number(document.getElementById('new-reward-pts').value);
    if (!title || !targetCredits) {
      return window.showToast('Preencha o nome da recompensa e os créditos.', 'error');
    }
    await createRewardGoal(title, targetCredits);
    document.getElementById('new-reward-title').value = '';
    document.getElementById('new-reward-pts').value = '';
  });

  // Links Legais e PIX
  document.getElementById('link-termos').addEventListener('click', () => window.openLegalModal('termos'));
  document.getElementById('link-privacidade').addEventListener('click', () => window.openLegalModal('privacidade'));
  document.getElementById('btn-open-menu').addEventListener('click', () => window.openLegalModal('termos'));

  const openPixModal = async () => {
    document.getElementById('modal-pix').classList.remove('hidden');
    await loadPixDetails('plano_familiar');
  };
  document.getElementById('link-pix-apoio').addEventListener('click', openPixModal);

  // Botões de planos PIX
  document.querySelectorAll('.pix-plan-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.pix-plan-btn').forEach(b => b.classList.remove('active', 'bg-indigo-600', 'text-white'));
      btn.classList.add('active', 'bg-indigo-600', 'text-white');
      await loadPixDetails(btn.dataset.plan);
    });
  });

  // Copiar código PIX
  document.getElementById('btn-copy-pix').addEventListener('click', () => {
    const input = document.getElementById('pix-copia-cola');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
      window.showToast('Código PIX Copia-e-Cola copiado para a área de transferência!', 'success');
    });
  });
});
