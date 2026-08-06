"use client";

import { useEffect } from "react";
import { useStore } from "./store";
import { Canvas } from "./Canvas";
import { Inspector, Toolbar, StatsPanel } from "./Chrome";
import { Atlas, CommandPalette, Minimap, Presentation, SearchModal } from "./Panels";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

export function MindMapApp() {
  const ui = useStore((s) => s.ui);
  const settings = useStore((s) => s.project.settings);
  useKeyboardShortcuts();

  useEffect(() => {
    const cls =
      settings.theme === "light"
        ? "mm-theme-light"
        : settings.theme === "amoled"
          ? "mm-theme-amoled"
          : "mm-theme-dark";
    document.documentElement.classList.remove(
      "mm-theme-light",
      "mm-theme-dark",
      "mm-theme-amoled",
    );
    document.documentElement.classList.add(cls);
  }, [settings.theme]);

  return (
    <div className="relative flex h-[calc(100vh-120px)] min-h-[720px] w-full flex-col gap-3 px-5 py-4 md:px-8 md:py-6">
      <Toolbar />
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[auto,1fr,auto]">
        {ui.atlasOpen && (
          <div className="min-h-0 w-60 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <Atlas />
          </div>
        )}
        <div className="relative min-h-0 min-w-0">
          <Canvas />
          <Minimap />
          <Presentation />
          <FloatingHelp />
        </div>
        {ui.inspectorOpen && (
          <div className="min-h-0 w-80 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur">
            <Inspector />
          </div>
        )}
      </div>
      <SearchModal />
      <CommandPalette />
    </div>
  );
}

function FloatingHelp() {
  return (
    <div className="pointer-events-none absolute right-4 top-4 max-w-xs rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-400 backdrop-blur">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
        Quick tips
      </div>
      <div>• <span className="text-zinc-200">Double-click</span> canvas → new node</div>
      <div>• <span className="text-zinc-200">Drag port dots</span> → connect nodes</div>
      <div>• <span className="text-zinc-200">Space + drag</span> / middle-mouse / touch → pan</div>
      <div>• <span className="text-zinc-200">Ctrl + scroll</span> → cursor-centered zoom</div>
      <div>• <span className="text-zinc-200">Shift + drag</span> → multiselect / marquee</div>
      <div>• <span className="text-zinc-200">Tab</span> → child node connected to selection</div>
      <div>• <span className="text-zinc-200">Ctrl+F</span> search · <span className="text-zinc-200">Ctrl+P</span> commands · <span className="text-zinc-200">Ctrl+G</span> layout</div>
    </div>
  );
}
