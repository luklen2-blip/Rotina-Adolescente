// tests/test_cloud_live.js - Validador E2E de produção em Nuvem com suporte a SSL intermediário
import https from 'https';
import http from 'http';

const targetUrl = process.argv[2] || process.env.LIVE_URL;
if (!targetUrl) {
  console.error('Uso: node tests/test_cloud_live.js <URL_DE_PRODUCAO>');
  console.error('Exemplo: node tests/test_cloud_live.js https://ritmo-autonomia.onrender.com');
  process.exit(1);
}

const isHttps = targetUrl.startsWith('https');
const client = isHttps ? https : http;
const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined;

async function checkEndpoint(endpoint) {
  const fullUrl = new URL(endpoint, targetUrl).toString();
  return new Promise((resolve, reject) => {
    client.get(fullUrl, { agent }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, data, json });
      });
    }).on('error', reject);
  });
}

async function runLiveValidation() {
  console.log(`🌐 [Live Cloud E2E] Conectando ao host de produção: ${targetUrl}`);

  // 1. Health Check
  console.log('🩺 Verificando /api/health...');
  const health = await checkEndpoint('/api/health');
  if (health.status !== 200 || health.json?.status !== 'ok') {
    throw new Error(`Health check falhou: HTTP ${health.status}`);
  }
  console.log(`✅ /api/health respondendo 200 OK (App: ${health.json.app}, Uptime: ${health.json.uptime_seconds}s)`);

  // 2. Shell SPA
  console.log('📱 Verificando carregamento da interface...');
  const home = await checkEndpoint('/');
  if (home.status !== 200 || (!home.data.includes('Rotina') && !home.data.includes('Ritmo'))) {
    throw new Error(`Landing page / PWA falhou: HTTP ${home.status}`);
  }
  console.log('✅ Interface PWA carregada com sucesso.');

  // 3. Manifest PWA
  console.log('📦 Verificando manifest.json...');
  const manifest = await checkEndpoint('/manifest.json');
  if (manifest.status !== 200) {
    throw new Error(`Manifest PWA ausente: HTTP ${manifest.status}`);
  }
  console.log('✅ Manifest PWA acessível para instalação mobile.');

  console.log('\n🎉 SUCESSO: O ambiente de nuvem está 100% íntegro, ativo e pronto para uso!');
  process.exit(0);
}

runLiveValidation().catch(err => {
  console.error('❌ Falha na validação de nuvem:', err.message);
  process.exit(1);
});
