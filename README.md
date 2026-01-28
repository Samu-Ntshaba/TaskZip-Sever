# TaskZip Backend

A Node.js + TypeScript + Express backend foundation for TaskZip with Prisma (Postgres), JWT auth, role-based authorization, and Supabase Storage for profile images.

## Requirements
- Node.js 18+
- Postgres database
- Supabase project with a storage bucket

## Environment
Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

## Install & run
```bash
npm install
npm run dev
```

## Prisma
```bash
npx prisma migrate dev --name init
npm run migrate:deploy
```

## API documentation
Full API documentation is available in [`docs/API.md`](docs/API.md).

## API Endpoints
### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

### Profile
- `POST /profile/avatar`

### Admin
- `GET /admin/ping` (requires `ADMIN` role)

### Health
- `GET /health/test` (tests database + Supabase connections)

## Example cURL
### Register
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","fullName":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Forgot password
```bash
curl -X POST http://localhost:4000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Reset password
```bash
curl -X POST http://localhost:4000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"reset-token","newPassword":"newPassword123"}'
```

### Upload avatar
```bash
curl -X POST http://localhost:4000/profile/avatar \
  -H "Authorization: Bearer <accessToken>" \
  -F avatar=@/path/to/avatar.png
```

### Test connections
```bash
curl http://localhost:4000/health/test
```
