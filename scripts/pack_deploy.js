// scripts/pack_deploy.js - Gerador de pacote de deploy limpo (.zip)
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = path.resolve();
const DESKTOP_DIR = 'C:\\Users\\luciano\\OneDrive\\Desktop';
const OUTPUT_ZIP = path.join(DESKTOP_DIR, 'ritmo-autonomia-deploy.zip');

console.log('📦 Gerando pacote limpo de deploy para a Área de Trabalho...');

const tempDir = path.join(ROOT_DIR, '.deploy_staging');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Copia arquivos do repositório respeitando o git (sem node_modules e sem .git)
execSync(`git archive --format=zip --output="${OUTPUT_ZIP}" HEAD`, { cwd: ROOT_DIR });

console.log(`✅ Pacote de deploy atualizado com sucesso em: ${OUTPUT_ZIP}`);
console.log(`Tamanho: ${(fs.statSync(OUTPUT_ZIP).size / 1024 / 1024).toFixed(2)} MB`);
