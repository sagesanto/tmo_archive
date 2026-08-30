FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

FROM base AS dev
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS builder
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf