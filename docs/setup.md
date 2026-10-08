# Setup and local development

## Requirements

- Node.js and npm compatible with the checked-in package dependencies.
- MySQL server accessible to the backend.
- A MySQL database named `bookshop` (or change the database name in `DATABASE_URL`).

There is no root package manifest: install and run backend and frontend separately.

## 1. Configure and migrate MySQL

Create the database if needed, for example:

```sql
CREATE DATABASE bookshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

In PowerShell, copy the environment template and edit the resulting file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Set at minimum:

```dotenv
NODE_ENV=development
PORT=5000
CORS_ORIGINS=http://localhost:5173
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/bookshop
JWT_SECRET=<random secret of at least 32 characters>
JWT_EXPIRES_IN=1d
BOOKSHOP_SEED_PASSWORD=<development password of at least 12 characters>
```

`DATABASE_URL` and `JWT_SECRET` are required. `PORT` defaults to 5000, `CORS_ORIGINS` to `http://localhost:5173`, and `JWT_EXPIRES_IN` to `1d`. Do not commit `.env` or use the example credentials/secrets in production.

Install and apply schema from `backend/`:

```powershell
Set-Location backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
npm run dev
```

The seed requires `BOOKSHOP_SEED_PASSWORD` and hashes it with bcrypt. The seed upserts data and uses the same supplied password for its local admin and customer accounts. Avoid using real personal credentials for seed data.

For production migration deployment, use `npm run prisma:deploy` after installing dependencies and generating the client as required by the deployment environment. The checked-in initial migration is for a fresh schema. If tables already exist without migration history, baseline the database before applying migrations; do not apply the initial migration over existing tables.

Backend scripts in `backend/package.json`:

| Script | Action |
| --- | --- |
| `npm run dev` | Start Node with watch mode. |
| `npm start` | Start the API server. |
| `npm test` | Run Node's test runner over `backend/test`. |
| `npm run prisma:generate` | Generate Prisma Client. |
| `npm run prisma:migrate -- --name init` | Run local Prisma development migration. |
| `npm run prisma:deploy` | Apply checked-in migrations. |
| `npm run db:seed` | Insert/upsert local seed data. |

## 2. Configure and run frontend

In another PowerShell window:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Set the Vite API base URL (the example points to Express):

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Then install and start from `frontend/`:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. `CORS_ORIGINS` in backend must include the frontend origin.

## 3. Verify

- Visit `http://localhost:5000/api/health`; healthy API responds with `{ success: true, ... }`.
- Register a customer through the frontend or `POST /api/auth/register`.
- Seeded users are `admin@bookshop.local`, `lan.nguyen@bookshop.local`, and `minh.tran@bookshop.local`; login password is the value you set in `BOOKSHOP_SEED_PASSWORD` when seeding.
- Run backend checks with `npm test` from `backend/`.
- Build the frontend with `npm run build` from `frontend/`.

## Upload storage

Book images are written to `backend/uploads/books` and served from `/uploads`. This is local filesystem storage, so production deployments need a persistent volume or a separate object storage integration if uploads must survive replacement of the server instance.
