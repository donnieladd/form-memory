# Supabase setup — Form Memory

You can connect Supabase so the agent runs deploy steps for you. Three ways, from easiest to most hands-on.

## Option 1 — Supabase CLI login (recommended)

In your terminal:

```bash
cd ~/Projects/form-memory
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Once linked, tell the agent: **"Supabase is linked — deploy form-memory."**

The agent can then run:

```bash
supabase db push
npm run key:generate
supabase secrets set FORM_MEMORY_API_KEY=fm_live_...
supabase functions deploy form-memory
```

## Option 2 — Supabase MCP in Cursor

1. Open **Cursor Settings → MCP**
2. Enable the **Supabase** plugin if not already on
3. Authenticate when prompted

Then say: **"Use Supabase MCP to set up form-memory project."**

The agent can inspect projects, run SQL, and manage resources through MCP tools when the plugin is connected.

## Option 3 — Paste credentials manually

If you prefer not to link CLI, provide:

| Value | Where to find it |
|-------|------------------|
| Project ref | Supabase dashboard → Project Settings → General |
| `FORM_MEMORY_API_KEY` | Run `npm run key:generate` locally |
| Database password | Only if the agent needs direct DB access (usually not) |

Never paste service role keys in chat unless you accept the security tradeoff. Prefer CLI login or MCP OAuth.

## After deploy

1. Copy production URL into root `.env.local` and `apps/web/.env.local`:

```bash
FORM_MEMORY_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/form-memory
FORM_MEMORY_API_KEY=fm_live_...
```

2. Start the UI:

```bash
npm run web:dev
```

Open http://localhost:3020 — Relay-by-FORM shell, Form Memory brain.

3. Point wispr-clone at the same URL/key.

## What the agent cannot do without you

- Create the Supabase project in your account (you click Create Project once)
- Approve OAuth / CLI login in your browser
- Access projects you have not linked or authenticated

You create the project; the agent can handle migrations, secrets, function deploy, and wiring env files once auth is in place.
