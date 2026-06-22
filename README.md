# Form Memory

**Your personal brain, hosted on Supabase — shared across every Form platform.**

Form Memory is not Cursor-specific. It is hosted infrastructure that wispr-clone, Brand Studio, relume-clone, quiver-clone, and Cursor (via MCP) all read from and write to.

| Layer | Location |
|-------|----------|
| Database | Supabase Postgres (`form_workspaces`, `form_entities`, …) |
| API | Edge Function `form-memory` |
| **UI (v3)** | `apps/web` — **Relay by FORM v2 shell** (dark operational design) |
| SDK | `packages/sdk` (`@form/memory`) |
| MCP adapter | `mcp/` (calls hosted API — does not store data locally) |
| Personal workspace | slug `personal` |

## Architecture

```
                    ┌─────────────────────────┐
                    │  Supabase (hosted)       │
                    │  Postgres + Edge Function│
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  wispr-clone            Brand Studio              Cursor MCP
  (HTTP SDK)             (HTTP SDK)           (stdio → HTTP)
```

**Multi-tenant later:** add workspaces + per-client API keys in `form_platform_keys`. Personal brain uses workspace `personal` today.

## Quick start

### 1. Create Supabase project

1. [Create a project](https://supabase.com/dashboard) named **form-memory**
2. Install [Supabase CLI](https://supabase.com/docs/guides/cli)
3. Link and migrate:

```bash
cd form-memory
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 2. Generate API key

```bash
npm install
npm run key:generate
```

Set the key as an Edge Function secret:

```bash
supabase secrets set FORM_MEMORY_API_KEY=fm_live_...
```

Copy `.env.example` → `.env.local` and paste the same key.

### 3. Local dev

```bash
supabase start
supabase functions serve form-memory --env-file .env.local
```

Test:

```bash
curl http://127.0.0.1:54321/functions/v1/form-memory/health \
  -H "Authorization: Bearer $FORM_MEMORY_API_KEY"
```

### 4. Deploy

```bash
supabase functions deploy form-memory
supabase secrets set FORM_MEMORY_API_KEY=fm_live_...
```

Production URL:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/form-memory
```

### 5. Connect platforms

Every Form app uses the same env:

```bash
FORM_MEMORY_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/form-memory
FORM_MEMORY_API_KEY=fm_live_...
```

**wispr-clone** — set these in `wispr-clone/.env.local`.

### 6. Form Memory UI (Relay v2 shell → v3)

Ported from `relaybyform.` branch `relay-by-form-v2` — dark operational RELAY design, not the generic green wispr-clone look.

```bash
cp apps/web/.env.example apps/web/.env.local
# paste same FORM_MEMORY_URL + API key
npm run web:dev
```

Open **http://localhost:3020**

See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for connecting Supabase so the agent can deploy for you.

### 6. Cursor MCP (optional)

Cursor does not host memory — it connects to your hosted API via a thin MCP adapter:

```json
{
  "mcpServers": {
    "form-memory": {
      "command": "npx",
      "args": ["tsx", "/Users/dontaeladson/Projects/form-memory/mcp/src/index.ts"],
      "env": {
        "FORM_MEMORY_URL": "https://YOUR_PROJECT_REF.supabase.co/functions/v1/form-memory",
        "FORM_MEMORY_API_KEY": "fm_live_..."
      }
    }
  }
}
```

Do **not** run Anthropic's `@modelcontextprotocol/server-memory` at the same time.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET | `/context` | Session primer |
| GET | `/graph` | Full knowledge graph |
| POST | `/observations` | Add facts to an entity |
| POST | `/entities` | Create entities |
| POST | `/relations` | Link entities |

Auth: `Authorization: Bearer fm_live_...`

Optional header: `X-Form-Workspace` (defaults to personal workspace)

See [`docs/PLATFORM_CONTRACT.md`](docs/PLATFORM_CONTRACT.md).

## MCP tools

| Tool | Purpose |
|------|---------|
| `initialize_context` | Session primer |
| `read_graph` | Export graph |
| `create_entities` | Create entities |
| `add_observations` | Add facts |
| `create_relations` | Link entities |
| `remember_voice_correction` | Wispr-specific helper |

## Roadmap

- [x] Supabase schema + personal workspace seed
- [x] Edge Function API
- [x] SDK + MCP adapter
- [ ] Semantic search (`/search` + embedding backfill)
- [ ] Multi-tenant workspaces + platform key table
- [ ] Dashboard UI for browsing memory
