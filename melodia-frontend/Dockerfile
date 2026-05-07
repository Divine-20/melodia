# --- Stage 1: build the SPA -------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --fund=false

COPY . .

# Empty base URL = same-origin requests (nginx proxies /api and /health
# to the backend container). Override at build time with --build-arg if
# you want to point the SPA at an external API.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# --- Stage 2: serve the static bundle via nginx -----------------------------
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
