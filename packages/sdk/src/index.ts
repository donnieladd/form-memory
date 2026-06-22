export interface FormMemoryClientOptions {
  url: string;
  apiKey: string;
  workspaceId?: string;
  fetchImpl?: typeof fetch;
}

export interface MemoryContext {
  workspace_id: string;
  primer: string;
  entity_count: number;
  observation_count: number;
}

export interface MemoryGraph {
  workspace_id: string;
  entities: Array<{
    name: string;
    entityType: string;
    observations: string[];
  }>;
  relations: Array<{
    from: string | undefined;
    to: string | undefined;
    relationType: string;
  }>;
}

function trimUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export class FormMemoryClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly workspaceId?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: FormMemoryClientOptions) {
    this.baseUrl = trimUrl(options.url);
    this.apiKey = options.apiKey;
    this.workspaceId = options.workspaceId;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private headers(extra?: HeadersInit): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...(this.workspaceId ? { "X-Form-Workspace": this.workspaceId } : {}),
      ...extra,
    };
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: this.headers(init?.headers),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Form Memory ${response.status}: ${detail}`);
    }
    return (await response.json()) as T;
  }

  health(): Promise<{ ok: boolean; service: string }> {
    return this.request("/health");
  }

  getContext(): Promise<MemoryContext> {
    return this.request("/context");
  }

  readGraph(): Promise<MemoryGraph> {
    return this.request("/graph");
  }

  addObservations(input: {
    entityName: string;
    contents: string[];
    source?: string;
  }): Promise<{ ok: boolean; entityName: string; added: number }> {
    return this.request("/observations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  createEntities(input: {
    entities: Array<{
      name: string;
      entityType?: string;
      observations?: string[];
    }>;
  }): Promise<{ ok: boolean; created: string[] }> {
    return this.request("/entities", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  createRelations(input: {
    relations: Array<{ from: string; to: string; relationType: string }>;
  }): Promise<{ ok: boolean; added: number }> {
    return this.request("/relations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}

export async function fetchMemoryPrimer(
  options: FormMemoryClientOptions,
): Promise<string | null> {
  try {
    const client = new FormMemoryClient(options);
    const context = await client.getContext();
    return context.primer;
  } catch {
    return null;
  }
}
