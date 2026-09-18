// rewards.js - Gestão de Créditos de Autoria e Autorrecompensas

let currentRewardsState = {
  totalCredits: 120,
  activeGoal: null,
  catalog: []
};

export async function fetchRewards() {
  try {
    const res = await fetch('/api/rewards');
    const json = await res.json();
    if (json.success) {
      currentRewardsState = json.data;
      updateRewardsUI();
    }
  } catch (err) {
    console.error('Erro ao carregar créditos e recompensas:', err);
  }
}

export function updateRewardsUI() {
  const { totalCredits, activeGoal, catalog } = currentRewardsState;

  // Atualiza no cabeçalho
  const headerCount = document.getElementById('header-credits-count');
  if (headerCount) headerCount.innerText = totalCredits;

  // Atualiza no modal de recompensas
  const modalBalance = document.getElementById('modal-rewards-balance');
  if (modalBalance) modalBalance.innerText = `${totalCredits} créditos`;

  // Atualiza barra fixa inferior
  const barTitle = document.getElementById('bar-goal-title');
  const barFraction = document.getElementById('bar-goal-fraction');
  const barFill = document.getElementById('bar-goal-fill');
  const barAction = document.getElementById('btn-bar-action');

  if (activeGoal) {
    barTitle.innerText = activeGoal.title;
    barFraction.innerText = `${totalCredits} / ${activeGoal.targetCredits} pts`;
    const percent = Math.min(100, Math.round((totalCredits / activeGoal.targetCredits) * 100));
    barFill.style.width = `${percent}%`;

    if (totalCredits >= activeGoal.targetCredits) {
      barAction.innerText = 'Resgatar 🎉';
      barAction.classList.remove('neo-btn-primary');
      barAction.classList.add('bg-emerald-500', 'text-slate-950', 'border-emerald-400');
    } else {
      barAction.innerText = 'Ver Acordos';
      barAction.className = 'neo-btn neo-btn-primary text-xs py-2 px-3 shrink-0 whitespace-nowrap';
    }
  } else {
    barTitle.innerText = 'Pactue uma nova autorrecompensa';
    barFraction.innerText = `${totalCredits} pts`;
    barFill.style.width = '0%';
    barAction.innerText = 'Novo Acordo';
  }

  renderRewardsCatalog(catalog, totalCredits);
}

function renderRewardsCatalog(catalog, totalCredits) {
  const list = document.getElementById('rewards-list');
  if (!list) return;

  if (!catalog || catalog.length === 0) {
    list.innerHTML = '<p class="text-xs text-slate-500">Nenhum acordo cadastrado ainda.</p>';
    return;
  }

  list.innerHTML = catalog.map(g => {
    const isReady = totalCredits >= g.targetCredits;
    return `
      <div class="neo-box p-3 flex items-center justify-between gap-3 text-xs ${g.active ? 'border-amber-500/50' : ''}">
        <div>
          <p class="font-bold text-slate-200">${g.title}</p>
          <p class="text-[11px] text-slate-400">Pactuado com: ${g.negotiatedWith || 'Autoacordo'}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-mono font-bold text-amber-300">${g.targetCredits} pts</span>
          ${isReady && !g.claimed ? `
            <button onclick="window.claimReward('${g.id}')" class="neo-btn text-xs py-1 px-2.5 bg-emerald-500 text-slate-950 border-emerald-400 font-bold">
              Resgatar
            </button>
          ` : g.claimed ? `
            <span class="text-xs text-emerald-400 font-semibold">Resgatado ✓</span>
          ` : `
            <span class="text-xs text-slate-500 font-mono">${Math.max(0, g.targetCredits - totalCredits)} faltam</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

window.claimReward = async function(goalId) {
  try {
    const res = await fetch('/api/rewards/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId })
    });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      await fetchRewards();
    } else {
      window.showToast(json.error, 'info');
    }
  } catch (err) {
    window.showToast('Erro ao resgatar recompensa.', 'error');
  }
};

export async function createRewardGoal(title, targetCredits) {
  try {
    const res = await fetch('/api/rewards/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, targetCredits })
    });
    const json = await res.json();
    if (json.success) {
      window.showToast('Novo acordo de autorrecompensa pactuado!', 'success');
      await fetchRewards();
      document.getElementById('modal-rewards').classList.add('hidden');
    }
  } catch (err) {
    window.showToast('Falha ao registrar recompensa.', 'error');
  }
}

// PIX Oficial Modal
export async function loadPixDetails(planType = 'plano_familiar') {
  try {
    const res = await fetch('/api/pix/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType })
    });
    const json = await res.json();
    if (json.success) {
      document.getElementById('pix-plan-name').innerText = `${json.data.plan} (R$ ${json.data.amount.toFixed(2).replace('.', ',')})`;
      document.getElementById('pix-qrcode-img').src = json.data.qrCodeUrl;
      document.getElementById('pix-copia-cola').value = json.data.copiaECola;
    }
  } catch (err) {
    console.error('Erro ao gerar PIX:', err);
  }
}
