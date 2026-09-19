// tests/run_all.js - Suíte de integridade automatizada local
process.env.NODE_ENV = 'test';
import assert from 'assert';
import http from 'http';
import app from '../server/index.js';
import { generatePixPayload } from '../server/routes/pix.routes.js';
import { JsonDB } from '../server/database/jsondb.js';

console.log('🧪 Iniciando testes de integridade do Sistema de Rotina (Ritmo Autonomia)...');

const TEST_PORT = 3199;
let server;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, data, json, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  let passed = 0;

  server = app.listen(TEST_PORT, '127.0.0.1');
  await new Promise(r => setTimeout(r, 200));

  try {
    // 1. Health Check
    console.log('👉 [1/12] Testando /api/health...');
    const health = await request('/api/health');
    assert.strictEqual(health.status, 200, 'Health check deve retornar 200');
    assert.strictEqual(health.json.status, 'ok');
    assert.strictEqual(health.json.version, '2.0.0');
    assert.strictEqual(health.json.core_concept, 'Cada um tem a sua rotina — autonomia através da autoria');
    assert.ok(typeof health.json.uptime_seconds === 'number');
    passed++;

    // 2. Persistência Atômica JsonDB
    console.log('👉 [2/9] Testando motor atômico JsonDB...');
    const testDb = new JsonDB('test_collection');
    const doc = testDb.insert({ title: 'Disciplina Hoje, Liberdade Amanhã', score: 100 });
    assert.ok(doc.id, 'Documento deve possuir ID gerado');
    const found = testDb.findById(doc.id);
    assert.strictEqual(found.title, 'Disciplina Hoje, Liberdade Amanhã');
    testDb.delete(doc.id);
    passed++;

    // 3. Carregamento do Quadro Semanal da Rotina
    console.log('👉 [3/9] Testando /api/routine/week (Quadro Semanal)...');
    const weekRes = await request('/api/routine/week');
    assert.strictEqual(weekRes.status, 200);
    assert.ok(weekRes.json.data.board.days.segunda, 'Deve conter Segunda-feira');
    assert.ok(weekRes.json.data.board.days.domingo, 'Deve conter Domingo');
    assert.strictEqual(weekRes.json.data.rewardsTiers.length, 5, 'Deve conter os 5 níveis de recompensas (5, 10, 20, 30, 50 pts)');
    assert.ok(weekRes.json.data.rules.length >= 5, 'Deve conter as regras importantes do quadro');
    passed++;

    // 4. Marcação de Tarefa com Pontuação Dinâmica
    console.log('👉 [4/9] Testando /api/routine/toggle (Marcar/Desmarcar com pontos)...');
    const toggleRes = await request('/api/routine/toggle', {
      method: 'POST',
      body: { dayKey: 'segunda', taskId: 'seg_4' } // Reforço escolar (+3)
    });
    assert.strictEqual(toggleRes.status, 200);
    assert.strictEqual(typeof toggleRes.json.cumulativePoints, 'number');
    assert.ok(toggleRes.json.message.includes('marcada com sucesso') || toggleRes.json.message.includes('desmarcada'));
    passed++;

    // 5. Bônus Manual de Notas / Prova (+5 pontos)
    console.log('👉 [5/9] Testando /api/routine/bonus (+5 bônus prova)...');
    const initialPoints = toggleRes.json.cumulativePoints;
    const bonusRes = await request('/api/routine/bonus', {
      method: 'POST',
      body: { points: 5, reason: 'Nota 10 no simulado de matemática' }
    });
    assert.strictEqual(bonusRes.status, 200);
    assert.strictEqual(bonusRes.json.cumulativePoints, initialPoints + 5);
    passed++;

    // 6. Resgate de Conquista por Pontos
    console.log('👉 [6/9] Testando /api/routine/claim (Resgate de Conquista 5 pts)...');
    const claimRes = await request('/api/routine/claim', {
      method: 'POST',
      body: { tierPoints: 5, rewardName: 'Escolher o filme da noite' }
    });
    assert.strictEqual(claimRes.status, 200);
    assert.strictEqual(claimRes.json.newBalance, bonusRes.json.cumulativePoints - 5);
    passed++;

    // 7. Histórico de Conquistas Resgatadas
    console.log('👉 [7/9] Testando /api/routine/history...');
    const historyRes = await request('/api/routine/history');
    assert.strictEqual(historyRes.status, 200);
    assert.ok(historyRes.json.data.length > 0);
    assert.strictEqual(historyRes.json.data[0].rewardName, 'Escolher o filme da noite');
    passed++;

    // 8. Gerador de PIX EMV Oficial do Banco Central (CRC16)
    console.log('👉 [8/9] Testando gerador nativo de PIX EMV Bacen...');
    const pixPayload = generatePixPayload({
      pixKey: 'contato@ritmoautonomia.com.br',
      name: 'RITMO AUTONOMIA',
      city: 'SAO PAULO',
      amount: 29.90,
      txId: 'RITMO01'
    });
    assert.ok(pixPayload.startsWith('000201'));
    assert.ok(pixPayload.includes('br.gov.bcb.pix'));
    assert.ok(pixPayload.includes('6304'));
    assert.strictEqual(pixPayload.slice(-4).length, 4);
    passed++;

    // 9. Resolução de Arquivos Estáticos e SPA
    console.log('👉 [9/10] Testando servidor estático e fallback SPA...');
    const home = await request('/');
    assert.strictEqual(home.status, 200);
    assert.ok(home.data.includes('RITMO') && home.data.includes('AUTONOMIA'), 'Deve carregar o HTML do Ritmo Autonomia');
    passed++;


    // 10. Endpoint do Checkout Oficial Kiwify
    console.log('👉 [10/11] Testando /api/checkout (Kiwify V2)...');
    const checkoutRes = await request('/api/checkout');
    assert.strictEqual(checkoutRes.status, 200);
    assert.strictEqual(checkoutRes.json.provider, 'Kiwify');
    assert.strictEqual(checkoutRes.json.checkoutUrl, 'https://pay.kiwify.com.br/8hGuEYs');
    assert.strictEqual(checkoutRes.json.product, 'Ritmo Autonomia — Acesso Vitalício');
    passed++;


    // 11. Validação de Chave de Ativação do Paywall (Chaves Mestre e Segurança)
    console.log('👉 [11/12] Testando /api/checkout/validate-code...');
    const validKeyRes = await request('/api/checkout/validate-code', {
      method: 'POST',
      body: { code: 'RITMO2026' }
    });
    assert.strictEqual(validKeyRes.status, 200);
    assert.strictEqual(validKeyRes.json.success, true);
    assert.strictEqual(validKeyRes.json.tier, 'lifetime');

    const validLucianoKeyRes = await request('/api/checkout/validate-code', {
      method: 'POST',
      body: { code: 'LUCIANO' }
    });
    assert.strictEqual(validLucianoKeyRes.status, 200);
    assert.strictEqual(validLucianoKeyRes.json.success, true);

    const invalidKeyRes = await request('/api/checkout/validate-code', {
      method: 'POST',
      body: { code: 'ERRADO123' }
    });
    assert.strictEqual(invalidKeyRes.status, 401);
    assert.strictEqual(invalidKeyRes.json.success, false);
    passed++;

    // 12. Adaptação Funcional de Rotina (Onboarding: Objetivo + Tempo + Energia)
    console.log('👉 [12/12] Testando /api/routine/adapt (Geração de Rotina Adaptada)...');
    const adaptRes = await request('/api/routine/adapt', {
      method: 'POST',
      body: {
        focus: 'Estudos',
        time: 'Pouco',
        energy: 'Baixa',
        tasks: [
          { title: 'Estudo Essencial (15 min)', points: 2, icon: 'book-open' },
          { title: 'Pausa Restaurativa (5 min)', points: 1, icon: 'coffee' },
          { title: 'Revisão Leve dos Pontos-Chave (10 min)', points: 2, icon: 'check-circle-2' },
          { title: 'Ócio Deliberado & Descanso', points: 1, icon: 'moon' }
        ],
        dayKey: 'terca'
      }
    });
    assert.strictEqual(adaptRes.status, 200);
    assert.strictEqual(adaptRes.json.success, true);
    assert.strictEqual(adaptRes.json.tasks.length, 4);
    assert.strictEqual(adaptRes.json.tasks[0].title, 'Estudo Essencial (15 min)');
    passed++;

    console.log(`\n🎉 SUCESSO NO BACKEND: Todos os ${passed}/12 testes de API e infraestrutura passaram perfeitamente!\n`);
    await import('./test_flow_v2.js');
    await import('./test_pix_resolution.js');
  } finally {
    if (server) server.close();
  }

}

runTests().catch(err => {
  console.error('\n❌ Falha nos testes de integridade:', err);
  if (server) server.close();
  process.exit(1);
});
