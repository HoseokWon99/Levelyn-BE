FROM node:22-alpine AS builder

WORKDIR /app

COPY . .
RUN npm ci
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY .env ./
COPY game.system.yaml ./

ENV NODE_ENV=production
ENV TZ=Asia/Seoul

EXPOSE 3000

CMD ["node", "dist/main"]
