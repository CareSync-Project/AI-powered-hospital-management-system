FROM node:20-alpine AS client-builder

WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server-builder

WORKDIR /build/server
RUN apk add --no-cache openssl
COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm ci
COPY server/ ./
RUN npx prisma generate

FROM node:20-alpine

RUN apk add --no-cache nginx openssl
WORKDIR /app/server

COPY --from=server-builder /build/server ./
COPY --from=client-builder /build/client/dist /usr/share/nginx/html
COPY railway/nginx.conf.template /etc/nginx/http.d/default.conf.template
COPY railway/start.sh /app/start.sh
RUN sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

EXPOSE 8080
CMD ["/app/start.sh"]
