# Planix

Monorepo with `backend/` (Express + Prisma + Postgres) and `frontend/` (Next.js 14).

## Env Vars

Backend (`backend/.env` or Railway project variables):
- DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require
- JWT_SECRET=change_me
- RAZORPAY_KEY_ID=...
- RAZORPAY_KEY_SECRET=...
- DEEPSEEK_API_KEY=...
- DEEPSEEK_MODEL=deepseek-chat (optional)
- PORT=8080

Frontend (`frontend/.env.local` or Vercel project variables):
- NEXT_PUBLIC_API_URL=https://your-backend-url
- NEXT_PUBLIC_RAZORPAY_KEY_ID=...

## Local Dev

Backend:
```
cd backend
npm i
npx prisma db push
npx prisma generate
npm run dev
```

Frontend:
```
cd frontend
npm i
npm run dev
```

## Deploy

Railway (backend only):
- Root Directory: `backend`
- Install: `npm ci`
- Build: `npm run build`
- Start: `npm run start`
- Deploy Hook: `npx prisma migrate deploy && npx prisma generate`
- Set env vars above

Vercel (frontend only):
- Root Directory: `frontend`
- Framework: Next.js
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`


