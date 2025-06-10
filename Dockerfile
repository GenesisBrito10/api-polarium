# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:20-alpine
WORKDIR /app

# só dependências de produção
COPY package*.json ./
RUN npm install --only=production

# copia dist compilada
COPY --from=builder /app/dist ./dist

# porta interna do Nest (definida em .env via PORT)
EXPOSE ${PORT}

# comando para iniciar
CMD ["node", "dist/main"]
