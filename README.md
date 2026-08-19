# Aether Clinics

Multi-branch clinic operations platform: patients, appointments, consultations, billing, POS, inventory, RBAC, audit logs, 2FA, realtime notifications, PDF exports.

## Setup (SQLite demo)

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Open http://localhost:3000

## Demo login

- Owner: `owner@aetherclinics.ke` / `Demo1234!`
- Reception: `reception.westlands@aetherclinics.ke` / `Demo1234!`
- Doctor: `doctor.westlands@aetherclinics.ke` / `Demo1234!`
- Pharmacist: `pharmacy.westlands@aetherclinics.ke` / `Demo1234!`

## Production / Postgres

See [DEPLOY.md](./DEPLOY.md) for Docker Postgres, hosted database URLs, and Vercel deploy notes.

## Notable features

- Calendar day/week/month with drag-and-drop reschedule + clash checks
- TOTP 2FA enrollment under Settings; login challenges when enabled
- SSE live notification badge (`/api/realtime/stream`)
- Custom role editor with granular permissions
- Receipt/invoice Print + Download PDF
- M-Pesa webhook integration point (never trusts client-only success)
