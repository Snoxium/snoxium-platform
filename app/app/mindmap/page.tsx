import Link from "next/link";
import type { Metadata } from "next";
import { MindMapPageShell } from "@/components/mindmap/MindMapPageShell";

export const metadata: Metadata = {
  title: "Mindmap",
  description:
    "Snoxium Mindmap — infinite canvas, worlds, nodes, linked clones, portals, and offline persistence.",
};

export default function MindMapPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-3 md:px-5 md:py-4">
      <div className="mb-2 flex items-end justify-between gap-4 px-2 pt-2">
        <div>
          <div className="text-[11px] font-medium tracking-[0.2em] text-cyan-300/80">
            SNOXIUM · APP
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            🧠 Mindmap
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-200/70">
            Personal infinite canvas for ideas, projects, and worlds. 100%
            offline, no login, autosaves to your browser.
          </p>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/games"
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.06]"
          >
            ← Back to site
          </Link>
        </div>
      </div>
      <MindMapPageShell />
    </div>
  );
}
