/**
 * Gerenciador de Túnel Seguro Cloudflare Quick Tunnel 24/7 para a Ritmo Autonomia
 * Com flag mandatória --no-prechecks e pool de certificados CA.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import tls from 'tls';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = __dirname;
const cloudflaredExe = path.join(projectDir, 'cloudflared.exe');
const caBundlePath = path.join(projectDir, 'ca-bundle.crt');

// 1. Garantir existência de certificados CA confiáveis
if (!fs.existsSync(caBundlePath) || fs.statSync(caBundlePath).size < 100) {
  fs.writeFileSync(caBundlePath, tls.rootCertificates.join('\n'), 'utf-8');
}

// 2. Detecta qual porta está respondendo (3005 ou 3000)
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, { timeout: 1500 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.status === 'ok') return resolve(true);
        } catch (e) {}
        resolve(false);
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  console.log('🛡️  Iniciando Gerenciador de Túnel Seguro Cloudflare 24/7...');

  let activePort = 3005;
  const is3005 = await checkPort(3005);
  if (!is3005) {
    const is3000 = await checkPort(3000);
    if (is3000) activePort = 3000;
  }

  console.log(`📡 Apontando túnel para http://127.0.0.1:${activePort}...`);

  if (!fs.existsSync(cloudflaredExe)) {
    console.error('❌ cloudflared.exe não encontrado em:', cloudflaredExe);
    process.exit(1);
  }

  const args = [
    'tunnel',
    '--url', `http://127.0.0.1:${activePort}`,
    '--no-prechecks',
    '--edge-ip-version', '4',
    '--protocol', 'http2',
    '--origin-ca-pool', caBundlePath
  ];

  const tunnel = spawn(cloudflaredExe, args);
  let publicUrl = null;

  const handleOutput = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !publicUrl) {
      publicUrl = match[0];
      fs.writeFileSync(path.join(projectDir, 'tunnel_url.txt'), publicUrl, 'utf-8');
      
      // Salva atalho na Área de Trabalho com a URL da nuvem
      const desktop = path.join(process.env.USERPROFILE, 'OneDrive', 'Desktop');
      if (fs.existsSync(desktop)) {
        fs.writeFileSync(path.join(desktop, 'URL-NUVEM-RITMO-AUTONOMIA.txt'), 
`RITMO AUTONOMIA - ACESSO EM NUVEM 24/7
URL Pública Global HTTPS: ${publicUrl}
Health Check: ${publicUrl}/api/health
`, 'utf-8');
      }

      console.log(`\n===============================================================`);
      console.log(`🚀 RITMO AUTONOMIA DISPONÍVEL 24/7 NA NUVEM GLOBAL!`);
      console.log(`🌐 URL Pública HTTPS:   ${publicUrl}`);
      console.log(`🩺 Health Check Nuvem:  ${publicUrl}/api/health`);
      console.log(`📱 Acesso Mobile / Web: Disponível para qualquer dispositivo no mundo!`);
      console.log(`===============================================================\n`);
    }
  };

  tunnel.stdout.on('data', handleOutput);
  tunnel.stderr.on('data', handleOutput);

  tunnel.on('close', (code) => {
    console.log(`Túnel encerrado com código: ${code}`);
  });

  process.on('SIGTERM', () => tunnel.kill());
  process.on('SIGINT', () => tunnel.kill());
}

main();
