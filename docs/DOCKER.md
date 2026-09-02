# Docker Setup and Usage Guide

This repository includes full Docker containerization for local development, testing, and production deployment across all system components.

## Architecture

The system consists of 4 orchestrated containers managed via `docker-compose`:

1. **`postgres`** (PostgreSQL 16 Database)
   - Port: `5432`
   - Volume: `postgres_data`
2. **`ai-service`** (Python FastAPI Classifier & ML Engine)
   - Port: `8000`
   - Healthcheck: `/health`
3. **`server`** (Node.js Express REST API)
   - Port: `5000`
   - Internal dependencies: `postgres`, `ai-service`
4. **`client`** (React Frontend served via Nginx)
   - Ports: `80`, `5173`
   - Nginx reverse proxy routes requests to `/api/` to the backend server.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Engine & Docker Compose)

---

## Quick Start Commands

### 1. Build and Start All Services
```bash
docker-compose up --build -d
```

### 2. View Service Logs
```bash
# All logs
docker-compose logs -f

# Specific container logs
docker-compose logs -f server
docker-compose logs -f ai-service
```

### 3. Run Prisma Migrations inside Server Container
```bash
docker-compose exec server npx prisma migrate dev
```

### 4. Seed Initial Database Data
```bash
docker-compose exec server npm run seed
```

### 5. Stop All Containers
```bash
docker-compose down
```

To remove persistent database volumes as well:
```bash
docker-compose down -v
```

---

## Environment Variables

The default development setup uses preset parameters in `docker-compose.yml`. For custom local deployments:
- Configure `DATABASE_URL`, `JWT_SECRET`, and `AI_SERVICE_URL` in `server/`
- Configure `VITE_API_URL` in `client/`
