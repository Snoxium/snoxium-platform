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
      <div className="relative min-h-0 flex-1">
        <div className="relative h-full w-full min-h-0 min-w-0">
          <Canvas />
          <Minimap />
          <Presentation />
          <FloatingHelp />
        </div>
        {ui.atlasOpen && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-40 flex w-64 items-stretch p-0 pr-3">
            <div className="pointer-events-auto h-full w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl">
              <Atlas />
            </div>
          </div>
        )}
        {ui.inspectorOpen && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-40 flex w-80 items-stretch p-0 pl-3">
            <div className="pointer-events-auto h-full w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl">
              <Inspector />
            </div>
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
      <div>• <span className="text-zinc-200">Double-click</span> canvas → new node at cursor</div>
      <div>• <span className="text-zinc-200">Drag port dots</span> → connect nodes</div>
      <div>• <span className="text-zinc-200">Space + drag</span> / middle / right-mouse / touch → pan</div>
      <div>• <span className="text-zinc-200">Scroll (wheel)</span> → zoom at cursor</div>
      <div>• <span className="text-zinc-200">Shift + scroll</span> → pan page</div>
      <div>• <span className="text-zinc-200">Shift + drag</span> → multiselect / marquee</div>
      <div>• <span className="text-zinc-200">N</span> → new node at viewport center</div>
      <div>• <span className="text-zinc-200">Tab</span> → child connected node</div>
      <div>• <span className="text-zinc-200">Enter</span> → sibling connected node</div>
      <div>• <span className="text-zinc-200">Delete</span> / Backspace → remove selection</div>
      <div>• <span className="text-zinc-200">Ctrl+L</span> link · <span className="text-zinc-200">Ctrl+D</span> dup · <span className="text-zinc-200">=</span>/<span className="text-zinc-200">-</span> zoom</div>
      <div>• <span className="text-zinc-200">Ctrl+F</span> search · <span className="text-zinc-200">Ctrl+P</span> commands · <span className="text-zinc-200">Ctrl+G</span> layout</div>
    </div>
  );
}
