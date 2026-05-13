FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx nx build web --configuration=production

FROM nginx:alpine AS production
# Angular application builder outputs to dist/apps/web/browser
COPY --from=builder /app/dist/apps/web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
