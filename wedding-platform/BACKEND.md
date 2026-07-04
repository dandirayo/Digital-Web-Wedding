# Occasio Backend Setup Plan

This app is prepared for Supabase.

## Install tools

- Supabase CLI: https://supabase.com/docs/guides/local-development/cli/getting-started
- Docker Desktop: https://docs.docker.com/desktop/setup/install/windows-install/
- Vercel CLI: https://vercel.com/docs/cli

## Environment

Copy `.env.example` into `.env.local`, then fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Use `SUPABASE_SERVICE_ROLE_KEY` only on server-side code.

## Database

The first schema draft is in:

```text
src/lib/supabase/schema.sql
```

Core tables:

- `profiles`
- `events`
- `guests`
- `wishes`

Next backend steps:

1. Create Supabase project.
2. Run `schema.sql` in the Supabase SQL Editor.
3. Add Row Level Security policies for owner and client access.
4. Replace demo data in `src/lib/demo-data.ts` with Supabase queries.
5. Build auth pages for email/password login.
