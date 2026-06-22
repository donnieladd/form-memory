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
    from?: string;
    to?: string;
    relationType: string;
  }>;
}

async function memoryFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/memory${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Memory API ${response.status}`);
  }
  return (await response.json()) as T;
}

export function getContext(): Promise<MemoryContext> {
  return memoryFetch("/context");
}

export function getGraph(): Promise<MemoryGraph> {
  return memoryFetch("/graph");
}

export function addObservation(input: {
  entityName: string;
  contents: string[];
  source?: string;
}): Promise<{ ok: boolean }> {
  return memoryFetch("/observations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
