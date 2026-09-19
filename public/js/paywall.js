// public/js/paywall.js - Gerenciador do Modal de Bloqueio por Tempo
// Padrão Público: 30 min | Modo Exclusivo Luciano: 1 hora (60 min)
// Ritmo Autonomia — Clean Tech Dark Mode

const DEFAULT_TRIAL_DURATION_MS = 30 * 60 * 1000; // 30 minutos (Padrão Público)
const LUCIANO_TRIAL_DURATION_MS = 60 * 60 * 1000;  // 60 minutos (1 hora exclusiva para Luciano)

let timerTimeoutId = null;

export function isRitmoUnlocked() {
  return localStorage.getItem('ritmo_unlocked') === 'true';
}

export function is1hTestActive() {
  return localStorage.getItem('ritmo_teste_1h') === 'true';
}

export function getTrialDurationMs() {
  return is1hTestActive() ? LUCIANO_TRIAL_DURATION_MS : DEFAULT_TRIAL_DURATION_MS;
}

export function showPaywallModal() {
  const modal = document.getElementById('paywall-modal');
  if (modal) {
    updatePaywallUI();
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

export function updatePaywallUI() {
  const is1h = is1hTestActive();

  // 1. Atualizar badge do modal de paywall
  const paywallBadge = document.getElementById('paywall-trial-badge');
  if (paywallBadge) {
    if (is1h) {
      paywallBadge.textContent = 'Período de Degustação Concluído (1 hora)';
      paywallBadge.className = 'inline-block rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-xs font-semibold text-cyan-300';
    } else {
      paywallBadge.textContent = 'Período de Degustação Concluído (30 min)';
      paywallBadge.className = 'inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400';
    }
  }

  // 2. Atualizar nota da Hero
  const heroNote = document.getElementById('hero-trial-note');
  if (heroNote) {
    if (is1h) {
      heroNote.innerHTML = '⏱️ <strong class="text-cyan-400">Modo Exclusivo Luciano:</strong> 1 hora de degustação ativa • Acesso vitalício por R$ 19,90 • Cada um tem a sua rotina';
    } else {
      heroNote.innerHTML = '⏱️ Experimente gratuitamente por 30 minutos • Acesso vitalício por R$ 19,90 • Cada um tem a sua rotina';
    }
  }

  // 3. Atualizar badge na barra superior
  const badgeContainer = document.getElementById('luciano-badge-container');
  if (badgeContainer) {
    if (is1h) {
      badgeContainer.innerHTML = `
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[11px] font-mono font-bold shadow-sm shadow-cyan-500/20" title="Modo exclusivo de teste de 1 hora ativo para Luciano">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Teste 1h Ativo</span>
        </div>
      `;
    } else {
      badgeContainer.innerHTML = '';
    }
  }
}

export function ativarTeste1Hora(notify = true) {
  localStorage.setItem('ritmo_teste_1h', 'true');
  localStorage.setItem('ritmo_trial_start', Date.now().toString());
  updatePaywallUI();
  hidePaywallModal();
  scheduleTimer();

  if (notify && window.showToast) {
    window.showToast('⏱️ Modo de Teste Exclusivo (1 Hora) ativado para Luciano! Bom proveito.', 'success');
  }
}

export function desativarTeste1Hora(notify = true) {
  localStorage.removeItem('ritmo_teste_1h');
  localStorage.setItem('ritmo_trial_start', Date.now().toString());
  updatePaywallUI();
  scheduleTimer();

  if (notify && window.showToast) {
    window.showToast('Modo de teste redefinido para o padrão público (30 minutos).', 'info');
  }
}

export function resetarTempoTeste() {
  localStorage.setItem('ritmo_trial_start', Date.now().toString());
  hidePaywallModal();
  scheduleTimer();
  if (window.showToast) {
    const duracaoStr = is1hTestActive() ? '1 hora' : '30 minutos';
    window.showToast(`⏱️ Tempo de degustação reiniciado (${duracaoStr} completos).`, 'info');
  }
}

function scheduleTimer() {
  if (timerTimeoutId) {
    clearTimeout(timerTimeoutId);
    timerTimeoutId = null;
  }

  if (isRitmoUnlocked()) {
    hidePaywallModal();
    return;
  }

  const duration = getTrialDurationMs();
  let trialStart = localStorage.getItem('ritmo_trial_start');
  if (!trialStart) {
    trialStart = Date.now().toString();
    localStorage.setItem('ritmo_trial_start', trialStart);
  }

  const startTime = parseInt(trialStart, 10);
  const elapsed = Date.now() - startTime;

  if (elapsed >= duration) {
    showPaywallModal();
  } else {
    hidePaywallModal();
    const remaining = duration - elapsed;
    timerTimeoutId = setTimeout(() => {
      if (!isRitmoUnlocked()) {
        showPaywallModal();
      }
    }, remaining);
  }
}

export function checkUrlParameters() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);

  // Ativação do modo exclusivo de 1 hora para Luciano
  if (
    params.get('teste') === '1h' ||
    params.get('teste') === '60' ||
    params.get('teste') === '60m' ||
    params.get('admin') === 'luciano' ||
    params.get('luciano') === '1h' ||
    params.get('user') === 'luciano'
  ) {
    const isAlready1h = is1hTestActive();
    localStorage.setItem('ritmo_teste_1h', 'true');
    // Se o usuário passou explicitamente na URL, garante timer renovado
    if (!isAlready1h || params.get('reset') === 'true') {
      localStorage.setItem('ritmo_trial_start', Date.now().toString());
    }
  }

  // Retorno ao padrão público de 30 min para testes de cliente
  if (
    params.get('teste') === 'padrao' ||
    params.get('teste') === '30m' ||
    params.get('reset') === 'padrao'
  ) {
    localStorage.removeItem('ritmo_teste_1h');
  }

  // Reinício manual do contador
  if (params.get('reset') === 'true' || params.get('reset') === 'timer') {
    localStorage.setItem('ritmo_trial_start', Date.now().toString());
  }
}

export function initPaywallTimer() {
  // Processa query params e atualiza interface
  checkUrlParameters();
  updatePaywallUI();

  // Inicia agendamento do bloqueio
  scheduleTimer();

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

  // Códigos para ativação do teste de 1 hora exclusivo de Luciano
  const codes1h = ['TESTE1H', 'LUCIANO1H', '1HORA', 'TESTE60', 'TESTE-1H', '1H'];
  if (codes1h.includes(rawCode)) {
    ativarTeste1Hora(false);
    if (window.showToast) {
      window.showToast('⏱️ Modo de Teste Exclusivo de 1 Hora ativado para você, Luciano! Aproveite.', 'success');
    } else {
      alert('⏱️ Modo de Teste Exclusivo de 1 Hora ativado para Luciano!');
    }
    input.value = '';
    return;
  }

  // Chaves mestre de liberação vitalícia e padrão gerado
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
      if (json.tier === 'trial_1h') {
        ativarTeste1Hora(false);
        if (window.showToast) {
          window.showToast(json.message || '⏱️ Modo de Teste de 1 Hora ativado para Luciano!', 'success');
        }
        input.value = '';
        return;
      }
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
window.ativarTeste1Hora = ativarTeste1Hora;
window.desativarTeste1Hora = desativarTeste1Hora;
window.resetarTempoTeste = resetarTempoTeste;
window.is1hTestActive = is1hTestActive;

window.fecharPaywallSeDegustando = function() {
  if (isRitmoUnlocked()) {
    hidePaywallModal();
    return;
  }
  const trialStart = parseInt(localStorage.getItem('ritmo_trial_start') || '0', 10);
  const elapsed = Date.now() - trialStart;
  const duration = getTrialDurationMs();

  if (elapsed < duration) {
    hidePaywallModal();
  } else {
    const tempoTexto = is1hTestActive() ? '1 hora' : '30 min';
    if (window.showToast) {
      window.showToast(`O período de degustação de ${tempoTexto} encerrou. Insira a sua chave de acesso para continuar.`, 'warning');
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
