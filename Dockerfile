# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 - build the frontend (Vite -> dist/) and the server (tsc -> server/)
###############################################################################
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL dependencies (dev deps are needed to build)
COPY package.json package-lock.json ./
RUN npm ci

# Build front + server
COPY . .
RUN npm run build

###############################################################################
# Stage 2 - lean runtime image
###############################################################################
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled server and the built frontend.
# In prod the server serves static files from ./public (see Config.PUBLIC_PATH).
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./public

# Select the production environment. credentials.conf (Twitch secrets) and TLS
# certificates are intentionally NOT baked in - mount them at runtime if needed.
RUN printf 'prod' > env.conf \
	&& chown -R node:node /app

USER node

EXPOSE 3004

CMD ["node", "server/bootstrap.js"]
