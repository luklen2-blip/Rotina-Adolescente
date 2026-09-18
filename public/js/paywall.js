// public/js/paywall.js - Gerenciador do Modal de Bloqueio por Tempo (30 min)
// Rotina do Miguel — Clean Tech Dark Mode

const TRIAL_DURATION_MS = 30 * 60 * 1000; // 30 minutos

export function isRitmoUnlocked() {
  return localStorage.getItem('ritmo_unlocked') === 'true';
}

export function showPaywallModal() {
  const modal = document.getElementById('paywall-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

export function hidePaywallModal() {
  const modal = document.getElementById('paywall-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

export function initPaywallTimer() {
  // Se já está desbloqueado em definitivo, garante que o modal permaneça fechado
  if (isRitmoUnlocked()) {
    hidePaywallModal();
    return;
  }

  // Inicializa carimbo de início da degustação de 30 min
  let trialStart = localStorage.getItem('ritmo_trial_start');
  if (!trialStart) {
    trialStart = Date.now().toString();
    localStorage.setItem('ritmo_trial_start', trialStart);
  }

  const startTime = parseInt(trialStart, 10);
  const elapsed = Date.now() - startTime;

  if (elapsed >= TRIAL_DURATION_MS) {
    showPaywallModal();
  } else {
    hidePaywallModal();
    const remaining = TRIAL_DURATION_MS - elapsed;
    setTimeout(() => {
      if (!isRitmoUnlocked()) {
        showPaywallModal();
      }
    }, remaining);
  }

  // Listener para pressionar 'Enter' no campo de código
  const inputCodigo = document.getElementById('input-codigo');
  if (inputCodigo) {
    inputCodigo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.validarCodigo();
      }
    });
  }
}

// Função global chamada pelo botão 'Ativar' do modal
window.validarCodigo = async function() {
  const input = document.getElementById('input-codigo');
  if (!input) return;
  const rawCode = input.value.trim().toUpperCase();

  if (!rawCode) {
    if (window.showToast) {
      window.showToast('Por favor, insira a chave de acesso recebida.', 'warning');
    } else {
      alert('Por favor, insira a chave de acesso recebida.');
    }
    input.focus();
    return;
  }

  // Chaves mestre válidas e padrão de chave gerada
  const validMasterKeys = ['RITMO2026', 'MIGUEL1990', 'AUTONOMIA', 'SOUNDWORLD', 'VIP2026', 'LUCIANO', 'ADM2026'];
  const isValidPattern = rawCode.startsWith('RTM-') || rawCode.startsWith('KIW-');

  let isValid = validMasterKeys.includes(rawCode) || isValidPattern;


  // Validação via API do servidor (com fallback offline)
  try {
    const res = await fetch('/api/checkout/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: rawCode })
    });
    const json = await res.json();
    if (json.success) {
      isValid = true;
    }
  } catch (err) {
    console.warn('Verificação de chave offline, usando validação client-side:', err);
  }

  if (isValid) {
    localStorage.setItem('ritmo_unlocked', 'true');
    hidePaywallModal();
    if (window.showToast) {
      window.showToast('Acesso Vitalício Ativado com Sucesso! Aproveite o teu ritmo sem limites.', 'success');
    } else {
      alert('Acesso Vitalício Ativado com Sucesso!');
    }
  } else {
    if (window.showToast) {
      window.showToast('Chave de acesso inválida. Verifique o código enviado no seu e-mail após a confirmação do pagamento.', 'error');
    } else {
      alert('Chave de acesso inválida. Verifique o código enviado no seu e-mail após a confirmação do pagamento.');
    }
    input.focus();
  }
};

// Funções utilitárias globais
window.openPaywallModal = showPaywallModal;

window.fecharPaywallSeDegustando = function() {
  if (isRitmoUnlocked()) {
    hidePaywallModal();
    return;
  }
  const trialStart = parseInt(localStorage.getItem('ritmo_trial_start') || '0', 10);
  const elapsed = Date.now() - trialStart;
  if (elapsed < TRIAL_DURATION_MS) {
    hidePaywallModal();
  } else {
    if (window.showToast) {
      window.showToast('O período de degustação de 30 min encerrou. Insira a sua chave de acesso para continuar.', 'warning');
    }
  }
};


window.copiarPix = function() {
  navigator.clipboard.writeText('luklen2@gmail.com').then(() => {
    if (window.showToast) {
      window.showToast('Chave Pix copiada com sucesso: luklen2@gmail.com', 'info');
    }
  }).catch(() => {
    if (window.showToast) {
      window.showToast('Chave Pix: luklen2@gmail.com', 'info');
    }
  });
};

// Auto-inicialização quando o DOM carregar
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPaywallTimer);
  } else {
    initPaywallTimer();
  }
}
