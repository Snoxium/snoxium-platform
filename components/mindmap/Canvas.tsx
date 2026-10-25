"use client";

import { memo, useEffect, useRef } from "react";
import { actions, beginUndoGroup, endUndoGroup, getState, useStore, setViewportSize, bumpVersion, flushNotify } from "./store";
import { bezierPoints, nearestAnchor, screenToWorld } from "./engine";
import type { MMNode } from "./types";
import { ChartContent, MarkdownContent } from "./NodeContent";

type Drag = {
  pointerId: number; mode: "pan" | "nodes" | "connect" | "resize";
  startX: number; startY: number; camera: { x: number; y: number; zoom: number };
  positions: Array<{ id: string; x: number; y: number; w: number; h: number }>;
  from?: string; undo?: number; moved: boolean;
};

export function Canvas() {
  const container = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const frame = useRef(0);
  const pending = useRef<{ x: number; y: number } | null>(null);
  const state = useStore(s => s);
  const { project, camera, ui } = state;
  const nodes = Object.values(project.nodes).filter(n => n.worldId === project.currentWorldId && !n.hidden);
  const edges = Object.values(project.edges).filter(e => e.worldId === project.currentWorldId);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setViewportSize(element.clientWidth, element.clientHeight);
    measure();
    if (getState().needsInitialFit) {
      getState().needsInitialFit = false;
      actions.resetCamera();
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const wheel = (e: WheelEvent) => {
      // Leave native scrolling to controls sitting above the canvas.
      e.preventDefault();
      const rect = element.getBoundingClientRect();
      if (e.shiftKey) actions.nudgeCamera(-(e.deltaX || e.deltaY), 0);
      else if (Math.abs(e.deltaX) > 0 && !e.ctrlKey) actions.nudgeCamera(-e.deltaX, -e.deltaY);
      else actions.zoomAt(e.clientX - rect.left, e.clientY - rect.top, getState().camera.zoom * Math.exp(-e.deltaY * 0.0015));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      element.removeEventListener("wheel", wheel);
      cancelAnimationFrame(frame.current);
      if (drag.current?.undo != null) endUndoGroup(drag.current.undo);
    };
  }, []);

  const point = (x: number, y: number) => {
    const rect = container.current!.getBoundingClientRect();
    return screenToWorld(x - rect.left, y - rect.top, getState().camera.x, getState().camera.y, getState().camera.zoom);
  };
  const move = (x: number, y: number) => {
    const current = drag.current;
    if (!current) return;
    const dx = x - current.startX;
    const dy = y - current.startY;
    if (!current.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    current.moved = true;
    if (current.mode === "pan") {
      actions.setCamera(current.camera.x + dx, current.camera.y + dy, current.camera.zoom);
    } else if (current.mode === "connect" && current.from) {
      const p = point(x, y);
      actions.setTempEdge({ from: current.from, toX: p.x, toY: p.y });
    } else {
      if (current.undo == null) current.undo = beginUndoGroup();
      const settings = getState().project.settings;
      const snap = (v: number) => settings.snapToGrid ? Math.round(v / settings.gridSize) * settings.gridSize : v;
      for (const original of current.positions) {
        const node = getState().project.nodes[original.id];
        if (!node || node.locked) continue;
        if (current.mode === "resize") {
          node.w = Math.max(160, snap(original.w + dx / current.camera.zoom));
          node.h = Math.max(100, snap(original.h + dy / current.camera.zoom));
        } else {
          node.x = snap(original.x + dx / current.camera.zoom);
          node.y = snap(original.y + dy / current.camera.zoom);
        }
        node.updated = Date.now();
        node._v = (node._v ?? 0) + 1;
      }
      bumpVersion();
    }
  };
  const finish = (e: React.PointerEvent, cancelled = false) => {
    const current = drag.current;
    if (!current || current.pointerId !== e.pointerId) return;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    pending.current = null;
    if (!cancelled) move(e.clientX, e.clientY);
    if (current.mode === "connect" && current.from && !cancelled) {
      // Pointer capture changes e.target; hit-test the actual release position.
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-node-id]");
      const to = target?.dataset.nodeId;
      if (to && to !== current.from) {
        actions.createEdgeFromTo(current.from, to);
        actions.cancelConnect();
      } else if (!current.moved) actions.startConnect(current.from);
    }
    actions.setTempEdge(undefined);
    if (current.undo != null) {
      endUndoGroup(current.undo);
      flushNotify();
    }
    drag.current = null;
    if (container.current?.hasPointerCapture(e.pointerId)) container.current.releasePointerCapture(e.pointerId);
  };

  return (
    <div ref={container} data-mindmap-canvas className="mm-canvas" aria-label="Mindmap canvas" tabIndex={0}
      style={{
        backgroundImage: project.settings.gridEnabled ? "radial-gradient(circle, #ffffff16 1px, transparent 1px)" : undefined,
        backgroundSize: `${project.settings.gridSize * camera.zoom}px ${project.settings.gridSize * camera.zoom}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
        cursor: ui.connectFromId || ui.connectAwaitFirst ? "crosshair" : undefined,
      }}
      onContextMenu={e => e.preventDefault()}
      onDoubleClick={e => {
        if ((e.target as Element).closest("[data-node-id], button, input, textarea")) return;
        const p = point(e.clientX, e.clientY);
        actions.createNodeAt(p.x, p.y);
      }}
      onPointerDown={e => {
        if (drag.current || ![0, 1, 2].includes(e.button)) return;
        const target = e.target as Element;
        if (target.closest("input, textarea, select, a, [data-edge-id]")) return;
        const nodeId = target.closest<HTMLElement>("[data-node-id]")?.dataset.nodeId;
        const port = target.closest("[data-port]");
        const resize = target.closest("[data-resize]");
        if (target.closest("button") && !port && !resize) return;
        if (e.button === 0 && nodeId && (ui.connectFromId || ui.connectAwaitFirst) && !port) {
          if (ui.connectFromId && ui.connectFromId !== nodeId) {
            actions.createEdgeFromTo(ui.connectFromId, nodeId);
            actions.cancelConnect();
          } else actions.startConnect(nodeId);
          e.preventDefault();
          return;
        }
        let mode: Drag["mode"] = "pan";
        let selected: string[] = [];
        if (e.button === 0 && nodeId) {
          if (port) mode = "connect";
          else if (resize) mode = "resize";
          else mode = "nodes";
          selected = ui.selectedNodeIds.includes(nodeId) ? ui.selectedNodeIds : [nodeId];
          if (e.shiftKey && mode === "nodes") {
            selected = ui.selectedNodeIds.includes(nodeId) ? ui.selectedNodeIds.filter(id => id !== nodeId) : [...ui.selectedNodeIds, nodeId];
          }
          actions.selectNode(selected);
        } else if (!e.shiftKey) {
          actions.clearSelection();
          actions.cancelConnect();
        }
        drag.current = {
          pointerId: e.pointerId, mode, startX: e.clientX, startY: e.clientY, camera: { ...getState().camera },
          positions: selected.map(id => getState().project.nodes[id]).filter(Boolean).map(n => ({ id: n.id, x: n.x, y: n.y, w: n.w, h: n.h })),
          from: nodeId, moved: false,
        };
        container.current?.focus({ preventScroll: true });
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
      }}
      onPointerMove={e => {
        if (!drag.current || drag.current.pointerId !== e.pointerId) return;
        pending.current = { x: e.clientX, y: e.clientY };
        if (frame.current) return;
        frame.current = requestAnimationFrame(() => {
          frame.current = 0;
          const p = pending.current;
          pending.current = null;
          if (p) move(p.x, p.y);
        });
      }}
      onPointerUp={e => finish(e)}
      onPointerCancel={e => finish(e, true)}
    >
      <div data-mindmap-nodes className="mm-world" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}>
        <svg data-mindmap-layer className="mm-edges" width="1" height="1" aria-label="Connections">
          <defs><marker id="mm-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" /></marker></defs>
          {edges.map(edge => {
            const a = project.nodes[edge.from], b = project.nodes[edge.to];
            if (!a || !b || a.hidden || b.hidden) return null;
            const shape = bezierPoints(nearestAnchor(a, { x: b.x + b.w / 2, y: b.y + b.h / 2 }), nearestAnchor(b, { x: a.x + a.w / 2, y: a.y + a.h / 2 }), edge.style ?? "bezier");
            const selected = ui.selectedEdgeIds.includes(edge.id);
            return <g key={edge.id} data-edge-id={edge.id} role="button" tabIndex={0} aria-label={`Connection: ${a.title} to ${b.title}`} style={{ pointerEvents: "auto", cursor: "pointer" }}
              onPointerDown={e => { e.stopPropagation(); actions.selectEdge(edge.id); }}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); actions.selectEdge(edge.id); } }}>
              <path d={shape.d} stroke="transparent" strokeWidth={18} fill="none" />
              <path d={shape.d} stroke={selected ? "#22d3ee" : edge.color ?? "#94a3b8"} strokeWidth={selected ? 3 : edge.thickness ?? 2} strokeDasharray={edge.dashed ? "6 4" : undefined} fill="none" markerEnd={edge.direction === "none" || edge.direction === "back" ? undefined : "url(#mm-arrow)"} markerStart={edge.direction === "back" || edge.direction === "both" ? "url(#mm-arrow)" : undefined} />
              {edge.label && <text x={shape.mid.x} y={shape.mid.y - 10} fill="#e4e4e7" fontSize={12} textAnchor="middle">{edge.label}</text>}
            </g>;
          })}
          {ui.tempEdge && project.nodes[ui.tempEdge.from] && <path d={bezierPoints(nearestAnchor(project.nodes[ui.tempEdge.from], { x: ui.tempEdge.toX, y: ui.tempEdge.toY }), { x: ui.tempEdge.toX, y: ui.tempEdge.toY }, "bezier").d} stroke="#22d3ee" strokeWidth={2} strokeDasharray="6 4" fill="none" />}
        </svg>
        {nodes.map(node => <MapNode key={node.id} node={{ ...node }} selected={ui.selectedNodeIds.includes(node.id)} connecting={ui.connectFromId === node.id} />)}
      </div>
      {!nodes.length && <div className="mm-empty">This world is empty. Double-click here or choose + Node.</div>}
      {(ui.connectFromId || ui.connectAwaitFirst) && <div className="mm-connect-hint" role="status">{ui.connectFromId ? "Choose another node to connect. Esc to cancel." : "Choose the first node."}</div>}
    </div>
  );
}

const MapNode = memo(function MapNode({ node, selected, connecting }: { node: MMNode; selected: boolean; connecting: boolean }) {
  const worldId = node.linkedWorldId ?? node.childWorldId;
  return <div data-node-id={node.id} className={`mm-node${selected ? " is-selected" : ""}${connecting ? " is-connecting" : ""}`}
    style={{ left: node.x, top: node.y, width: node.w, height: node.h, borderColor: node.color?.stroke, background: node.color?.fill, color: node.color?.text, fontSize: node.font?.size ?? 14, borderRadius: node.shape === "pill" ? 32 : node.shape === "document" ? 2 : 14 }}
    onDoubleClick={e => { e.stopPropagation(); if ((e.target as Element).closest("button, input, a")) return; actions.selectNode(node.id); actions.setInspector(true); }}>
    <div className="mm-node-heading"><span>{worldId ? "◈" : node.kind === "checklist" ? "☑" : node.kind === "chart" ? "▥" : "•"}</span><strong>{node.title || "Untitled"}</strong>{node.locked && <span title="Position locked">⌑</span>}<button className="mm-edit-node" aria-label={`Edit ${node.title}`} onClick={() => { actions.selectNode(node.id); actions.setInspector(true); }}>✎</button></div>
    <div className="mm-node-body">
      {node.kind === "code" ? <pre className="mm-code"><code>{node.notes ?? node.description}</code></pre> : (node.notes || node.description || node.subtitle) && <MarkdownContent text={node.notes ?? node.description ?? node.subtitle ?? ""} />}
      {node.kind === "chart" && node.chart && <ChartContent chart={node.chart} />}
      {node.kind === "checklist" && <div className="mm-node-checklist">{node.checklist?.map(item => <label key={item.id} className={`mm-check${item.done ? " is-done" : ""}`}><input type="checkbox" disabled={node.editLocked} checked={item.done} onChange={e => actions.setChecklistItem(node.id, item.id, { done: e.target.checked })} /><span>{item.text}</span></label>)}<small>{node.checklist?.filter(i => i.done).length ?? 0} / {node.checklist?.length ?? 0} complete</small></div>}
    </div>
    {worldId && <button className="mm-enter" onClick={() => actions.enterWorld(worldId)}>Open world →</button>}
    {node.status && node.status !== "none" && <small className="mm-node-status">{node.status}{node.dueDate ? ` · ${node.dueDate}` : ""}</small>}
    <button data-port="left" className="mm-port mm-port-left" aria-label={`Connect ${node.title}`} title="Drag to another node, or click then choose a node" />
    <button data-port="right" className="mm-port mm-port-right" aria-label={`Connect from ${node.title}`} title="Drag to another node, or click then choose a node" />
    {selected && !node.locked && <button data-resize className="mm-resize" aria-label={`Resize ${node.title}`} />}
  </div>;
}, (prev, next) => prev.selected === next.selected && prev.connecting === next.connecting &&
  prev.node.id === next.node.id && prev.node.x === next.node.x && prev.node.y === next.node.y &&
  prev.node.w === next.node.w && prev.node.h === next.node.h && prev.node._v === next.node._v &&
  prev.node.updated === next.node.updated && prev.node.title === next.node.title);
