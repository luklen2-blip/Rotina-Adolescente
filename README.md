# Ritmo — Autonomia através da Autoria (v2.0.0)

> **Premissa Clínica Fundamental:** *"Cada um tem a sua rotina — autonomia através da autoria."*  
> Desenvolvido sob a ótica da Psicologia do Desenvolvimento e da Psicanálise da Adolescência (Donald Winnicott, Françoise Dolto e Contardo Calligaris).

---

## 🧠 Filosofia Clínica e Metacognitiva

1. **Não-Punitivo:** Zero alertas de culpa, perda de sequência tóxica (*streaks*) ou julgamento de desempenho moral. A falha é lida como dado de auto-observação, não como insuficiência.
2. **Princípio da Autonomia:** O adolescente é o sujeito da escrita. O app fornece a moldura temporal, mas o jovem nomeia os blocos e decide o ritmo.
3. **Acolhimento da Ambiguidade:** Espaços flexíveis legítimos como *Ócio Deliberado*, *Tempo de Nada*, *Foco Leve* e *Recarregando*.
4. **Economia de Créditos Neutros:** Os pontos acumulam sem expiração para resgate de autorrecompensas tangíveis pactuadas com a família ou consigo mesmo (pedir pizza, tempo de videogame, passeios).
5. **Válvula de Escape:** Microdiário de até 3 linhas com cofre privativo para descompressão.

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
