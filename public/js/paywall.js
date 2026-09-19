// public/js/paywall.js - Gerenciador do Período Gratuito Unificado (30 min) e Bloqueio Comercial
// Ritmo Autonomia — Clean Tech Dark Mode

export const TRIAL_DURATION_MS = 30 * 60 * 1000; // 30 minutos unificados
let timerTimeoutId = null;

export function isRitmoUnlocked() {
  return localStorage.getItem('ritmo_unlocked') === 'true';
}

export function getRemainingTrialTimeMs() {
  if (isRitmoUnlocked()) return Infinity;
  const trialStart = parseInt(localStorage.getItem('ritmo_trial_start') || '0', 10);
  if (!trialStart) return TRIAL_DURATION_MS;
  const elapsed = Date.now() - trialStart;
  return Math.max(0, TRIAL_DURATION_MS - elapsed);
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
  if (isRitmoUnlocked()) {
    hidePaywallModal();
    return;
  }

  // Inicializa carimbo inicial da degustação (persistente, não reinicia com F5)
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
    if (timerTimeoutId) clearTimeout(timerTimeoutId);
    timerTimeoutId = setTimeout(() => {
      if (!isRitmoUnlocked()) {
        showPaywallModal();
      }
    }, remaining);
  }

  // Listener para pressionar 'Enter' no campo de código
  const inputCodigo = document.getElementById('input-codigo');
  if (inputCodigo && !inputCodigo._hasEnterListener) {
    inputCodigo._hasEnterListener = true;
    inputCodigo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.validarCodigo();
      }
    });
  }
}

// Validação de chave de acesso
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
  const validMasterKeys = ['RITMO2026', 'MIGUEL1990', 'AUTONOMIA', 'VIP2026', 'LUCIANO', 'ADM2026', 'RITMO'];
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
      window.showToast('Acesso Vitalício Ativado com Sucesso! Aproveite o seu ritmo sem limites.', 'success');
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
      window.showToast('O período de degustação de 30 min encerrou. Desbloqueie o acesso completo para continuar.', 'warning');
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
