# Niwala (Innovage.io Technical Screening)

Niwala is a food delivery mobile app — this repo is the technical screening
submission for Innovage.io.

> This is a Phase 1 scaffold. A full README (architecture, API reference, demo
> credentials, assumptions, etc.) will be written in the final phase.

## Structure

```text
Niwala/
├── backend/   Node + Express + TypeScript API (Prisma + PostgreSQL)
├── mobile/    React Native (Expo) app — "Niwala"
└── docker-compose.yml   PostgreSQL for local development
```

## Quick start (backend)

```bash
docker compose up -d          # start PostgreSQL
cd backend
cp .env.example .env
npm install
npm run dev                   # starts on http://localhost:4000
curl http://localhost:4000/health
```

## Quick start (mobile)

```bash
cd mobile
npm install
npx expo start
```
