"use client";

import { useEffect, useState } from "react";
import { getGraph, type MemoryGraph } from "@/lib/memory-client";

export default function GraphPage() {
  const [graph, setGraph] = useState<MemoryGraph | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGraph()
      .then(setGraph)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load graph"),
      );
  }, []);

  return (
    <div className="animate-fade-up">
      <h1 className="editorial-h1 text-5xl text-relay-ink mb-8">Knowledge graph</h1>
      {error && (
        <p className="text-red-300 text-sm mb-6">{error}</p>
      )}
      <div className="grid gap-4">
        {(graph?.entities ?? []).map((entity) => (
          <article key={entity.name} className="glass ambient rounded-md p-6">
            <div className="flex items-baseline justify-between gap-4 mb-3">
              <h2 className="text-xl font-medium text-relay-ink">{entity.name}</h2>
              <span className="text-label">{entity.entityType}</span>
            </div>
            <ul className="space-y-2">
              {entity.observations.map((observation) => (
                <li
                  key={observation}
                  className="text-sm text-relay-ink2 leading-relaxed border-l border-relay-line pl-4"
                >
                  {observation}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
