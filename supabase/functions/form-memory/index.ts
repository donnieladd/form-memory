import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const PERSONAL_WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

type Json = Record<string, unknown>;

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-form-workspace",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

function json(data: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
}

function unauthorized(origin: string | null): Response {
  return json({ error: "Unauthorized" }, 401, origin);
}

function verifyApiKey(request: Request): boolean {
  const expected = Deno.env.get("FORM_MEMORY_API_KEY")?.trim();
  if (!expected) return false;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ") && auth.slice(7).trim() === expected) {
    return true;
  }

  const apikey = request.headers.get("apikey");
  return apikey === expected;
}

function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SECRET_KEY");
  if (!url || !key) {
    throw new Error("Supabase credentials missing in Edge Function environment");
  }
  return createClient(url, key);
}

function workspaceId(request: Request): string {
  return request.headers.get("x-form-workspace")?.trim() || PERSONAL_WORKSPACE_ID;
}

async function buildPrimer(
  supabase: SupabaseClient,
  workspaceIdValue: string,
): Promise<{ primer: string; entity_count: number; observation_count: number }> {
  const { data: entities, error } = await supabase
    .from("form_entities")
    .select("id, name, entity_type, form_observations(content, created_at)")
    .eq("workspace_id", workspaceIdValue)
    .order("name");

  if (error) throw error;

  let observationCount = 0;
  const lines: string[] = [];

  for (const entity of entities ?? []) {
    const observations = (entity.form_observations ?? []) as Array<{
      content: string;
      created_at: string;
    }>;
    observationCount += observations.length;
    if (observations.length === 0) continue;
    const recent = observations
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 8)
      .map((item) => item.content)
      .join("; ");
    lines.push(`- ${entity.name} (${entity.entity_type}): ${recent}`);
  }

  const primer =
    lines.length > 0
      ? ["Form Memory primer:", ...lines].join("\n")
      : "Form Memory is empty for this workspace.";

  return {
    primer,
    entity_count: entities?.length ?? 0,
    observation_count: observationCount,
  };
}

async function handleContext(request: Request, origin: string | null): Promise<Response> {
  const supabase = adminClient();
  const ws = workspaceId(request);
  const result = await buildPrimer(supabase, ws);
  return json(
    {
      workspace_id: ws,
      ...result,
    },
    200,
    origin,
  );
}

async function handleGraph(request: Request, origin: string | null): Promise<Response> {
  const supabase = adminClient();
  const ws = workspaceId(request);

  const [{ data: entities }, { data: relations }] = await Promise.all([
    supabase
      .from("form_entities")
      .select("id, name, entity_type, form_observations(content)")
      .eq("workspace_id", ws)
      .order("name"),
    supabase
      .from("form_relations")
      .select("relation_type, from_entity_id, to_entity_id")
      .eq("workspace_id", ws),
  ]);

  const nameById = new Map(
    (entities ?? []).map((entity) => [entity.id as string, entity.name as string]),
  );

  return json(
    {
      workspace_id: ws,
      entities: (entities ?? []).map((entity) => ({
        name: entity.name,
        entityType: entity.entity_type,
        observations: ((entity.form_observations ?? []) as Array<{ content: string }>).map(
          (item) => item.content,
        ),
      })),
      relations: (relations ?? []).map((relation) => ({
        from: nameById.get(relation.from_entity_id as string),
        to: nameById.get(relation.to_entity_id as string),
        relationType: relation.relation_type,
      })),
    },
    200,
    origin,
  );
}

async function handleObservations(
  request: Request,
  origin: string | null,
): Promise<Response> {
  const body = (await request.json()) as {
    entityName?: string;
    contents?: string[];
    source?: string;
  };

  if (!body.entityName?.trim() || !body.contents?.length) {
    return json({ error: "entityName and contents are required" }, 400, origin);
  }

  const supabase = adminClient();
  const ws = workspaceId(request);
  const entityName = body.entityName.trim();
  const source = body.source?.trim() || "api";

  let { data: entity } = await supabase
    .from("form_entities")
    .select("id")
    .eq("workspace_id", ws)
    .eq("name", entityName)
    .maybeSingle();

  if (!entity) {
    const { data: created, error: createError } = await supabase
      .from("form_entities")
      .insert({
        workspace_id: ws,
        name: entityName,
        entity_type: "concept",
      })
      .select("id")
      .single();
    if (createError) throw createError;
    entity = created;
  }

  const rows = body.contents
    .map((content) => content.trim())
    .filter(Boolean)
    .map((content) => ({
      entity_id: entity!.id,
      content,
      source,
    }));

  const { error: insertError } = await supabase.from("form_observations").insert(rows);
  if (insertError) throw insertError;

  return json({ ok: true, entityName, added: rows.length }, 201, origin);
}

async function handleEntities(
  request: Request,
  origin: string | null,
): Promise<Response> {
  const body = (await request.json()) as {
    entities?: Array<{
      name?: string;
      entityType?: string;
      observations?: string[];
    }>;
  };

  if (!body.entities?.length) {
    return json({ error: "entities array is required" }, 400, origin);
  }

  const supabase = adminClient();
  const ws = workspaceId(request);
  const created: string[] = [];

  for (const item of body.entities) {
    if (!item.name?.trim()) continue;
    const name = item.name.trim();
    const entityType = item.entityType?.trim() || "concept";

    let { data: entity } = await supabase
      .from("form_entities")
      .select("id")
      .eq("workspace_id", ws)
      .eq("name", name)
      .maybeSingle();

    if (!entity) {
      const { data: inserted, error } = await supabase
        .from("form_entities")
        .insert({ workspace_id: ws, name, entity_type: entityType })
        .select("id")
        .single();
      if (error) throw error;
      entity = inserted;
      created.push(name);
    }

    if (item.observations?.length) {
      const rows = item.observations
        .map((content) => content.trim())
        .filter(Boolean)
        .map((content) => ({
          entity_id: entity!.id,
          content,
          source: "api",
        }));
      if (rows.length) {
        const { error } = await supabase.from("form_observations").insert(rows);
        if (error) throw error;
      }
    }
  }

  return json({ ok: true, created }, 201, origin);
}

async function handleRelations(
  request: Request,
  origin: string | null,
): Promise<Response> {
  const body = (await request.json()) as {
    relations?: Array<{ from?: string; to?: string; relationType?: string }>;
  };

  if (!body.relations?.length) {
    return json({ error: "relations array is required" }, 400, origin);
  }

  const supabase = adminClient();
  const ws = workspaceId(request);

  async function entityId(name: string): Promise<string> {
    const trimmed = name.trim();
    let { data: entity } = await supabase
      .from("form_entities")
      .select("id")
      .eq("workspace_id", ws)
      .eq("name", trimmed)
      .maybeSingle();
    if (!entity) {
      const { data: inserted, error } = await supabase
        .from("form_entities")
        .insert({ workspace_id: ws, name: trimmed, entity_type: "concept" })
        .select("id")
        .single();
      if (error) throw error;
      entity = inserted;
    }
    return entity.id;
  }

  let added = 0;
  for (const relation of body.relations) {
    if (!relation.from?.trim() || !relation.to?.trim() || !relation.relationType?.trim()) {
      continue;
    }
    const fromId = await entityId(relation.from);
    const toId = await entityId(relation.to);
    const { error } = await supabase.from("form_relations").upsert(
      {
        workspace_id: ws,
        from_entity_id: fromId,
        to_entity_id: toId,
        relation_type: relation.relationType.trim(),
      },
      { onConflict: "workspace_id,from_entity_id,to_entity_id,relation_type" },
    );
    if (error) throw error;
    added += 1;
  }

  return json({ ok: true, added }, 201, origin);
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (!verifyApiKey(request)) {
    return unauthorized(origin);
  }

  const url = new URL(request.url);
  const path = url.pathname
    .replace(/^\/functions\/v1\/form-memory/, "")
    .replace(/^\/form-memory/, "")
    .replace(/\/$/, "") || "/";

  try {
    if (request.method === "GET" && (path === "" || path === "/health")) {
      return json({ ok: true, service: "form-memory" }, 200, origin);
    }

    if (request.method === "GET" && path === "/context") {
      return await handleContext(request, origin);
    }

    if (request.method === "GET" && path === "/graph") {
      return await handleGraph(request, origin);
    }

    if (request.method === "POST" && path === "/observations") {
      return await handleObservations(request, origin);
    }

    if (request.method === "POST" && path === "/entities") {
      return await handleEntities(request, origin);
    }

    if (request.method === "POST" && path === "/relations") {
      return await handleRelations(request, origin);
    }

    return json({ error: "Not found", path }, 404, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500, origin);
  }
});
