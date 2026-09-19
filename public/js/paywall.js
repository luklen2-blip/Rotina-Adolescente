// Proteção para ambiente Node.js de testes
const _win = typeof window !== 'undefined' ? window : globalThis;
const _doc = typeof document !== 'undefined' ? document : {
  getElementById: () => null
};
const _storage = typeof localStorage !== 'undefined' ? localStorage : {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};
// public/js/paywall.js - Gerenciador do Período Gratuito Unificado (30 min) e Bloqueio Comercial
// Ritmo Autonomia — Clean Tech Dark Mode

export const TRIAL_DURATION_MS = 30 * 60 * 1000; // 30 minutos unificados
let timerTimeoutId = null;

export function isRitmoUnlocked() {
  return _storage.getItem('ritmo_unlocked') === 'true';
}

export function getRemainingTrialTimeMs() {
  if (isRitmoUnlocked()) return Infinity;
  const trialStart = parseInt(_storage.getItem('ritmo_trial_start') || '0', 10);
  if (!trialStart) return TRIAL_DURATION_MS;
  const elapsed = Date.now() - trialStart;
  return Math.max(0, TRIAL_DURATION_MS - elapsed);
}

export function showPaywallModal() {
  const modal = _doc.getElementById('paywall-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }
}

export function hidePaywallModal() {
  const modal = _doc.getElementById('paywall-modal');
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
  let trialStart = _storage.getItem('ritmo_trial_start');
  if (!trialStart) {
    trialStart = Date.now().toString();
    _storage.setItem('ritmo_trial_start', trialStart);
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
  const inputCodigo = _doc.getElementById('input-codigo');
  if (inputCodigo && !inputCodigo._hasEnterListener) {
    inputCodigo._hasEnterListener = true;
    inputCodigo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        _win.validarCodigo();
      }
    });
  }
}

// Validação de chave de acesso
_win.validarCodigo = async function() {
  const input = _doc.getElementById('input-codigo');
  if (!input) return;
  const rawCode = input.value.trim().toUpperCase();

  if (!rawCode) {
    if (_win.showToast) {
      _win.showToast('Por favor, insira a chave de acesso recebida.', 'warning');
    } else {
      alert('Por favor, insira a chave de acesso recebida.');
    }
    input.focus();
    return;
  }

  // Chaves mestre válidas e padrão de chave gerada
  const validMasterKeys = ['RITMO2026', 'PROMO1990', 'AUTONOMIA', 'VIP2026', 'LUCIANO', 'ADM2026', 'RITMO'];
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
    _storage.setItem('ritmo_unlocked', 'true');
    hidePaywallModal();
    if (_win.showToast) {
      _win.showToast('Acesso Vitalício Ativado com Sucesso! Aproveite o seu ritmo sem limites.', 'success');
    } else {
      alert('Acesso Vitalício Ativado com Sucesso!');
    }
  } else {
    if (_win.showToast) {
      _win.showToast('Chave de acesso inválida. Verifique o código enviado no seu e-mail após a confirmação do pagamento.', 'error');
    } else {
      alert('Chave de acesso inválida. Verifique o código enviado no seu e-mail após a confirmação do pagamento.');
    }
    input.focus();
  }
};

_win.openPaywallModal = showPaywallModal;

_win.fecharPaywallSeDegustando = function() {
  if (isRitmoUnlocked()) {
    hidePaywallModal();
    return;
  }
  const trialStart = parseInt(_storage.getItem('ritmo_trial_start') || '0', 10);
  const elapsed = Date.now() - trialStart;

  if (elapsed < TRIAL_DURATION_MS) {
    hidePaywallModal();
  } else {
    if (_win.showToast) {
      _win.showToast('O período de degustação de 30 min encerrou. Desbloqueie o acesso completo para continuar.', 'warning');
    }
  }
};

_win.copiarPix = function() {
  navigator.clipboard.writeText('luklen2@gmail.com').then(() => {
    if (_win.showToast) {
      _win.showToast('Chave Pix copiada com sucesso: luklen2@gmail.com', 'info');
    }
  }).catch(() => {
    if (_win.showToast) {
      _win.showToast('Chave Pix: luklen2@gmail.com', 'info');
    }
  });
};

_win.copiarPixCopiaECola = function() {
  const payload = '00020126390014br.gov.bcb.pix0117luklen2@gmail.com520400005303986540519.905802BR5917LUCIANO SANT ANNA6009SAO PAULO62110507RTM199063046636';
  const input = _doc.getElementById('pix-copia-cola-input');
  if (input && input.select) {
    input.select();
  }
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(payload).then(() => {
      if (_win.showToast) {
        _win.showToast('Código Pix Copia e Cola copiado com sucesso!', 'success');
      } else {
        alert('Código Pix Copia e Cola copiado com sucesso!');
      }
    }).catch(() => {
      if (input && typeof document !== 'undefined') {
        input.select();
        document.execCommand('copy');
      }
      if (_win.showToast) {
        _win.showToast('Código Pix Copia e Cola copiado!', 'success');
      }
    });
  } else {
    if (input && typeof document !== 'undefined') {
      input.select();
      document.execCommand('copy');
    }
    if (_win.showToast) {
      _win.showToast('Código Pix Copia e Cola copiado!', 'success');
    }
  }
};

// Auto-inicialização quando o DOM carregar
if (typeof document !== 'undefined') {
  if (_doc.readyState === 'loading') {
    _doc.addEventListener('DOMContentLoaded', initPaywallTimer);
  } else {
    initPaywallTimer();
  }
}
