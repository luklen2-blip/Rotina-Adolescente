// checkin.js - Módulos de Função Executiva e Metacognição (Check-in Afetivo)

let selectedEnergy = 'navegando';

export function setupCheckinHandlers(currentDateGetter) {
  const energyButtons = document.querySelectorAll('.energy-btn');
  energyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      energyButtons.forEach(b => b.classList.remove('active', 'border-indigo-500', 'bg-slate-800'));
      btn.classList.add('active', 'border-indigo-500', 'bg-slate-800');
      selectedEnergy = btn.dataset.energy;
    });
  });

  const btnSave = document.getElementById('btn-save-checkin');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const date = currentDateGetter();
      const promptInput = document.getElementById('checkin-prompt-input');
      const promptAnswer = promptInput ? promptInput.value.trim() : '';

      try {
        const res = await fetch(`/api/day/${date}/checkin/morning`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            energyLevel: selectedEnergy,
            promptAnswer
          })
        });
        const json = await res.json();
        if (json.success) {
          window.showToast(json.message, 'success');
        }
      } catch (err) {
        window.showToast('Erro ao salvar check-in de energia.', 'error');
      }
    });
  }

  // Evening Check-in
  const btnSubmitEvening = document.getElementById('btn-submit-evening');
  if (btnSubmitEvening) {
    btnSubmitEvening.addEventListener('click', async () => {
      const date = currentDateGetter();
      const heaviestFriction = document.getElementById('evening-heaviest').value.trim();
      const lightestMoment = document.getElementById('evening-lightest').value.trim();

      try {
        const res = await fetch(`/api/day/${date}/checkin/evening`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heaviestFriction, lightestMoment })
        });
        const json = await res.json();
        if (json.success) {
          window.showToast(json.message, 'success');
          document.getElementById('modal-evening').classList.add('hidden');
        }
      } catch (err) {
        window.showToast('Falha ao registrar encerramento do dia.', 'error');
      }
    });
  }
}

export function updateCheckinUI(affectiveCheckIn) {
  if (!affectiveCheckIn || !affectiveCheckIn.morning) return;

  const { energyLevel, promptAnswer } = affectiveCheckIn.morning;
  if (energyLevel) {
    selectedEnergy = energyLevel;
    const energyButtons = document.querySelectorAll('.energy-btn');
    energyButtons.forEach(btn => {
      if (btn.dataset.energy === energyLevel) {
        btn.classList.add('active', 'border-indigo-500', 'bg-slate-800');
      } else {
        btn.classList.remove('active', 'border-indigo-500', 'bg-slate-800');
      }
    });
  }

  const promptInput = document.getElementById('checkin-prompt-input');
  if (promptInput && promptAnswer) {
    promptInput.value = promptAnswer;
  }
}
