// legal.js - Termos de Uso e Privacidade LGPD (Art. 14 Lei 13.709/2018 e ECA)

export const LEGAL_DOCS = {
  termos: {
    title: 'Termos de Uso e Princípios de Autoria',
    content: `
      <p class="font-bold text-indigo-400">1. Natureza do Serviço e Premissa Clínica</p>
      <p>O <strong>Ritmo: Autonomia através da Autoria</strong> é um software de produtividade suave, organização pessoal e metacognição concebido especificamente para adolescentes. O aplicativo não utiliza mecanismos punitivos, sequências viciantes (*streaks*) ou julgamento de desempenho moral.</p>

      <p class="font-bold text-indigo-400 mt-3">2. Não Substituição de Serviços Médicos ou Psicológicos</p>
      <p>O aplicativo tem caráter estritamente de suporte à autogestão e autorregulação reflexiva. <strong>Ele não substitui consultas, acompanhamentos terapêuticos, psicoterapia ou tratamentos médicos/psiquiátricos.</strong> Em situações de sofrimento emocional intenso, procure apoio de seus responsáveis, de um profissional qualificado ou de serviços públicos de escuta como o CVV (disque 188).</p>

      <p class="font-bold text-indigo-400 mt-3">3. Faixa Etária e Capacidade Civil</p>
      <p>O aplicativo é recomendado para pessoas a partir de 13 anos. Qualquer transação financeira voluntária (como o Plano Familiar de Apoio via PIX) é expressamente restrita a maiores de 18 anos ou assistidos por responsáveis legais, em conformidade com o Código Civil Brasileiro.</p>

      <p class="font-bold text-indigo-400 mt-3">4. Autoria e Respeito ao Ritmo</p>
      <p>O adolescente tem o direito irrestrito de nomear seus blocos de vida, categorizar seus estados afetivos e reorganizar compromissos para o dia seguinte sem aplicação de penalidades.</p>
    `
  },
  privacidade: {
    title: 'Política de Privacidade e Proteção de Dados (LGPD Art. 14)',
    content: `
      <p class="font-bold text-emerald-400">1. Compromisso Especial com Crianças e Adolescentes</p>
      <p>Em total conformidade com o <strong>Artigo 14 da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong> e com o Estatuto da Criança e do Adolescente (ECA), o tratamento de dados no Ritmo é realizado exclusivamente no <em>melhor interesse</em> do usuário jovem.</p>

      <p class="font-bold text-emerald-400 mt-3">2. Dados Sensíveis e Válvula de Escape (Microdiário)</p>
      <p>As anotações do microdiário, tags de estado de energia e reflexões afetivas são armazenadas de forma confidencial e protegida. <strong>Esses dados nunca serão vendidos, cedidos ou utilizados para direcionamento de anúncios comportamentais publicitários.</strong></p>

      <p class="font-bold text-emerald-400 mt-3">3. Finalidade Estrita</p>
      <p>A única finalidade do processamento de dados é permitir a visualização temporal pelo próprio adolescente e o acúmulo de créditos neutros para autorrecompensas pactuadas.</p>

      <p class="font-bold text-emerald-400 mt-3">4. Direito de Eliminação</p>
      <p>O usuário ou seu responsável legal pode, a qualquer momento, solicitar a exclusão integral do histórico de dados gerados no sistema.</p>
    `
  }
};

window.openLegalModal = function(type) {
  const doc = LEGAL_DOCS[type] || LEGAL_DOCS.termos;
  const modal = document.getElementById('modal-legal');
  const title = document.getElementById('legal-modal-title');
  const body = document.getElementById('legal-modal-body');

  title.innerText = doc.title;
  body.innerHTML = doc.content;
  modal.classList.remove('hidden');
};
