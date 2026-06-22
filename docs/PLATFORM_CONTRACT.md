# Form Memory — Platform Contract

All Form platforms use this contract. One hosted brain, many clients.

## Environment

```bash
FORM_MEMORY_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/form-memory
FORM_MEMORY_API_KEY=fm_live_...
# Optional — defaults to personal workspace
FORM_MEMORY_WORKSPACE_ID=00000000-0000-4000-8000-000000000001
```

## Authentication

Every request requires:

```http
Authorization: Bearer fm_live_...
```

Optional workspace routing (multi-tenant later):

```http
X-Form-Workspace: 00000000-0000-4000-8000-000000000001
```

## Endpoints

### GET /health

```json
{ "ok": true, "service": "form-memory" }
```

### GET /context

Session primer for agents and polish layers.

```json
{
  "workspace_id": "00000000-0000-4000-8000-000000000001",
  "primer": "Form Memory primer:\n- Don (person): ...",
  "entity_count": 4,
  "observation_count": 7
}
```

### GET /graph

```json
{
  "workspace_id": "...",
  "entities": [
    { "name": "Don", "entityType": "person", "observations": ["..."] }
  ],
  "relations": [
    { "from": "Don", "to": "Brand Studio", "relationType": "builds" }
  ]
}
```

### POST /observations

```json
{
  "entityName": "Voice Preferences",
  "contents": ["Tanay not Tony"],
  "source": "wispr"
}
```

### POST /entities

```json
{
  "entities": [
    {
      "name": "Faith Chapel",
      "entityType": "client",
      "observations": ["Church vertical profile in Brand Studio"]
    }
  ]
}
```

### POST /relations

```json
{
  "relations": [
    { "from": "Don", "to": "Brand Studio", "relationType": "builds" }
  ]
}
```

## SDK usage

```typescript
import { FormMemoryClient } from "@form/memory";

const memory = new FormMemoryClient({
  url: process.env.FORM_MEMORY_URL!,
  apiKey: process.env.FORM_MEMORY_API_KEY!,
});

const { primer } = await memory.getContext();

await memory.addObservations({
  entityName: "Don",
  contents: ["Prefers Relume-style sitemap → wireframe flow"],
  source: "cursor",
});
```

## Multi-tenant (later)

| Today | Later |
|-------|-------|
| One workspace: `personal` | Workspace per client/org |
| Single API key | Keys in `form_platform_keys` routed to workspace |
| Shared graph | RLS + JWT for user-facing apps |

Schema is already workspace-scoped — adding tenants is additive, not a rewrite.
