"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { actions, getState, setViewportSize, useStore, viewportSizeRef } from "./store";
import { download, exportMapImage } from "./exporters";
import { NodeEditor } from "./NodeEditor";

export function MindMapApp() {
  const state = useStore(s => s);
  const { project, ui, camera } = state;
  const [worldsOpen, setWorldsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const selected = ui.selectedNodeIds.length === 1 ? project.nodes[ui.selectedNodeIds[0]] : undefined;
  const edge = ui.selectedEdgeIds.length === 1 ? project.edges[ui.selectedEdgeIds[0]] : undefined;
  const current = project.worlds[project.currentWorldId];
  const crumbs = [];
  const visited = new Set<string>();
  let world = current;
  while (world && !visited.has(world.id)) {
    visited.add(world.id); crumbs.unshift(world);
    world = project.worlds[world.parentWorldId ?? ""];
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const s = getState();
      if (mod && key === "z") { e.preventDefault(); if (e.shiftKey) actions.redo(); else actions.undo(); }
      else if (mod && key === "y") { e.preventDefault(); actions.redo(); }
      else if (mod && key === "s") { e.preventDefault(); actions.saveNow(); }
      else if (mod && key === "d") { e.preventDefault(); actions.duplicateNodes(s.ui.selectedNodeIds); }
      else if (key === "escape") { actions.cancelConnect(); actions.clearSelection(); actions.setInspector(false); }
      else if (key === "delete" || key === "backspace") {
        e.preventDefault();
        if (s.ui.selectedNodeIds.length) actions.deleteNodes(s.ui.selectedNodeIds);
        else actions.deleteEdges(s.ui.selectedEdgeIds);
      } else if (!mod && key === "n") {
        const size = viewportSizeRef.current;
        actions.createNodeAt((size.w / 2 - s.camera.x) / s.camera.zoom, (size.h / 2 - s.camera.y) / s.camera.zoom);
      } else if (!mod && key === "f") actions.fitSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const add = (isWorld = false) => {
    const size = viewportSizeRef.current;
    let x = (size.w / 2 - camera.x) / camera.zoom;
    let y = (size.h / 2 - camera.y) / camera.zoom;
    const existing = Object.values(project.nodes).filter(n => n.worldId === current.id && !n.hidden);
    // Keep a newly added card clear of existing cards instead of stacking every addition at the centre.
    const cx = x, cy = y;
    for (let ring = 0; ring < 20; ring++) {
      const candidate = { x: cx + (ring % 3 - 1) * 280, y: cy + Math.floor(ring / 3) * 180 };
      if (!existing.some(n => candidate.x - 120 < n.x + n.w + 20 && candidate.x + 120 > n.x - 20 && candidate.y - 65 < n.y + n.h + 20 && candidate.y + 65 > n.y - 20)) {
        x = candidate.x; y = candidate.y; break;
      }
    }
    const id = actions.createNodeAt(x, y,
      { title: isWorld ? "New world" : "New idea", kind: isWorld ? "world" : "text", w: 240, h: 130 });
    requestAnimationFrame(() => {
      const canvas = document.querySelector<HTMLElement>("[data-mindmap-canvas]");
      if (canvas) setViewportSize(canvas.clientWidth, canvas.clientHeight);
      actions.fitNode(id);
    });
    return id;
  };
  const backup = () => download(`${project.name.replace(/[^a-z0-9-]/gi, "-") || "mindmap"}.json`, actions.exportJSON(), "application/json");
  const image = async () => {
    try { await exportMapImage(project, "png"); setMessage("PNG downloaded."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Export failed. Try JSON backup instead."); }
  };
  const matches = search.trim() ? Object.values(project.nodes).filter(n => n.title.toLowerCase().includes(search.toLowerCase())).slice(0, 20) : [];

  return <div className="mm-app">
    <div className="mm-toolbar">
      <button onClick={() => setWorldsOpen(v => !v)} aria-expanded={worldsOpen}>◈ Worlds</button>
      <div className="mm-breadcrumbs" aria-label="World path">{crumbs.map((w, index) => <span key={w.id}>{index > 0 && <span className="mm-muted"> / </span>}<button onClick={() => { actions.cancelConnect(); actions.enterWorld(w.id); }}>{w.name}</button></span>)}</div>
      <div className="mm-tools">
        <div className="mm-tool-group" aria-label="Create nodes">
        <button onClick={() => add()} title="Add node (N)">+ Node</button>
        <button onClick={() => add(true)}>+ World</button>
        </div><div className="mm-tool-group" aria-label="History">
        <button onClick={() => actions.undo()} title="Undo (Ctrl+Z)" aria-label="Undo">↶</button>
        <button onClick={() => actions.redo()} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">↷</button>
        </div><div className="mm-tool-group" aria-label="Canvas view">
        <button onClick={() => actions.resetCamera()} title="Fit all nodes">Fit</button>
        <button onClick={() => actions.setZoom(camera.zoom / 1.2)} aria-label="Zoom out">−</button>
        <button onClick={() => actions.setZoom(1)} title="Reset zoom">{Math.round(camera.zoom * 100)}%</button>
        <button onClick={() => actions.setZoom(camera.zoom * 1.2)} aria-label="Zoom in">+</button>
        </div><button className={moreOpen ? "is-active" : ""} onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen}>Files & settings</button>
      </div>
    </div>
    {moreOpen && <div className="mm-filebar" role="region" aria-label="Files and settings">
      <div className="mm-settings-names">
        <label>Map name<input aria-label="Map name" value={project.name} onChange={e => actions.setProjectName(e.target.value)} /></label>
        <label>World name<input aria-label="World name" value={current.name} onChange={e => actions.renameWorld(current.id, e.target.value)} /></label>
      </div>
      <div className="mm-settings-files" aria-label="Import and export">
        <div className="mm-button-row"><button onClick={backup}>Export JSON</button><button onClick={() => fileInput.current?.click()}>Import JSON</button><button onClick={image}>PNG</button></div>
        <small className="mm-muted">JSON: all worlds · PNG: current world</small>
      </div>
      <div className="mm-settings-preferences" aria-label="Canvas preferences">
        <label className="mm-check"><input type="checkbox" checked={project.settings.gridEnabled} onChange={e => actions.updateSettings({ gridEnabled: e.target.checked })} />Grid</label>
        <label className="mm-check"><input type="checkbox" checked={project.settings.snapToGrid} onChange={e => actions.updateSettings({ snapToGrid: e.target.checked })} />Snap to grid</label>
        <div className="mm-settings-save"><label className="mm-check"><input type="checkbox" checked={project.settings.autoSave} onChange={e => actions.updateSettings({ autoSave: e.target.checked })} />Autosave</label>{!project.settings.autoSave && <button onClick={() => actions.saveNow()}>Save now</button>}</div>
      </div>
    </div>}
    <input ref={fileInput} aria-label="Import mindmap file" type="file" accept=".json,application/json" hidden onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = "";
      if (!file) return;
      try {
        const text = await file.text();
        // Validate before asking to replace anything; invalid imports leave the current map untouched.
        const { parseProject } = await import("./validation");
        parseProject(text);
        if (!confirm("Replace this map with the imported map? Download a backup first if you want to keep both. You can also undo the import.")) return;
        actions.importJSON(text); setMessage("Map imported.");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Could not import this file."); }
    }} />
    {state.saveError && <div className="mm-error" role="alert">{state.saveError} <button onClick={backup}>Export JSON</button></div>}
    {state.recoveryRaw && <div className="mm-error"><button onClick={() => download("mindmap-recovery.json", state.recoveryRaw!, "application/json")}>Download original recovery file</button></div>}
    {message && <div className="mm-notice" role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss message">×</button></div>}
    <div className="mm-workspace">
      {worldsOpen && <aside className="mm-worlds" aria-label="Worlds">
        <div className="mm-panel-heading"><strong>Your worlds</strong><button onClick={() => setWorldsOpen(false)} aria-label="Close worlds">×</button></div>
        <p className="mm-muted">A world is a separate canvas. Open a world node to go inside; use the path above to come back.</p>
        {Object.values(project.worlds).map(w => <button className={w.id === current.id ? "is-active" : ""} key={w.id} onClick={() => { actions.cancelConnect(); actions.enterWorld(w.id); }}>{w.parentWorldId ? "↳ " : "◈ "}{w.name}</button>)}
        <label>Find a node<input type="search" placeholder="Search all worlds…" value={search} onChange={e => setSearch(e.target.value)} /></label>
        {matches.map(n => <button key={n.id} onClick={() => { actions.enterWorld(n.worldId); actions.selectNode(n.id); actions.fitNode(n.id); }}>{n.title}<small>{project.worlds[n.worldId]?.name}</small></button>)}
      </aside>}
      <Canvas />
      {ui.inspectorOpen && (selected || edge) && <aside className="mm-inspector" aria-label="Selection details">
        <div className="mm-panel-heading"><strong>{selected ? "Node" : "Connection"}</strong><button onClick={() => actions.setInspector(false)} aria-label="Close details">×</button></div>
        {selected && <NodeEditor key={selected.id} node={selected} />}
        {edge && <>
          <label>Label<input aria-label="Connection label" value={edge.label ?? ""} onChange={e => actions.updateEdge(edge.id, { label: e.target.value })} /></label>
          <label>Line style<select value={edge.style ?? "bezier"} onChange={e => actions.updateEdge(edge.id, { style: e.target.value as "bezier" | "straight" | "orthogonal" })}><option value="bezier">Curved</option><option value="straight">Straight</option><option value="orthogonal">Right angles</option></select></label>
          <label>Line color<input type="color" aria-label="Connection color" value={edge.color ?? "#94a3b8"} onChange={e => actions.updateEdge(edge.id, { color: e.target.value })} /></label>
          <label>Arrow direction<select value={edge.direction ?? "forward"} onChange={e => actions.updateEdge(edge.id, { direction: e.target.value as "none" | "forward" | "back" | "both" })}><option value="none">No arrows</option><option value="forward">Forward</option><option value="back">Back</option><option value="both">Both ends</option></select></label>
          <label>Line width<input type="number" min="1" max="12" value={edge.thickness ?? 2} onChange={e => actions.updateEdge(edge.id, { thickness: Math.max(1, Math.min(12, Number(e.target.value) || 2)) })} /></label>
          <label className="mm-check"><input type="checkbox" checked={!!edge.dashed} onChange={e => actions.updateEdge(edge.id, { dashed: e.target.checked })} />Dashed line</label>
          <button className="mm-danger" onClick={() => actions.deleteEdges([edge.id])}>Delete connection</button>
        </>}
      </aside>}
    </div>
    <div className="mm-status"><span>Drag background to pan · Scroll to zoom · Drag a dot to connect · Double-click to edit</span><span aria-live="polite">{state.dirty ? "Unsaved changes" : state.lastSavedAt ? "Saved in this browser" : "Stored in this browser"} · <button onClick={backup}>Export JSON</button></span></div>
  </div>;
}
