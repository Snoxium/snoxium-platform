"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { actions, setViewportSize, useStore } from "./store";
import type { MMNode } from "./types";
import { NodeView } from "./Node";
import { EdgesLayer } from "./Edges";
import { pointInRect, screenToWorld } from "./engine";

export function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const project = useStore((s) => s.project);
  const camera = useStore((s) => s.camera);
  const ui = useStore((s) => s.ui);
  const settings = project.settings;
  const [hoveredId, setHoveredId] = useState<string | undefined>();

  const dragState = useRef<{
    mode:
      | null
      | "pan"
      | "nodes"
      | "resize"
      | "connect"
      | "marquee";
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    vx: number;
    vy: number;
    moved: boolean;
    nodeId?: string;
    origPos?: Map<string, { x: number; y: number }>;
    origCamera?: { x: number; y: number };
    resizeHandle?: string;
    origSize?: { w: number; h: number; x: number; y: number };
    connectingFrom?: string;
    space?: boolean;
    shift?: boolean;
    startSel?: string[];
  }>({ mode: null, startX: 0, startY: 0, lastX: 0, lastY: 0, vx: 0, vy: 0, moved: false });

  const inertiaRef = useRef<number | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const lastTick = useRef<number>(0);
  const keys2 = useRef<Record<string, boolean>>({});

  const worldId = project.currentWorldId;
  const currentWorld = project.worlds[worldId];

  const visibleNodes: MMNode[] = useMemo(
    () =>
      Object.values(project.nodes).filter(
        (n) => n.worldId === worldId && !n.hidden,
      ),
    [project.nodes, worldId],
  );
  const visibleEdges = useMemo(
    () => Object.values(project.edges).filter((e) => e.worldId === worldId),
    [project.edges, worldId],
  );
  const nodesById = useMemo(() => {
    const m: Record<string, MMNode> = {};
    for (const n of visibleNodes) m[n.id] = n;
    return m;
  }, [visibleNodes]);

  const onResize = useCallback(() => {
    const el = containerRef.current;
    if (el) setViewportSize(el.clientWidth, el.clientHeight);
  }, []);

  useEffect(() => {
    onResize();
    const ro = new ResizeObserver(onResize);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [onResize]);

  const moveCameraBy = useCallback((dx: number, dy: number) => {
    actions.nudgeCamera(dx, dy);
  }, []);

  useEffect(() => {
    if (!settings.wasdEnabled) return;
    let raf = 0;
    const tick = () => {
      const speed = 10 / Math.max(0.2, camera.zoom);
      let dx = 0,
        dy = 0;
      if (keys2.current["w"] || keys2.current["arrowup"]) dy -= speed;
      if (keys2.current["s"] || keys2.current["arrowdown"]) dy += speed;
      if (keys2.current["a"] || keys2.current["arrowleft"]) dx -= speed;
      if (keys2.current["d"] || keys2.current["arrowright"]) dx += speed;
      if (dx || dy) moveCameraBy(dx, dy);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const d = (e: KeyboardEvent) => {
      keys2.current[e.key.toLowerCase()] = true;
    };
    const u = (e: KeyboardEvent) => {
      keys2.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
    };
  }, [camera.zoom, settings.wasdEnabled, moveCameraBy]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) < 40) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      actions.zoomAt(sx, sy, camera.zoom * factor, {
        w: rect.width,
        h: rect.height,
      });
    } else {
      e.preventDefault();
      actions.nudgeCamera(-e.deltaX, -e.deltaY);
    }
  }, [camera.zoom]);

  const snap = (v: number) =>
    settings.snapToGrid ? Math.round(v / settings.gridSize) * settings.gridSize : v;

  const onPointerDown = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wp = screenToWorld(sx, sy, camera.x, camera.y, camera.zoom);

    const target = e.target as HTMLElement;
    const portSide = target.getAttribute?.("data-port");
    const resizeH = target.getAttribute?.("data-resize");
    const nodeEl = target.closest?.("[data-node-id]") as HTMLElement | null;
    const nodeId = nodeEl?.getAttribute("data-node-id") || undefined;

    const edgeListener = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id: string; shift: boolean }>).detail;
      actions.selectEdge(detail.id, detail.shift);
    };
    (e.target as Element).addEventListener("mm-edge-click", edgeListener, {
      once: true,
    });

    if (portSide && nodeId) {
      dragState.current = {
        mode: "connect",
        startX: sx,
        startY: sy,
        lastX: sx,
        lastY: sy,
        vx: 0,
        vy: 0,
        moved: false,
        connectingFrom: nodeId,
      };
      actions.setTempEdge({ from: nodeId, toX: wp.x, toY: wp.y });
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      e.preventDefault();
      return;
    }

    if (resizeH && nodeId) {
      const n = project.nodes[nodeId];
      if (!n || n.locked) return;
      dragState.current = {
        mode: "resize",
        startX: sx,
        startY: sy,
        lastX: sx,
        lastY: sy,
        vx: 0,
        vy: 0,
        moved: false,
        nodeId,
        resizeHandle: resizeH,
        origSize: { x: n.x, y: n.y, w: n.w, h: n.h },
      };
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      e.preventDefault();
      return;
    }

    if (nodeId) {
      const isSelected = ui.selectedNodeIds.includes(nodeId);
      const additive = e.shiftKey;
      let selection: string[];
      if (additive) {
        selection = isSelected
          ? ui.selectedNodeIds.filter((x) => x !== nodeId)
          : [...ui.selectedNodeIds, nodeId];
        actions.selectNode(selection, false);
      } else if (!isSelected) {
        actions.selectNode(nodeId, false);
        selection = [nodeId];
      } else {
        selection = ui.selectedNodeIds;
      }
      const positions = new Map<string, { x: number; y: number }>();
      for (const id of selection) {
        const n = project.nodes[id];
        if (n) positions.set(id, { x: n.x, y: n.y });
      }
      dragState.current = {
        mode: "nodes",
        startX: sx,
        startY: sy,
        lastX: sx,
        lastY: sy,
        vx: 0,
        vy: 0,
        moved: false,
        nodeId,
        origPos: positions,
        shift: additive,
        startSel: [...selection],
      };
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      e.stopPropagation();
      return;
    }

    const isMiddle = e.button === 1;
    const isSpacePan = keys.current[" "] === true || dragState.current.space === true;
    if (isMiddle || isSpacePan || e.button === 2) {
      dragState.current = {
        mode: "pan",
        startX: sx,
        startY: sy,
        lastX: sx,
        lastY: sy,
        vx: 0,
        vy: 0,
        moved: false,
        origCamera: { x: camera.x, y: camera.y },
      };
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      e.preventDefault();
      return;
    }

    dragState.current = {
      mode: "marquee",
      startX: sx,
      startY: sy,
      lastX: sx,
      lastY: sy,
      vx: 0,
      vy: 0,
      moved: false,
      shift: e.shiftKey,
      startSel: e.shiftKey ? [...ui.selectedNodeIds] : [],
    };
    actions.setMarquee({ x1: sx, y1: sy, x2: sx, y2: sy });
    if (!e.shiftKey) actions.clearSelection();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wp = screenToWorld(sx, sy, camera.x, camera.y, camera.zoom);
    const st = dragState.current;
    const dx = sx - st.lastX;
    const dy = sy - st.lastY;
    if (Math.abs(sx - st.startX) + Math.abs(sy - st.startY) > 3) st.moved = true;
    const now = performance.now();
    const dt = Math.max(1, now - (lastTick.current || now));
    lastTick.current = now;
    st.vx = dx * (16 / dt);
    st.vy = dy * (16 / dt);
    st.lastX = sx;
    st.lastY = sy;

    const nodeHoverEl = (e.target as HTMLElement).closest?.("[data-node-id]") as HTMLElement | null;
    setHoveredId(nodeHoverEl?.getAttribute("data-node-id") || undefined);

    if (st.mode === "pan") {
      actions.nudgeCamera(dx, dy);
    } else if (st.mode === "nodes" && st.origPos) {
      const wdx = (sx - st.startX) / camera.zoom;
      const wdy = (sy - st.startY) / camera.zoom;
      const updates: Array<[string, number, number]> = [];
      for (const [id, orig] of st.origPos) {
        const n = project.nodes[id];
        if (!n || n.locked) continue;
        const nx = snap(orig.x + wdx);
        const ny = snap(orig.y + wdy);
        if (n.x !== nx || n.y !== ny) updates.push([id, nx, ny]);
      }
      if (updates.length) {
        for (const [id, nx, ny] of updates) {
          const n = project.nodes[id];
          n.x = nx;
          n.y = ny;
          n.updated = Date.now();
        }
        actions.saveNow();
      }
    } else if (st.mode === "resize" && st.nodeId && st.origSize) {
      const wdx = dx / camera.zoom;
      const wdy = dy / camera.zoom;
      const n = project.nodes[st.nodeId];
      const nw = Math.max(80, st.origSize.w + wdx);
      const nh = Math.max(60, st.origSize.h + wdy);
      if (n && (Math.abs(nw - n.w) > 0.1 || Math.abs(nh - n.h) > 0.1)) {
        n.w = nw;
        n.h = nh;
        n.updated = Date.now();
      }
    } else if (st.mode === "connect" && st.connectingFrom) {
      actions.setTempEdge({ from: st.connectingFrom, toX: wp.x, toY: wp.y });
    } else if (st.mode === "marquee") {
      actions.setMarquee({ x1: st.startX, y1: st.startY, x2: sx, y2: sy });
      const wx1 = Math.min(st.startX, sx);
      const wy1 = Math.min(st.startY, sy);
      const wx2 = Math.max(st.startX, sx);
      const wy2 = Math.max(st.startY, sy);
      const w1 = screenToWorld(wx1, wy1, camera.x, camera.y, camera.zoom);
      const w2 = screenToWorld(wx2, wy2, camera.x, camera.y, camera.zoom);
      const r = { x: w1.x, y: w1.y, w: w2.x - w1.x, h: w2.y - w1.y };
      const hit: string[] = [...(st.startSel ?? [])];
      for (const n of visibleNodes) {
        if (hit.includes(n.id)) continue;
        if (
          pointInRect({ x: n.x + n.w / 2, y: n.y + n.h / 2 }, r) ||
          pointInRect({ x: n.x, y: n.y }, r)
        ) {
          hit.push(n.id);
        }
      }
      actions.selectNode(hit.length ? hit : st.startSel ?? [], false);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const st = dragState.current;
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
    const el = containerRef.current;
    const rect = el?.getBoundingClientRect();
    const sx = rect ? e.clientX - rect.left : 0;
    const sy = rect ? e.clientY - rect.top : 0;

    if (st.mode === "connect" && st.connectingFrom) {
      const nodeHover = (e.target as HTMLElement).closest?.("[data-node-id]") as HTMLElement | null;
      const toId = nodeHover?.getAttribute("data-node-id") || undefined;
      if (toId && toId !== st.connectingFrom) {
        actions.createEdgeFromTo(st.connectingFrom, toId);
      }
      actions.setTempEdge(undefined);
    } else if (st.mode === "nodes" && !st.moved && st.nodeId) {
      const n = project.nodes[st.nodeId];
      if (n?.isWorld && n.childWorldId) {
        actions.enterWorld(n.childWorldId);
        return;
      }
      if (n?.isPortal && n.portalTarget) {
        actions.jumpToNode(n.portalTarget);
        return;
      }
    }

    if (st.mode === "marquee") {
      actions.setMarquee(undefined);
    }

    if (st.mode === "pan" && settings.inertiaEnabled) {
      const doInertia = () => {
        if (Math.abs(st.vx) < 0.05 && Math.abs(st.vy) < 0.05) {
          inertiaRef.current = null;
          return;
        }
        actions.nudgeCamera(st.vx, st.vy);
        st.vx *= 0.93;
        st.vy *= 0.93;
        inertiaRef.current = requestAnimationFrame(doInertia);
      };
      if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
      if (Math.abs(st.vx) + Math.abs(st.vy) > 0.5)
        inertiaRef.current = requestAnimationFrame(doInertia);
    }

    if (!st.moved && e.button === 0 && !st.nodeId && st.mode === "marquee") {
      const nodeHover = (e.target as HTMLElement).closest?.("[data-node-id]") as HTMLElement | null;
      if (!nodeHover) actions.clearSelection();
    }

    dragState.current = {
      ...dragState.current,
      mode: null,
      moved: false,
      connectingFrom: undefined,
      origPos: undefined,
      origSize: undefined,
      origCamera: undefined,
      startSel: undefined,
    };
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      const tag = tgt?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tgt?.isContentEditable) return;
      if (e.key === " ") {
        keys.current[" "] = true;
        dragState.current.space = true;
        if (containerRef.current) containerRef.current.style.cursor = "grab";
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === " ") {
        keys.current[" "] = false;
        dragState.current.space = false;
        if (containerRef.current) containerRef.current.style.cursor = "";
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest?.("[data-node-id]") as HTMLElement | null;
    if (nodeEl) {
      const id = nodeEl.getAttribute("data-node-id");
      if (id) {
        const n = project.nodes[id];
        if (n?.isWorld && n.childWorldId) {
          actions.enterWorld(n.childWorldId);
          return;
        }
      }
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wp = screenToWorld(sx, sy, camera.x, camera.y, camera.zoom);
    actions.createNodeAt(wp.x, wp.y);
  };

  const gridBgStyle = (() => {
    if (!settings.gridEnabled) return {};
    const size = settings.gridSize * camera.zoom;
    return {
      backgroundImage:
        "radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)",
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${camera.x}px ${camera.y}px`,
    };
  })();

  const marqueeRect = ui.marquee
    ? (() => {
        const x = Math.min(ui.marquee.x1, ui.marquee.x2);
        const y = Math.min(ui.marquee.y1, ui.marquee.y2);
        const w = Math.abs(ui.marquee.x2 - ui.marquee.x1);
        const h = Math.abs(ui.marquee.y2 - ui.marquee.y1);
        return { x, y, w, h };
      })()
    : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl border border-white/5 bg-[#06060d]"
      style={gridBgStyle}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      tabIndex={0}
    >
      {settings.rulersEnabled && <Rulers camera={camera} />}

      <div
        className="absolute left-0 top-0 will-change-transform"
        style={{
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <EdgesLayer
          edges={visibleEdges}
          nodesById={nodesById}
          worldId={worldId}
          hoveredId={ui.hoveredEdgeId}
          selectedIds={ui.selectedEdgeIds}
          tempEdge={ui.tempEdge}
        />
        <div className="absolute left-0 top-0" style={{ pointerEvents: "auto" }}>
          {visibleNodes.map((n) => (
            <NodeView
              key={n.id}
              node={n}
              selected={ui.selectedNodeIds.includes(n.id)}
              hovered={hoveredId === n.id || ui.hoveredNodeId === n.id}
              tagsById={project.tags}
            />
          ))}
        </div>
      </div>

      {marqueeRect && (
        <div
          className="pointer-events-none absolute rounded-lg border border-cyan-400/40 bg-cyan-400/10"
          style={{
            left: marqueeRect.x,
            top: marqueeRect.y,
            width: marqueeRect.w,
            height: marqueeRect.h,
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent,rgba(5,5,10,0.45))]" />
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur">
        {currentWorld?.emoji ?? "🌐"} {currentWorld?.name ?? "World"} ·{" "}
        <span className="font-mono text-cyan-300">
          {Math.round(camera.zoom * 100)}%
        </span>
      </div>
    </div>
  );
}

function Rulers({ camera }: { camera: { x: number; y: number; zoom: number } }) {
  const step = 80 * camera.zoom;
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-6 w-full border-b border-white/5 bg-black/40 backdrop-blur-[1px]">
        <div
          className="relative h-full w-full"
          style={{ transform: `translateX(${camera.x}px)` }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={"h" + i}
              className="absolute top-0 h-full border-r border-white/10"
              style={{ left: i * step }}
            >
              <span className="absolute left-1 top-0 text-[9px] text-zinc-500">
                {Math.round((-camera.x + i * step) / camera.zoom)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute left-0 top-0 h-full w-6 border-r border-white/5 bg-black/40 backdrop-blur-[1px]">
        <div
          className="relative h-full w-full"
          style={{ transform: `translateY(${camera.y}px)` }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={"v" + i}
              className="absolute left-0 w-full border-b border-white/10"
              style={{ top: i * step }}
            >
              <span className="absolute top-0 left-0 text-[9px] text-zinc-500">
                {Math.round((-camera.y + i * step) / camera.zoom)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
