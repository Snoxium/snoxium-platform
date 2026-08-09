"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { beginUndoGroup, endUndoGroup, setViewportSize, actions, useStore, getState, bumpVersion, bumpSilent, flushNotify, touchNode } from "./store";
import type { MMNode } from "./types";
import { NodeView } from "./Node";
import { EdgesLayer } from "./Edges";
import { pointInRect, screenToWorld } from "./engine";

export function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const project = useStore((s) => s.project);
  const camera = useStore((s) => s.camera);
  const ui = useStore((s) => s.ui);
  const [_version, setVersion] = useState(0);
  const size = useStore(() => 1);
  void size;

  // Hybrid zoom mode:
  // - When zoom is changing (wheel, +/-, slider) -> transform scale (pure GPU, no layout reflow = fast)
  // - After 250ms of zoom inactivity -> snap to CSS zoom (re-layouts text glyphs = pixel-perfect crisp)
  const zoomRef = useRef<"gpu" | "crisp">("crisp");
  const zoomIdleTimer = useRef<number | null>(null);
  const lastCameraZoomSeen = useRef<number>(camera.zoom);

  const kickZoomDirty = useCallback(() => {
    zoomRef.current = "gpu";
    if (zoomIdleTimer.current != null) window.clearTimeout(zoomIdleTimer.current);
    zoomIdleTimer.current = window.setTimeout(() => {
      zoomRef.current = "crisp";
      setVersion((x) => x + 1);
    }, 220);
  }, []);

  if (Math.abs(lastCameraZoomSeen.current - camera.zoom) > 1e-6) {
    lastCameraZoomSeen.current = camera.zoom;
    kickZoomDirty();
  }

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
    undoGroup?: number;
  }>({ mode: null, startX: 0, startY: 0, lastX: 0, lastY: 0, vx: 0, vy: 0, moved: false });

  const inertiaRef = useRef<number | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const lastTick = useRef<number>(0);
  const keys2 = useRef<Record<string, boolean>>({});
  const sizeState = useRef<{ w: number; h: number }>({ w: 1200, h: 800 });
  const [dims, setDims] = useState({ w: 1200, h: 800 });

  const worldId = project.currentWorldId;
  const currentWorld = project.worlds[worldId];

  const visibleNodes: MMNode[] = useMemo(
    () =>
      Object.values(getState().project.nodes)
        .filter((n) => n.worldId === worldId && !n.hidden)
        .map((n) => ({ ...n })),
    [worldId, project.updated, project.currentWorldId],
  );
  const visibleEdges = useMemo(
    () => Object.values(getState().project.edges).filter((e) => e.worldId === worldId),
    [worldId, project.updated, project.currentWorldId],
  );
  const nodesById = useMemo(() => {
    const m: Record<string, MMNode> = {};
    for (const n of visibleNodes) m[n.id] = n;
    return m;
  }, [visibleNodes]);

  const onResize = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      const w = el.clientWidth || 1200;
      const h = el.clientHeight || 800;
      setViewportSize(w, h);
      sizeState.current = { w, h };
      setDims({ w, h });
    }
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
      if (keys2.current["w"] || keys2.current["arrowup"]) dy += speed;
      if (keys2.current["s"] || keys2.current["arrowdown"]) dy -= speed;
      if (keys2.current["a"] || keys2.current["arrowleft"]) dx += speed;
      if (keys2.current["d"] || keys2.current["arrowright"]) dx -= speed;
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (e.shiftKey) {
        e.preventDefault();
        const dx = Math.abs(e.deltaX) > 1 ? e.deltaX : e.deltaY;
        actions.nudgeCamera(-dx, -e.deltaY);
        return;
      }
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      const curCam = getState().camera;
      actions.zoomAt(sx, sy, curCam.zoom * factor, {
        w: rect.width,
        h: rect.height,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

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

    const isLeft = e.button === 0;
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

    if (portSide && nodeId && isLeft) {
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

    if (resizeH && nodeId && isLeft) {
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
      dragState.current.undoGroup = beginUndoGroup();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      e.preventDefault();
      return;
    }

    if (nodeId && isLeft) {
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
      dragState.current.undoGroup = beginUndoGroup();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      e.stopPropagation();
      return;
    }

    if (!isLeft) return;

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

  let _raf = 0;
  let _pendingMove: { sx: number; sy: number; e: null | React.PointerEvent } | null = null;

  const onPointerMove = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const nodeHoverEl = (e.target as HTMLElement).closest?.("[data-node-id]") as HTMLElement | null;
    const hov = nodeHoverEl?.getAttribute("data-node-id") || undefined;
    if (hov !== hoveredId) setHoveredId(hov);

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

    if (!st.mode) return;

    const wp = screenToWorld(sx, sy, camera.x, camera.y, camera.zoom);

    if (st.mode === "pan") {
      actions.nudgeCamera(-dx, -dy);
      return;
    }
    if (st.mode === "connect" && st.connectingFrom) {
      const state = getState();
      state.ui.tempEdge = { from: st.connectingFrom, toX: wp.x, toY: wp.y };
      bumpSilent();
      setVersion((v) => v + 1);
      return;
    }
    const preConnectState = getState();
    if (preConnectState.ui.connectFromId && !st.mode) {
      preConnectState.ui.tempEdge = { from: preConnectState.ui.connectFromId, toX: wp.x, toY: wp.y };
      bumpSilent();
      setVersion((v) => v + 1);
    }

    // Batch nodes/resize/marquee into RAF to drop duplicate commits
    if (_pendingMove == null) {
      _pendingMove = { sx, sy, e: null };
      _raf = requestAnimationFrame(() => {
        const p = _pendingMove!;
        _pendingMove = null;
        const ssx = p.sx;
        const ssy = p.sy;
        const sst = dragState.current;
        if (sst.mode === "nodes" && sst.origPos) {
          const wdx = (ssx - sst.startX) / camera.zoom;
          const wdy = (ssy - sst.startY) / camera.zoom;
          let any = false;
          for (const [id, orig] of sst.origPos) {
            const n = project.nodes[id];
            if (!n || n.locked) continue;
            const nx = snap(orig.x + wdx);
            const ny = snap(orig.y + wdy);
            if (n.x !== nx || n.y !== ny) {
              n.x = nx;
              n.y = ny;
              touchNode(n);
              any = true;
            }
          }
          if (any) {
            bumpVersion();
          }
        } else if (sst.mode === "resize" && sst.nodeId && sst.origSize) {
          const wdx = (ssx - sst.startX) / camera.zoom;
          const wdy = (ssy - sst.startY) / camera.zoom;
          const n = project.nodes[sst.nodeId];
          if (!n || n.locked) return;
          const { x: ox, y: oy, w: ow, h: oh } = sst.origSize;
          const handle = sst.resizeHandle ?? "se";
          let nx = ox,
            ny = oy,
            nw = ow,
            nh = oh;
          if (handle.includes("e")) nw = Math.max(80, ow + wdx);
          if (handle.includes("s")) nh = Math.max(60, oh + wdy);
          if (handle.includes("w")) {
            const newW = Math.max(80, ow - wdx);
            nx = ox + (ow - newW);
            nw = newW;
          }
          if (handle.includes("n")) {
            const newH = Math.max(60, oh - wdy);
            ny = oy + (oh - newH);
            nh = newH;
          }
          if (
            Math.abs(nx - n.x) > 0.1 ||
            Math.abs(ny - n.y) > 0.1 ||
            Math.abs(nw - n.w) > 0.1 ||
            Math.abs(nh - n.h) > 0.1
          ) {
            n.x = nx;
            n.y = ny;
            n.w = nw;
            n.h = nh;
            touchNode(n);
            bumpVersion();
          }
        } else if (sst.mode === "marquee") {
          const gstate = getState();
          gstate.ui.marquee = { x1: sst.startX, y1: sst.startY, x2: ssx, y2: ssy };
          const wx1 = Math.min(sst.startX, ssx);
          const wy1 = Math.min(sst.startY, ssy);
          const wx2 = Math.max(sst.startX, ssx);
          const wy2 = Math.max(sst.startY, ssy);
          const w1 = screenToWorld(wx1, wy1, camera.x, camera.y, camera.zoom);
          const w2 = screenToWorld(wx2, wy2, camera.x, camera.y, camera.zoom);
          const r = { x: w1.x, y: w1.y, w: w2.x - w1.x, h: w2.y - w1.y };
          const hit: string[] = [...(sst.startSel ?? [])];
          for (const n of visibleNodes) {
            if (hit.includes(n.id)) continue;
            if (
              pointInRect({ x: n.x + n.w / 2, y: n.y + n.h / 2 }, r) ||
              pointInRect({ x: n.x, y: n.y }, r)
            ) {
              hit.push(n.id);
            }
          }
          gstate.ui.selectedNodeIds = hit.length ? hit : (sst.startSel ?? []);
          gstate.ui.selectedEdgeIds = [];
          bumpSilent();
          setVersion((v) => v + 1);
        }
      });
    } else {
      _pendingMove.sx = sx;
      _pendingMove.sy = sy;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const st = dragState.current;
    if (_raf) cancelAnimationFrame(_raf);
    _pendingMove = null;
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
    if (st.mode === "nodes" || st.mode === "resize" || st.mode === "marquee" || st.mode === "connect") {
      flushNotify();
    }
    const el = containerRef.current;
    const rect = el?.getBoundingClientRect();
    const sx = rect ? e.clientX - rect.left : 0;
    const sy = rect ? e.clientY - rect.top : 0;

    if (st.undoGroup != null) {
      endUndoGroup(st.undoGroup);
      st.undoGroup = undefined;
    }

    if (st.mode === "connect" && st.connectingFrom) {
      const nodeHover = (e.target as HTMLElement).closest?.("[data-node-id]") as HTMLElement | null;
      const toId = nodeHover?.getAttribute("data-node-id") || undefined;
      if (toId && toId !== st.connectingFrom) {
        actions.createEdgeFromTo(st.connectingFrom, toId);
      }
      actions.setTempEdge(undefined);
      flushNotify();
    }

    const stateNow = getState();
    const nodeHover = (e.target as HTMLElement).closest?.("[data-node-id]") as HTMLElement | null;
    const nodeId = nodeHover?.getAttribute("data-node-id") || undefined;
    if ((stateNow.ui.connectFromId || stateNow.ui.connectAwaitFirst) && !st.moved && e.button === 0) {
      if (stateNow.ui.connectAwaitFirst && nodeId) {
        actions.startConnect(nodeId);
      } else if (stateNow.ui.connectFromId && nodeId && nodeId !== stateNow.ui.connectFromId) {
        actions.createEdgeFromTo(stateNow.ui.connectFromId, nodeId);
        actions.cancelConnect();
      } else {
        actions.cancelConnect();
      }
    }

    if (st.mode === "marquee") {
      getState().ui.marquee = undefined;
    }

    if (st.mode === "pan" && settings.inertiaEnabled) {
      const doInertia = () => {
        if (Math.abs(st.vx) < 0.05 && Math.abs(st.vy) < 0.05) {
          inertiaRef.current = null;
          return;
        }
        actions.nudgeCamera(-st.vx, -st.vy);
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

    void sx;
    void sy;

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
    const majorSize = size * 5;
    return {
      backgroundImage:
        "radial-gradient(circle, var(--mm-grid-line) 1px, transparent 1px), radial-gradient(circle, var(--mm-grid-major) 1px, transparent 1px)",
      backgroundSize: `${size}px ${size}px, ${majorSize}px ${majorSize}px`,
      backgroundPosition: `${camera.x}px ${camera.y}px, ${camera.x}px ${camera.y}px`,
    };
  })();

  const uiLive = getState().ui;
  const marqueeRect = uiLive.marquee
    ? (() => {
        const x = Math.min(uiLive.marquee!.x1, uiLive.marquee!.x2);
        const y = Math.min(uiLive.marquee!.y1, uiLive.marquee!.y2);
        const w = Math.abs(uiLive.marquee!.x2 - uiLive.marquee!.x1);
        const h = Math.abs(uiLive.marquee!.y2 - uiLive.marquee!.y1);
        return { x, y, w, h };
      })()
    : null;

  return (
    <div
      ref={containerRef}
      data-mindmap-canvas
      className="relative h-full w-full overflow-hidden rounded-2xl"
      style={{
        ...gridBgStyle,
        touchAction: "none",
        overscrollBehavior: "contain",
        background: "var(--mm-canvas-bg)",
        border: "1px solid var(--mm-panel-border)",
        cursor:
          ui.connectFromId || ui.connectAwaitFirst ? "crosshair" : "default",
      }}
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
        style={
          zoomRef.current === "crisp"
            ? {
                zoom: camera.zoom,
                transform: `translate3d(${Math.round(camera.x / camera.zoom)}px, ${Math.round(camera.y / camera.zoom)}px, 0)`,
                transformOrigin: "0 0",
                width: `${dims.w}px`,
                height: `${dims.h}px`,
              }
            : {
                transform: `translate3d(${Math.round(camera.x)}px, ${Math.round(camera.y)}px, 0) scale(${camera.zoom})`,
                transformOrigin: "0 0",
                width: `${dims.w}px`,
                height: `${dims.h}px`,
              }
        }
      >
        <EdgesLayer
          edges={visibleEdges}
          nodesById={nodesById}
          worldId={worldId}
          hoveredId={uiLive.hoveredEdgeId}
          selectedIds={uiLive.selectedEdgeIds}
          tempEdge={uiLive.tempEdge}
          width={dims.w}
          height={dims.h}
        />
        <div className="absolute left-0 top-0" style={{ pointerEvents: "auto" }}>
          {visibleNodes.map((n) => (
            <NodeView
              key={n.id}
              node={n}
              selected={uiLive.selectedNodeIds.includes(n.id)}
              hovered={hoveredId === n.id || uiLive.hoveredNodeId === n.id}
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
      {(ui.connectFromId || ui.connectAwaitFirst) && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-100 backdrop-blur-md shadow-lg">
          🔗 {ui.connectAwaitFirst ? "Connect mode: click the first node to start a connection" : ui.connectFromId ? `Connect mode: click a second node to link from "${project.nodes[ui.connectFromId]?.title ?? "Node"}"` : ""}
          <span className="ml-2 rounded bg-black/30 px-1.5 py-0.5 text-[10px] text-cyan-200/80">ESC to cancel</span>
        </div>
      )}
      <div
        className="pointer-events-none absolute bottom-4 left-4 rounded-xl px-3 py-1.5 text-xs backdrop-blur"
        style={{
          background: "var(--mm-panel-bg)",
          border: "1px solid var(--mm-panel-border)",
          color: "var(--mm-text-secondary)",
        }}
      >        {currentWorld?.emoji ?? "🌐"} {currentWorld?.name ?? "World"} ·{" "}
        <span className="font-mono text-cyan-300">
          {Math.round(camera.zoom * 100)}%
        </span>
        <span className="ml-3 text-zinc-500">· Scroll to zoom · Shift+scroll to pan · Double-click empty = new</span>
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
