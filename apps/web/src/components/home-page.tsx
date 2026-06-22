"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { addObservation, getContext, type MemoryContext } from "@/lib/memory-client";
import { Brain, Sparkles, Zap } from "lucide-react";

export default function HomePage() {
  const [context, setContext] = useState<MemoryContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setContext(await getContext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await addObservation({
        entityName: "Don",
        contents: [note.trim()],
        source: "form-memory-ui",
      });
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
        <div>
          <h1 className="editorial-h1 text-5xl sm:text-6xl text-relay-ink mb-2">
            Memory Briefing
          </h1>
          <p className="text-sm text-relay-ink2">
            Shared context for wispr, Brand Studio, relume, and Cursor.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Brain}
          label="Entities"
          value={context?.entity_count ?? "—"}
        />
        <StatCard
          icon={Sparkles}
          label="Observations"
          value={context?.observation_count ?? "—"}
        />
        <StatCard icon={Zap} label="Workspace" value="personal" />
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <p className="mt-2 text-relay-muted text-xs">
            Set FORM_MEMORY_URL and FORM_MEMORY_API_KEY in apps/web/.env.local
            after Supabase deploy.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="glass ambient rounded-md p-8">
          <div className="text-label mb-4">Session primer</div>
          {loading ? (
            <p className="text-relay-muted text-sm">Loading…</p>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-relay-ink2">
              {context?.primer ?? "No context yet."}
            </pre>
          )}
        </section>

        <section className="glass ambient rounded-md p-8">
          <div className="text-label mb-4">Add observation</div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Something Form Memory should remember…"
            className="w-full min-h-40 rounded-md border border-relay-line bg-transparent px-4 py-3 text-sm text-relay-ink outline-none focus:border-relay-signal"
          />
          <Button
            className="mt-4 rounded-full"
            onClick={() => void saveNote()}
            disabled={saving || !note.trim()}
          >
            {saving ? "Saving…" : "Remember this"}
          </Button>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass ambient rounded-md p-6">
      <div className="flex items-center gap-2 text-relay-muted mb-3">
        <Icon size={14} strokeWidth={1.5} />
        <span className="text-label">{label}</span>
      </div>
      <div className="text-3xl font-light tracking-tight text-relay-ink">
        {value}
      </div>
    </div>
  );
}
