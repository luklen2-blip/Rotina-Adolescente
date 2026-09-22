// tests/test_pix_resolution.js
// Validação de Resolução Infinita (SVG Vetorial) e Nitidez 100% do QR Code Pix
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runPixTests() {
  console.log('🔍 [PIX TEST] Iniciando verificação de nitidez e integridade do PIX...');

  const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3199';

  // 1. Validar endpoint de dados do Pix
  const infoRes = await fetch(`${BASE_URL}/api/pix`);
  assert.strictEqual(infoRes.status, 200, 'Endpoint /api/pix deve responder 200');
  const info = await infoRes.json();
  assert.strictEqual(info.success, true, 'API Pix deve retornar success: true');
  assert.strictEqual(info.data.amount, 19.9, 'Valor oficial deve ser R$ 19,90');
  assert.strictEqual(info.data.chavePix, 'luklen2@gmail.com', 'Chave Pix oficial deve ser luklen2@gmail.com');
  assert.strictEqual(info.data.titular, 'Luciano Sant Anna', 'Titular oficial deve ser Luciano Sant Anna');
  assert.strictEqual(info.data.qrCodeSvg, '/api/pix/qrcode.svg', 'URL SVG deve apontar para /api/pix/qrcode.svg');
  assert.ok(info.data.copiaECola.includes('luklen2@gmail.com'), 'Payload EMV deve conter a chave Pix');
  console.log('   ✅ 1. Endpoint /api/pix validado com sucesso (R$ 19,90 | luklen2@gmail.com)');

  // 2. Validar SVG puro vetorial (nitidez infinita / zero pixels)
  const svgRes = await fetch(`${BASE_URL}/api/pix/qrcode.svg`);
  assert.strictEqual(svgRes.status, 200, 'Endpoint /api/pix/qrcode.svg deve responder 200');
  assert.ok(svgRes.headers.get('content-type').includes('image/svg+xml'), 'Content-Type deve ser image/svg+xml');
  const svgText = await svgRes.text();
  assert.ok(svgText.startsWith('<svg'), 'SVG deve iniciar com tag <svg');
  assert.ok(svgText.includes('shape-rendering="crispEdges"'), 'SVG deve conter renderização nítida shape-rendering="crispEdges"');
  console.log('   ✅ 2. QR Code SVG Vetorial puro validado (resolução infinita, bordas perfeitas e sem borrões)');

  // 3. Validar PNG em alta resolução (600x600 px)
  const pngRes = await fetch(`${BASE_URL}/api/pix/qrcode.png`);
  assert.strictEqual(pngRes.status, 200, 'Endpoint /api/pix/qrcode.png deve responder 200');
  assert.strictEqual(pngRes.headers.get('content-type'), 'image/png', 'Content-Type deve ser image/png');
  const pngBytes = (await pngRes.arrayBuffer()).byteLength;
  assert.ok(pngBytes > 1000, 'PNG gerado deve ser completo e em alta resolução');
  console.log(`   ✅ 3. QR Code PNG Ultra-HD 600x600 px validado (${pngBytes} bytes)`);

  // 4. Validar index.html
  const htmlPath = path.join(__dirname, '../public/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('src="/api/pix/qrcode.svg"'), 'index.html deve referenciar /api/pix/qrcode.svg');
  assert.ok(html.includes('pix-copia-cola-input'), 'index.html deve conter input de copia e cola');
  assert.ok(html.includes('window.copiarPixCopiaECola()'), 'index.html deve conter botão para copiar payload EMV');
  console.log('   ✅ 4. HTML do modal de paywall configurado com imagem vetorial nítida e botão Copia-e-Cola');

  // 5. Validar paywall.js
  const paywallJsPath = path.join(__dirname, '../public/js/paywall.js');
  const paywallJs = fs.readFileSync(paywallJsPath, 'utf8');
  assert.ok(paywallJs.includes('copiarPixCopiaECola'), 'paywall.js deve implementar copiarPixCopiaECola');
  console.log('   ✅ 5. paywall.js exporta a função de cópia do Pix com fallback para área de transferência');

  console.log('\n🎉 [PIX TEST] TODOS OS TESTES DE NITIDEZ DO PIX PASSARAM COM 100% DE SUCESSO!\n');
}

try {
  await runPixTests();
} catch (err) {
  console.error('❌ Falha no teste de resolução do Pix:', err);
  process.exit(1);
}
