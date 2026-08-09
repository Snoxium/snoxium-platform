"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { actions, useStore, viewportSizeRef } from "./store";
import type { MMProject } from "./types";
import { searchInProject } from "./engine";

export function SearchModal() {
  const open = useStore((s) => s.ui.searchOpen);
  const project = useStore((s) => s.project);
  const activeMatch = useStore((s) => s.ui.activeMatch);
  const searchingFor = useStore((s) => s.ui.searchingFor);
  const [q, setQ] = useState(searchingFor ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => searchInProject(project, q).slice(0, 60), [project, q]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQ("");
  }, [open]);

  useEffect(() => {
    actions.setSearchQuery(q, results.map((r) => r.nodeId));
  }, [q, results]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-8 backdrop-blur-sm"
      onClick={() => actions.setSearch(false)}
    >
      <div
        className="mt-20 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b12] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="text-zinc-400">🔍</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search nodes, notes, tags… (Fuzzy match)"
            className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-400">
            Esc to close
          </span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {!results.length && (
            <div className="p-8 text-center text-xs text-zinc-500">
              {q ? "No matches." : "Type to search across nodes."}
            </div>
          )}
          {results.map((r, i) => {
            const node = project.nodes[r.nodeId];
            if (!node) return null;
            const active = activeMatch === r.nodeId;
            return (
              <button
                key={r.nodeId + i}
                onClick={() => actions.jumpToNode(r.nodeId)}
                className={
                  "flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition " +
                  (active ? "bg-cyan-400/10" : "hover:bg-white/[0.03]")
                }
              >
                <div
                  className="mt-1 h-8 w-8 flex-none rounded-lg border text-center text-sm leading-8"
                  style={{
                    background: (node.color?.fill ?? "#fff0").toString(),
                    borderColor: node.color?.stroke ?? "rgba(255,255,255,0.1)",
                  }}
                >
                  {node.icon ?? "💡"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-100">
                    {node.title || <span className="text-zinc-500">Untitled</span>}
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-widest text-zinc-500">
                    {r.field}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-zinc-400">
                    {r.snippet || "—"}
                  </div>
                </div>
                <span className="mt-1 flex-none rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-300">
                  Jump →
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const open = useStore((s) => s.ui.commandPaletteOpen);
  const project = useStore((s) => s.project);
  const ui = useStore((s) => s.ui);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commands = useMemo(() => {
    const world = project.worlds[project.currentWorldId];
    const parent = world?.parentWorldId ? project.worlds[world.parentWorldId] : null;
    const base: { label: string; hint?: string; run: () => void; icon: string }[] = [
      { icon: "🏠", label: "Go to root world", run: () => actions.enterWorld(project.rootWorldId) },
      { icon: "🔙", label: "Back to parent world" + (parent ? ` · ${parent.name}` : ""), hint: "[", run: () => actions.leaveToParentWorld() },
      { icon: "➕", label: "New world…", run: () => {
        const id = actions.createWorld("New World", "🧩", project.currentWorldId);
        const nid = actions.createNodeAt(0, 0, { title: "Welcome" });
        actions.enterWorld(id);
        actions.selectNode(nid);
      } },
      { icon: "📐", label: "Auto-layout current world", hint: "Ctrl+G", run: () => actions.layoutAuto() },
      { icon: "🎯", label: "Fit selection to view", hint: "F", run: () => actions.fitSelection() },
      { icon: "🏡", label: "Reset camera / Fit all", hint: "H", run: () => actions.resetCamera() },
      { icon: "🔍", label: "Open search", hint: "Ctrl+F", run: () => { actions.setCommandPalette(false); actions.setSearch(true, ""); } },
      { icon: "⚙️", label: "Toggle inspector", run: () => actions.setInspector(!ui.inspectorOpen) },
      { icon: "🗺", label: "Toggle atlas", run: () => actions.setAtlas(!ui.atlasOpen) },
      { icon: "⎘", label: "Duplicate selected", hint: "Ctrl+D", run: () => actions.duplicateNodes(ui.selectedNodeIds) },
      { icon: "🔗", label: "Link selected nodes", run: () => actions.linkNodes(ui.selectedNodeIds) },
      { icon: "🗑", label: "Delete selected", hint: "Del", run: () => actions.deleteNodes(ui.selectedNodeIds) },
      { icon: "↶", label: "Undo", hint: "Ctrl+Z", run: () => actions.undo() },
      { icon: "↷", label: "Redo", hint: "Ctrl+Y", run: () => actions.redo() },
      { icon: "💾", label: "Force save now", hint: "Ctrl+S", run: () => actions.saveNow() },
      { icon: "📸", label: "Take snapshot (backup)", run: () => actions.takeSnapshot() },
      { icon: "🎬", label: "Start presentation mode", run: () => actions.startPresentation() },
      { icon: "1️⃣", label: "Zoom to 100%", hint: "1", run: () => actions.setZoom(1) },
    ];
    for (const n of Object.values(project.nodes).filter((x) => x.worldId === project.currentWorldId).slice(0, 50)) {
      base.push({
        icon: n.icon ?? "💡",
        label: "Jump · " + (n.title || "Untitled"),
        hint: n.subtitle,
        run: () => actions.jumpToNode(n.id),
      });
    }
    for (const w of Object.values(project.worlds).slice(0, 40)) {
      base.push({
        icon: w.emoji ?? "🌐",
        label: "World · " + w.name,
        run: () => actions.enterWorld(w.id),
      });
    }
    return base;
  }, [project, ui]);

  const filtered = useMemo(() => {
    if (!q.trim()) return commands.slice(0, 60);
    const s = q.toLowerCase();
    return commands
      .map((c) => ({
        c,
        sc: (c.label + " " + (c.hint ?? "")).toLowerCase().includes(s) ? 1 : 0,
      }))
      .filter((x) => x.sc > 0)
      .map((x) => x.c)
      .slice(0, 60);
  }, [commands, q]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQ("");
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-8 backdrop-blur-sm"
      onClick={() => actions.setCommandPalette(false)}
    >
      <div
        className="mt-20 w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b12] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="text-zinc-400">⌘</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Commands, jumps, worlds…"
            className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-400">
            Esc
          </span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                actions.setCommandPalette(false);
                c.run();
              }}
              className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-2 text-left text-sm text-zinc-200 hover:bg-white/[0.04]"
            >
              <span className="h-7 w-7 flex-none text-center leading-7">{c.icon}</span>
              <span className="flex-1 truncate">{c.label}</span>
              {c.hint && <span className="text-[11px] text-zinc-500">{c.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Minimap() {
  const project = useStore((s) => s.project);
  const camera = useStore((s) => s.camera);
  const settings = project.settings;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<null | { lastX: number; lastY: number }>(null);

  if (!settings.minimapEnabled) return null;
  const nodes = Object.values(project.nodes).filter((n) => n.worldId === project.currentWorldId);

  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const n of nodes) {
    x1 = Math.min(x1, n.x);
    y1 = Math.min(y1, n.y);
    x2 = Math.max(x2, n.x + n.w);
    y2 = Math.max(y2, n.y + n.h);
  }
  const pad = 80;
  if (isFinite(x1)) {
    x1 -= pad; y1 -= pad; x2 += pad; y2 += pad;
  } else {
    x1 = -400; y1 = -300; x2 = 400; y2 = 300;
  }
  const mapW = x2 - x1;
  const mapH = y2 - y1;

  const readDims = () => {
    const el = containerRef.current;
    const mw = el?.clientWidth ?? 200;
    const mh = el?.clientHeight ?? 180;
    const sc = Math.min(mw / mapW, mh / mapH);
    const offX = (mw - mapW * sc) / 2;
    const offY = (mh - mapH * sc) / 2;
    return { mw, mh, sc, offX, offY };
  };

  const worldToMini = (wx: number, wy: number) => {
    const { sc, offX, offY } = readDims();
    return {
      x: offX + (wx - x1) * sc,
      y: offY + (wy - y1) * sc,
      sc,
    };
  };

  const miniToWorld = (mx: number, my: number) => {
    const { sc, offX, offY } = readDims();
    return {
      wx: (mx - offX) / sc + x1,
      wy: (my - offY) / sc + y1,
      sc,
    };
  };

  const vw = viewportSizeRef.current.w / Math.max(0.01, camera.zoom);
  const vh = viewportSizeRef.current.h / Math.max(0.01, camera.zoom);
  const vx = -camera.x / Math.max(0.01, camera.zoom);
  const vy = -camera.y / Math.max(0.01, camera.zoom);
  const { sc } = worldToMini(0, 0);

  const centerOn = (mx: number, my: number) => {
    const { wx, wy } = miniToWorld(mx, my);
    const vwActual = viewportSizeRef.current.w / Math.max(0.01, camera.zoom);
    const vhActual = viewportSizeRef.current.h / Math.max(0.01, camera.zoom);
    const camX = -(wx - vwActual / 2) * camera.zoom;
    const camY = -(wy - vhActual / 2) * camera.zoom;
    actions.setCamera(camX, camY, camera.zoom);
  };

  if (!nodes.length) {
    return (
      <div
        ref={containerRef}
        data-node-minimap
        className="absolute bottom-4 right-4 h-[180px] w-[220px] overflow-hidden rounded-xl border border-white/10 bg-black/50 backdrop-blur"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      data-node-minimap
      className="absolute bottom-4 right-4 h-[180px] w-[220px] select-none overflow-hidden rounded-xl border border-white/10 bg-black/50 p-1 backdrop-blur"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        drag.current = { lastX: mx, lastY: my };
        const vp = worldToMini(vx, vy);
        const vpW = vw * sc;
        const vpH = vh * sc;
        const insideBox =
          mx >= vp.x - 2 && mx <= vp.x + vpW + 2 && my >= vp.y - 2 && my <= vp.y + vpH + 2;
        if (!insideBox) centerOn(mx, my);
        try { el.setPointerCapture(e.pointerId); } catch {}
        e.preventDefault();
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const dmx = mx - drag.current.lastX;
        const dmy = my - drag.current.lastY;
        drag.current = { lastX: mx, lastY: my };
        const wx = -dmx / Math.max(0.0001, sc);
        const wy = -dmy / Math.max(0.0001, sc);
        actions.nudgeCamera(wx * camera.zoom, wy * camera.zoom);
      }}
      onPointerUp={(e) => {
        drag.current = null;
        try {
          containerRef.current?.releasePointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerCancel={(e) => {
        drag.current = null;
        try {
          containerRef.current?.releasePointerCapture(e.pointerId);
        } catch {}
      }}
    >
      <svg width="100%" height="100%" className="overflow-visible pointer-events-none">
        {nodes.map((n) => {
          const p = worldToMini(n.x, n.y);
          return (
            <rect
              key={n.id}
              x={p.x}
              y={p.y}
              width={Math.max(1, n.w * sc)}
              height={Math.max(1, n.h * sc)}
              rx={1.5}
              fill={n.color?.stroke ?? "#22d3ee"}
              opacity={0.7}
            />
          );
        })}
        <rect
          x={worldToMini(vx, vy).x}
          y={worldToMini(vx, vy).y}
          width={Math.max(2, vw * sc)}
          height={Math.max(2, vh * sc)}
          fill="rgba(34,211,238,0.08)"
          stroke="#22d3ee"
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />
      </svg>
    </div>
  );
}

export function Atlas() {
  const project = useStore((s) => s.project);
  const open = useStore((s) => s.ui.atlasOpen);
  const [editing, setEditing] = useState<string | null>(null);
  const [newWorldName, setNewWorldName] = useState("");

  const worlds = useMemo(() => Object.values(project.worlds), [project.worlds]);
  if (!open) return null;

  return (
    <div className="flex h-full flex-col gap-2 border-r border-white/10 bg-black/30 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
          🗺 Atlas
        </div>
        <button
          onClick={() => actions.setAtlas(false)}
          className="text-xs text-zinc-500 hover:text-zinc-200"
        >
          ×
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2 text-xs">
        <TreeWorld
          project={project}
          worldId={project.rootWorldId}
          depth={0}
          editing={editing}
          setEditing={setEditing}
        />
      </div>
      <form
        className="flex gap-1 border-t border-white/10 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newWorldName.trim()) return;
          actions.createWorld(newWorldName.trim(), "🧩", project.currentWorldId);
          setNewWorldName("");
        }}
      >
        <input
          value={newWorldName}
          onChange={(e) => setNewWorldName(e.target.value)}
          placeholder="+ New sub-world"
          className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs outline-none focus:border-cyan-400/40"
        />
        <button className="rounded-md border border-white/10 bg-white/[0.04] px-2 text-zinc-200 hover:bg-white/10">
          Add
        </button>
      </form>
    </div>
  );
}

function TreeWorld({
  project,
  worldId,
  depth,
  editing,
  setEditing,
}: {
  project: MMProject;
  worldId: string;
  depth: number;
  editing: string | null;
  setEditing: (s: string | null) => void;
}) {
  const w = project.worlds[worldId];
  if (!w) return null;
  const active = w.id === project.currentWorldId;
  const children = Object.values(project.worlds).filter(
    (x) => x.parentWorldId === w.id,
  );
  const count = Object.values(project.nodes).filter(
    (n) => n.worldId === w.id,
  ).length;
  return (
    <div>
      <button
        onClick={() => actions.enterWorld(w.id)}
        onDoubleClick={() => setEditing(w.id)}
        className={
          "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition " +
          (active
            ? "bg-cyan-400/10 text-cyan-200"
            : "text-zinc-200 hover:bg-white/[0.04]")
        }
        style={{ paddingLeft: 8 + depth * 10 }}
      >
        <span>{w.emoji ?? "🌐"}</span>
        {editing === w.id ? (
          <input
            autoFocus
            value={w.name}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => actions.renameWorld(w.id, e.target.value, w.emoji)}
            onBlur={() => setEditing(null)}
            className="flex-1 rounded-md border border-cyan-400/40 bg-black/50 px-1 text-xs outline-none"
          />
        ) : (
          <span className="flex-1 truncate">{w.name}</span>
        )}
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-zinc-400">
          {count}
        </span>
      </button>
      {children.map((c) => (
        <TreeWorld
          key={c.id}
          project={project}
          worldId={c.id}
          depth={depth + 1}
          editing={editing}
          setEditing={setEditing}
        />
      ))}
    </div>
  );
}

export function Presentation() {
  const ui = useStore((s) => s.ui);
  const project = useStore((s) => s.project);
  if (!ui.presentation.active) return null;
  const cur = ui.presentation.nodeIds[ui.presentation.index];
  const name = cur ? project.nodes[cur]?.title ?? "" : "";
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-xs text-zinc-200 backdrop-blur">
      <button
        className="pointer-events-auto mr-2 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 hover:bg-white/10"
        onClick={() => actions.stepPresentation(-1)}
      >
        ◀ Prev
      </button>
      <span className="font-mono text-cyan-300">
        {ui.presentation.index + 1} / {ui.presentation.nodeIds.length || 0}
      </span>
      <span className="mx-2 text-zinc-500">·</span>
      <span className="text-zinc-300">{name}</span>
      <button
        className="pointer-events-auto ml-2 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 hover:bg-white/10"
        onClick={() => actions.stepPresentation(1)}
      >
        Next ▶
      </button>
      <button
        className="pointer-events-auto ml-2 rounded-md border border-rose-400/20 bg-rose-400/10 px-2 py-1 text-rose-200 hover:bg-rose-400/20"
        onClick={() => actions.stopPresentation()}
      >
        Stop
      </button>
    </div>
  );
}
