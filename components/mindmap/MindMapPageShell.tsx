"use client";

import dynamic from "next/dynamic";

const MindMapApp = dynamic(
  () =>
    import("@/components/mindmap/MindMapApp").then((m) => m.MindMapApp),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto flex h-[80vh] items-center justify-center text-zinc-400">
        Loading mindmap engine…
      </div>
    ),
  },
);

export function MindMapPageShell() {
  return <MindMapApp />;
}
