// public/js/legal.js - Termos de Uso, Autonomia e Conformidade LGPD (Art. 14 Lei 13.709/2018, ECA e CDC)

export const LEGAL_DOCS = {
  termos: {
    title: 'Termos de Uso e Princípios de Autonomia',
    content: `
      <div class="space-y-3 text-xs text-slate-300 leading-relaxed">
        <p class="font-bold text-cyan-400">1. Natureza do Serviço e Princípios de Autoria</p>
        <p>O <strong>Ritmo Autonomia</strong> é uma plataforma digital de organização cotidiana, planejamento de rotina e desenvolvimento de autonomia pessoal. A experiência foi concebida sob o princípio pedagógico fundamental: <em>"Cada um tem a sua rotina — autonomia através da autoria."</em> O sistema não utiliza mecanismos punitivos, cobranças agressivas ou julgamento moral de desempenho.</p>

        <p class="font-bold text-cyan-400">2. Não Substituição de Cuidados de Saúde</p>
        <p>O Ritmo Autonomia é uma ferramenta educacional e prática de autorregulação e organização diária. <strong>O software NÃO realiza diagnósticos, tratamentos clínicos, terapias, cura ou intervenção médica/psicológica</strong> para quaisquer condições, incluindo TDAH, Transtorno do Espectro Autista ou ansiedade. Para questões de saúde mental ou sofrimento emocional, consulte profissionais de saúde habilitados ou serviços de acolhimento como o CVV (disque 188).</p>

        <p class="font-bold text-cyan-400">3. Faixa Etária e Aquisições Comerciais</p>
        <p>O aplicativo é adequado para adolescentes (a partir de 13 anos) e adultos que buscam organizar seu dia com leveza. Qualquer transação financeira (aquisição do Acesso Vitalício por R$ 19,90) é estritamente destinada a maiores de 18 anos ou realizada com assistência e consentimento dos responsáveis legais, em conformidade com o Código Civil e o Estatuto da Criança e do Adolescente (ECA).</p>

        <p class="font-bold text-cyan-400">4. Reorganização sem Culpa e Respeito ao Ritmo</p>
        <p>O usuário possui direito inalienável de alterar suas prioridades, adiar tarefas para o dia seguinte ou usufruir de pausas deliberadas sem qualquer desconto de pontos ou penalidades no sistema.</p>
      </div>
    `
  },
  privacidade: {
    title: 'Política de Privacidade e Proteção de Dados (LGPD Art. 14)',
    content: `
      <div class="space-y-3 text-xs text-slate-300 leading-relaxed">
        <p class="font-bold text-emerald-400">1. Compromisso com a Privacidade e Proteção do Jovem (Art. 14 LGPD)</p>
        <p>Em estrita conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>, especialmente seu <strong>Artigo 14</strong>, e com o Estatuto da Criança e do Adolescente (ECA), todo o tratamento de dados pessoais no Ritmo Autonomia é realizado no <em>melhor interesse do titular</em> e com máxima transparência.</p>

        <p class="font-bold text-emerald-400">2. Dados Tratados e Finalidade Estrita</p>
        <ul class="list-disc pl-4 space-y-1">
          <li><strong>Preferências de Rotina e Foco:</strong> Utilizados exclusivamente para gerar sugestões de tarefas adequadas ao seu tempo e energia diária.</li>
          <li><strong>Registro de Percepção (Humor pós-tarefa):</strong> Permite ao próprio usuário identificar momentos do dia com maior fluidez ou cansaço, sem qualquer cruzamento clínico ou perfilamento comercial.</li>
          <li><strong>Pontuação de XP e Conquistas:</strong> Mantidos para fins de autorrecompensa e acompanhamento da própria jornada.</li>
        </ul>

        <p class="font-bold text-emerald-400">3. Não Comercialização e Não Rastreamento Publicitário</p>
        <p><strong>Nenhum dado pessoal, registro de rotina ou percepção é vendido, cedido ou compartilhado com terceiros para fins de publicidade comportamental direcionada.</strong></p>

        <p class="font-bold text-emerald-400">4. Armazenamento e Cookies</p>
        <p>Utilizamos armazenamento local seguro (localStorage) para manter suas tarefas e progresso salvos no seu próprio navegador, sem rastreadores invasivos de terceiros.</p>

        <p class="font-bold text-emerald-400">5. Direitos do Titular e Exclusão de Dados</p>
        <p>A qualquer momento, o usuário ou seu responsável legal pode solicitar a visualização, correção ou exclusão total dos dados armazenados entrando em contato pelo e-mail: <strong class="font-mono text-cyan-400">luklen2@gmail.com</strong>.</p>
      </div>
    `
  }
};

window.openLegalModal = function(type) {
  const doc = LEGAL_DOCS[type] || LEGAL_DOCS.termos;
  const modal = document.getElementById('modal-legal');
  const title = document.getElementById('legal-modal-title');
  const body = document.getElementById('legal-modal-body');

  if (title) title.innerText = doc.title;
  if (body) body.innerHTML = doc.content;
  if (modal) modal.classList.remove('hidden');
};
