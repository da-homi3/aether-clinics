# Deploy Aether Clinics (Postgres production)

Local SQLite remains the default for quick demos (`DATABASE_URL="file:./dev.db"`).

## Production database (Postgres)

1. Start Postgres locally:

```bash
docker compose up -d
```

2. Point Prisma at Postgres. In `.env`:

```env
DATABASE_URL="postgresql://aether:aether@localhost:5432/aether_clinics?schema=public"
AUTH_SECRET="replace-with-long-random-string"
MPESA_WEBHOOK_SECRET="replace-with-long-random-string"
```

3. Switch the Prisma datasource provider to `postgresql` in `prisma/schema.prisma` (change `provider = "sqlite"` to `provider = "postgresql"`), then:

```bash
npx prisma db push
npx prisma db seed
npm run build
npm run start
```

Or use a hosted Postgres URL from Neon, Supabase, Railway, or Render — same `DATABASE_URL` shape.

## Hosted app URL

Deploy the Next.js app to Vercel / Railway / Render with the same env vars. After deploy, your public URL will look like:

`https://your-project.vercel.app`

There is no shared public demo URL in this repo until you deploy with your own account.

## Health check

After deploy, open `/login` and sign in with a seeded or created staff account.
