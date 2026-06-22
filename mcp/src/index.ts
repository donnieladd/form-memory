import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FormMemoryClient } from "../../packages/sdk/src/index.ts";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for Form Memory MCP`);
  }
  return value;
}

const client = new FormMemoryClient({
  url: requireEnv("FORM_MEMORY_URL"),
  apiKey: requireEnv("FORM_MEMORY_API_KEY"),
  workspaceId: process.env.FORM_MEMORY_WORKSPACE_ID,
});

const server = new McpServer({
  name: "form-memory",
  version: "0.1.0",
});

server.tool(
  "initialize_context",
  "Call at session start. Returns the Form Memory primer for this workspace.",
  {},
  async () => {
    const context = await client.getContext();
    return {
      content: [{ type: "text", text: context.primer }],
    };
  },
);

server.tool(
  "read_graph",
  "Read the full knowledge graph for the workspace.",
  {},
  async () => {
    const graph = await client.readGraph();
    return {
      content: [{ type: "text", text: JSON.stringify(graph, null, 2) }],
    };
  },
);

server.tool(
  "create_entities",
  "Create entities with optional observations.",
  {
    entities: z.array(
      z.object({
        name: z.string(),
        entityType: z.string().optional(),
        observations: z.array(z.string()).optional(),
      }),
    ),
  },
  async ({ entities }) => {
    const result = await client.createEntities({ entities });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "add_observations",
  "Add observations to an existing or new entity.",
  {
    entityName: z.string(),
    contents: z.array(z.string()),
    source: z.string().optional(),
  },
  async ({ entityName, contents, source }) => {
    const result = await client.addObservations({
      entityName,
      contents,
      source: source ?? "mcp",
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "create_relations",
  "Create relations between entities.",
  {
    relations: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
        relationType: z.string(),
      }),
    ),
  },
  async ({ relations }) => {
    const result = await client.createRelations({ relations });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "remember_voice_correction",
  "Store a voice/dictation correction (names, vocabulary, phrasing).",
  {
    correction: z.string(),
    entityName: z.string().optional(),
  },
  async ({ correction, entityName }) => {
    const result = await client.addObservations({
      entityName: entityName ?? "Voice Preferences",
      contents: [correction],
      source: "wispr",
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
