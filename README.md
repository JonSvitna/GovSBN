# GovSBN

SBN rework V1

## Deployment target

- **Frontend:** Vercel
- **Backend/Auth:** Supabase

## Supabase bootstrap (initialized in this repo)

This repository now includes a `supabase/config.toml` so Supabase is already bootstrapped.

1. Install Supabase CLI.
2. Start local Supabase services:

```bash
supabase start
```

3. Link to your hosted Supabase project:

```bash
supabase link --project-ref <your-project-ref>
```

4. Push local config/schema changes:

```bash
supabase db push
```

Auth is enabled in `supabase/config.toml` with email sign-up enabled.

## Frontend deploy on Vercel

1. Import this repository in Vercel.
2. Set frontend environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.

> Update `supabase/config.toml` `site_url` and `additional_redirect_urls` to your final Vercel URL.
