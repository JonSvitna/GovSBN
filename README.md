# GovSBN — Government Inspection & Operational Reporting Platform

A modern government inspection platform that replaces spreadsheet-heavy workflows with a clean, structured, mobile-first operational system.

## Architecture

```
GovSBN/
├── web/          # Next.js 15 frontend (Vercel)
├── api/          # FastAPI backend (Railway)
└── supabase/     # Database schema & migrations
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TailwindCSS, Framer Motion |
| Backend | FastAPI, Python |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

## Features

### Web Platform
- **Dashboard** — Operational overview with live stats, recent inspections, and findings
- **Inspections** — Full inspection lifecycle with guided conduct flow, autosave, section navigation
- **Findings** — Auto-generated from triggered inspection responses with severity classification
- **Corrective Actions** — Auto-created from findings, assignment, due-date tracking
- **Reports** — Power BI-ready CSV/JSON exports, pie/bar charts with recharts
- **Templates** — Visual template builder: sections, questions, finding triggers, reporting metadata
- **Settings** — Organization, team roster, and site/location management
- **Onboarding** — 8-step guided setup that seeds starter data on completion

### Inspection Workflow
1. Select site → Select template → Step through guided questions
2. Non-compliant responses automatically generate findings
3. Findings automatically create corrective actions with due dates
4. All data tagged with Power BI reporting metadata

### Security
- Supabase Row Level Security (RLS) on every table
- Organization-scoped isolation — no cross-tenant data access
- JWT-based FastAPI authentication using Supabase JWT secret

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Update `supabase/config.toml` with your `project_id` and `site_url`
3. Run migrations:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```

### 2. Frontend (Next.js)

```bash
cd web
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

**Deploy to Vercel:**
- Set root directory to `web/`
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Backend (FastAPI)

```bash
cd api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, ALLOWED_ORIGINS
uvicorn app.main:app --reload
```

**Deploy to Railway:**
- Point Railway at the `api/` directory
- Set env vars from `.env.example`
- API available at `/api/v1/...`, health check at `/health`

---

## Database Schema

Core tables (all with `organization_id` RLS):

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant root |
| `profiles` | User profiles (extends auth.users) |
| `divisions` | Org divisions |
| `sites` | Inspection locations |
| `inspection_templates` | Template definitions |
| `template_sections` | Template sections |
| `template_questions` | Questions with type, metadata, finding triggers |
| `inspections` | Inspection instances |
| `inspection_responses` | Per-question responses |
| `findings` | Auto-generated from triggered responses |
| `corrective_actions` | Auto-generated from findings |
| `evidence` | File attachments (Supabase Storage) |
| `audit_logs` | Immutable audit trail |
| `onboarding_state` | Per-user onboarding progress |

## Power BI Integration

Every question is tagged with `reporting_metadata`:
```json
{
  "category": "fire_safety",
  "powerbi_field": "fire_extinguishers",
  "risk_level": "critical"
}
```

Export normalized datasets via:
- Web: Reports page → Export CSV
- API: `POST /api/v1/reports/export` (CSV or JSON)
