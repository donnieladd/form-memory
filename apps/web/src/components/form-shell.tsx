"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  GitBranch,
  Home,
  Network,
  Settings,
} from "lucide-react";
import RelayMark from "@/components/relay-mark";
import SignalDot from "@/components/signal-dot";

const NAV = [
  { href: "/", label: "Briefing", icon: Home },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/entities", label: "Entities", icon: Brain },
];

export default function FormShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-relay-page text-relay-ink">
      <aside className="w-[260px] shrink-0 border-r border-relay-line bg-[rgba(255,255,255,0.015)] backdrop-blur-xl sticky top-0 h-screen flex flex-col">
        <div className="px-7 pt-8 pb-2 flex items-center gap-3">
          <RelayMark size={42} className="text-relay-ink" />
        </div>
        <div className="px-7 pb-2 flex items-baseline gap-1.5">
          <span className="text-base tracking-[0.22em] font-semibold text-relay-ink">
            FORM
          </span>
          <span className="text-[10px] tracking-[0.24em] uppercase text-relay-muted">
            memory
          </span>
        </div>
        <div className="px-7 pb-5 flex items-center gap-2 text-[11px] text-relay-ink2">
          <SignalDot size={5} />
          <span className="tracking-wide">Personal brain · synced</span>
        </div>

        <nav className="flex-1 px-3">
          <div className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium ${
                    active
                      ? "bg-relay-signalSoft text-relay-ink signal-glow"
                      : "text-relay-ink2 hover:text-relay-ink hover:bg-white/[0.025]"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-relay-signal" />
                  )}
                  <Icon
                    size={15}
                    strokeWidth={1.5}
                    className={active ? "text-relay-signal" : ""}
                  />
                  <span className="flex-1">{label}</span>
                  {active && <SignalDot size={5} pulse={false} />}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-relay-line">
            <div className="text-label mb-2 px-5">Platforms</div>
            {["wispr-clone", "Brand Studio", "relume-clone"].map((platform) => (
              <div
                key={platform}
                className="flex items-center gap-3 pl-5 pr-3 py-2.5 text-sm text-relay-muted"
              >
                <GitBranch size={15} strokeWidth={1.5} />
                <span>{platform}</span>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-relay-line">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-relay-elevated border border-relay-line text-relay-ink flex items-center justify-center text-xs font-semibold">
              D
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-relay-ink truncate">
                Don
              </div>
              <div className="text-[11px] text-relay-muted truncate">
                workspace: personal
              </div>
            </div>
            <Settings size={14} className="text-relay-muted" />
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-12 py-10">
        <div className="max-w-[1280px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
