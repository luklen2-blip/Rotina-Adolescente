# Ritmo Autonomia (v2.0.0)

> **Posicionamento:** *"Sua rotina. Seu ritmo. Sua autonomia."*  
> **Conceito Central:** *"Cada um tem a sua rotina — autonomia através da autoria."*  

---

## 🧭 Metodologia e Princípios de Autonomia

1. **Não-Punitivo:** Zero alertas de culpa, sem perda de sequência tóxica (*streaks*) ou julgamento de desempenho moral. Reorganizar é parte natural da vida.
2. **Princípio da Autonomia:** O usuário é o sujeito da escrita. O app fornece a moldura temporal, mas cada um escolhe os blocos e decide o ritmo.
3. **Ócio Deliberado:** Descansar faz parte de uma rotina saudável. Espaços de pausa e tempo protegido são planejados conscientemente.
4. **Economia de Conquistas Neutras:** Os pontos acumulam sem expiração para autorrecompensas pactuadas.
5. **Registro de Percepção:** Acompanhamento do humor pós-tarefa para identificar melhores momentos sem diagnósticos clínicos.

---

## 🚀 Arquitetura e Engenharia 24/7 (Padrão Luciano)

- **Backend:** Node.js + Express com arquitetura modular.
- **Persistência Atômica:** Motor transacional `JsonDB` (gravação em `.tmp` + `renameSync`), imune a quedas no Windows e Linux.
- **Frontend PWA Mobile-First:** Single Page Application com estética Neo-Brutalista Dark, sem elementos infantis, responsiva para celulares e tablets.
- **Monitoramento 24/7:** Endpoint obrigatório `GET /api/health` retornando status HTTP 200, versão, uptime e premissa clínica.
- **Infraestrutura Pronta:** `render.yaml` (Render Blueprint com auto-deploy) e `Dockerfile` multi-stage universal em `node:20-alpine`.
- **Fintech Nacional:** Geração nativa de payload PIX Copia-e-Cola (Banco Central) com CRC16 e QR Code dinâmico para Planos Familiares de Apoio.
- **Conformidade Legal Brasileira:** Artigo 14 da LGPD (melhor interesse do adolescente), Estatuto da Criança e do Adolescente (ECA) e Código Civil.

---

## 🛠️ Execução Local

```bash
# Instalar dependências
npm install

# Executar suíte de testes automatizados
npm test

# Iniciar servidor em desenvolvimento
npm start
```
Acesse em: `http://localhost:3000`  
Health check: `http://localhost:3000/api/health`

---

## 🧪 Testes de Produção na Nuvem

Após o deploy no Render ou Railway, execute:
```bash
node tests/test_cloud_live.js https://seu-app.onrender.com
```
