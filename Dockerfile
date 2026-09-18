FROM node:20-alpine

WORKDIR /usr/src/app

# Instala dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia código-fonte completo
COPY . .

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000
ENV APP_NAME="Ritmo: Autonomia através da Autoria"

# Teste de integridade obrigatório antes da liberação da imagem
RUN node tests/run_all.js

EXPOSE 3000

CMD ["node", "server/index.js"]
