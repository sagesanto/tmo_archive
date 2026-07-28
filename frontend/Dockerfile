FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

FROM base AS dev
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS builder
RUN npm run build

FROM node:22-alpine AS prod
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
CMD ["sh", "-c", "serve -s dist -l ${FRONTEND_PORT:-3000}"]