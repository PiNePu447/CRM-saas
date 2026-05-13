FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx nx build api --configuration=production

FROM node:20-alpine AS production
WORKDIR /app
# Copy production node_modules
COPY --from=base /app/node_modules ./node_modules
# Copy compiled app
COPY --from=builder /app/dist/apps/api ./
# Copy prisma schema for generate
COPY prisma ./prisma
# Generate Prisma client against production node_modules
RUN npx prisma generate
# Drop write permissions
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs
EXPOSE 3000
CMD ["node", "main.js"]
