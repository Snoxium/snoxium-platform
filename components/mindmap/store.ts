"use client";

import type {
  MMProject,
  MMNode,
  MMEdge,
  MMWorld,
  MMUIState,
  MMTag,
  NodeKind,
  MMColor,
  NodeStatus,
  ChecklistItem,
  MMCameraBookmark,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { uid, colorForString } from "./engine";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "snoxium.mindmap.v1";
const SNAPSHOT_KEY = "snoxium.mindmap.snapshots.v1";
const MAX_HISTORY = 200;

function makeDefaultWorlds(): Record<string, MMWorld> {
  const root = uid();
  const now = Date.now();
  return {
    [root]: {
      id: root,
      name: "Root World",
      emoji: "🌍",
      camera: { x: 0, y: 0, zoom: 1 },
      created: now,
      updated: now,
    },
  };
}

function seededProject(): MMProject {
  const worlds = makeDefaultWorlds();
  const rootWorldId = Object.keys(worlds)[0];
  const project: MMProject = {
    version: 1,
    name: "My Mindmap",
    created: Date.now(),
    updated: Date.now(),
    rootWorldId,
    currentWorldId: rootWorldId,
    worlds,
    nodes: {},
    edges: {},
    tags: {},
    bookmarks: [],
    history: [],
    settings: { ...DEFAULT_SETTINGS },
  };
  const centerNode = createNode(project, {
    worldId: rootWorldId,
    title: "Welcome to Snoxium Mindmap",
    subtitle: "Double-click to edit · Drag a connection dot to link",
    kind: "text",
    x: -120,
    y: -60,
    w: 300,
    h: 140,
  });
  const idea = createNode(project, {
    worldId: rootWorldId,
    title: "Ideas",
    subtitle: "Branch out with child nodes",
    kind: "text",
    x: -360,
    y: -240,
    w: 220,
    h: 110,
    color: { fill: "#22d3ee14", stroke: "#22d3ee" },
    tags: [],
  });
  const todo = createNode(project, {
    worldId: rootWorldId,
    title: "Todo Board",
    kind: "checklist",
    x: 240,
    y: -240,
    w: 260,
    h: 160,
    color: { fill: "#f472b614", stroke: "#f472b6" },
  });
  todo.checklist = [
    { id: uid(), text: "Explore nodes", done: true },
    { id: uid(), text: "Connect worlds", done: false },
    { id: uid(), text: "Export to JSON", done: false },
  ];
  const worldNode = createNode(project, {
    worldId: rootWorldId,
    title: "Sub-World",
    subtitle: "Double-click to enter its infinite canvas",
    kind: "world",
    x: -40,
    y: 180,
    w: 240,
    h: 120,
    color: { fill: "#a78bfa14", stroke: "#a78bfa" },
  });
  worldNode.isWorld = true;
  worldNode.childWorldId = createChildWorld(project, rootWorldId, "Sub-World", "🧩");
  createEdge(project, { from: centerNode.id, to: idea.id });
  createEdge(project, { from: centerNode.id, to: todo.id });
  createEdge(project, { from: centerNode.id, to: worldNode.id });
  return project;
}

export function createNode(
  project: MMProject,
  partial: Partial<MMNode> & Pick<MMNode, "worldId" | "title">,
): MMNode {
  const now = Date.now();
  const id = partial.id ?? uid();
  const node: MMNode = {
    id,
    worldId: partial.worldId,
    parentId: partial.parentId,
    linkedToId: partial.linkedToId,
    title: partial.title,
    subtitle: partial.subtitle,
    description: partial.description,
    notes: partial.notes,
    kind: partial.kind ?? "text",
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    w: partial.w ?? 240,
    h: partial.h ?? 110,
    rotation: partial.rotation,
    locked: partial.locked ?? false,
    editLocked: partial.editLocked ?? false,
    pinned: partial.pinned ?? false,
    favourite: partial.favourite ?? false,
    hidden: partial.hidden ?? false,
    color: partial.color,
    shape: partial.shape ?? "card",
    opacity: partial.opacity,
    tags: partial.tags ?? [],
    status: partial.status,
    priority: partial.priority,
    progress: partial.progress,
    dueDate: partial.dueDate,
    reminder: partial.reminder,
    created: now,
    updated: now,
    checklist: partial.checklist,
    attachments: partial.attachments,
    comments: partial.comments,
    custom: partial.custom,
    isWorld: partial.isWorld,
    isPortal: partial.isPortal,
    portalTarget: partial.portalTarget,
    childWorldId: partial.childWorldId,
    icon: partial.icon,
    font: partial.font,
    order: partial.order,
  };
  project.nodes[id] = node;
  project.updated = now;
  pushHistory(project, "node.create", id);
  return node;
}

export function createEdge(
  project: MMProject,
  partial: Partial<MMEdge> & Pick<MMEdge, "from" | "to">,
): MMEdge {
  const now = Date.now();
  const id = partial.id ?? uid();
  const edge: MMEdge = {
    id,
    worldId: partial.worldId ?? project.currentWorldId,
    from: partial.from,
    to: partial.to,
    label: partial.label,
    style: partial.style ?? "bezier",
    direction: partial.direction ?? "forward",
    color: partial.color,
    thickness: partial.thickness ?? 2,
    dashed: partial.dashed,
    weight: partial.weight,
    created: now,
    updated: now,
  };
  project.edges[id] = edge;
  project.updated = now;
  pushHistory(project, "edge.create", id);
  return edge;
}

export function createChildWorld(
  project: MMProject,
  parentId: string | undefined,
  name: string,
  emoji?: string,
): string {
  const now = Date.now();
  const id = uid();
  project.worlds[id] = {
    id,
    name,
    emoji: emoji ?? "🧭",
    parentWorldId: parentId,
    camera: { x: 0, y: 0, zoom: 1 },
    created: now,
    updated: now,
  };
  project.updated = now;
  pushHistory(project, "world.create", id);
  return id;
}

export function ensureTag(project: MMProject, name: string): MMTag {
  for (const t of Object.values(project.tags)) {
    if (t.name.toLowerCase() === name.toLowerCase()) return t;
  }
  const id = uid();
  const tag: MMTag = { id, name, color: colorForString(name) };
  project.tags[id] = tag;
  project.updated = Date.now();
  return tag;
}

function pushHistory(project: MMProject, kind: string, id: string) {
  project.history.push({ id: uid(), at: Date.now(), kind, id });
  if (project.history.length > MAX_HISTORY) {
    project.history.splice(0, project.history.length - MAX_HISTORY);
  }
}

interface Store {
  project: MMProject;
  ui: MMUIState;
  camera: { x: number; y: number; zoom: number };
}

type Listener = () => void;

function loadProject(): MMProject {
  if (typeof window === "undefined") return seededProject();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MMProject;
      if (parsed.version === 1) return parsed;
    }
  } catch {}
  const fresh = seededProject();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {}
  return fresh;
}

const initial: MMProject = (() => {
  try {
    return loadProject();
  } catch {
    return seededProject();
  }
})();

let state: Store = {
  project: initial,
  ui: {
    selectedNodeIds: [],
    selectedEdgeIds: [],
    inspectorOpen: false,
    atlasOpen: false,
    searchOpen: false,
    commandPaletteOpen: false,
    presentation: { active: false, nodeIds: [], index: 0 },
    matches: [],
  },
  camera: initial.worlds[initial.currentWorldId]?.camera ?? {
    x: 0,
    y: 0,
    zoom: 1,
  },
};

const undoStack: string[] = [];
const redoStack: string[] = [];

function pushUndo() {
  undoStack.push(JSON.stringify(state.project));
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
}

const listeners = new Set<Listener>();
function emit() {
  listeners.forEach((l) => l());
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleAutoSave() {
  if (!state.project.settings.autoSave) return;
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    persist();
  }, state.project.settings.autoSaveIntervalMs ?? 2000);
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project));
  } catch {}
}

function notify() {
  state.project.updated = Date.now();
  scheduleAutoSave();
  emit();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): Store {
  return state;
}

function setPartial(partial: Partial<Store>) {
  state = { ...state, ...partial };
  emit();
}

export function useStore<T>(sel: (s: Store) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => sel(state),
    () => sel(state),
  );
}

export const actions = {
  setCamera(x: number, y: number, zoom: number) {
    state.camera = { x, y, zoom };
    const w = state.project.worlds[state.project.currentWorldId];
    if (w) {
      w.camera = { x, y, zoom };
      w.updated = Date.now();
    }
    emit();
  },
  nudgeCamera(dx: number, dy: number) {
    actions.setCamera(
      state.camera.x + dx,
      state.camera.y + dy,
      state.camera.zoom,
    );
  },
  resetCamera() {
    const bbox = worldNodesBoundingBox();
    if (!bbox) {
      actions.setCamera(0, 0, 1);
      return;
    }
    actions.fitRect(bbox.x - 80, bbox.y - 80, bbox.w + 160, bbox.h + 160);
  },
  fitNode(nodeId: string) {
    const n = state.project.nodes[nodeId];
    if (!n) return;
    actions.fitRect(n.x - 40, n.y - 40, n.w + 80, n.h + 80);
  },
  fitSelection() {
    const nodes = state.ui.selectedNodeIds
      .map((id) => state.project.nodes[id])
      .filter(Boolean) as MMNode[];
    if (!nodes.length) {
      actions.resetCamera();
      return;
    }
    let x1 = Infinity,
      y1 = Infinity,
      x2 = -Infinity,
      y2 = -Infinity;
    for (const n of nodes) {
      x1 = Math.min(x1, n.x);
      y1 = Math.min(y1, n.y);
      x2 = Math.max(x2, n.x + n.w);
      y2 = Math.max(y2, n.y + n.h);
    }
    actions.fitRect(x1 - 40, y1 - 40, x2 - x1 + 80, y2 - y1 + 80);
  },
  fitRect(x: number, y: number, w: number, h: number) {
    const viewport = viewportSizeRef.current;
    const vw = viewport?.w ?? 1200;
    const vh = viewport?.h ?? 800;
    const scale = Math.min(vw / w, vh / h, 2);
    const nx = -x * scale + (vw - w * scale) / 2;
    const ny = -y * scale + (vh - h * scale) / 2;
    actions.setCamera(nx, ny, scale);
  },
  zoomAt(
    sx: number,
    sy: number,
    newZoom: number,
    viewport?: { w: number; h: number },
  ) {
    const { x, y, zoom } = state.camera;
    const vz = clamp(
      newZoom,
      0.05,
      12,
    );
    const ratio = vz / zoom;
    const cx = viewport ? sx - viewport.w / 2 : sx;
    const cy = viewport ? sy - viewport.h / 2 : sy;
    const nx = x - (cx) * (ratio - 1);
    const ny = y - (cy) * (ratio - 1);
    actions.setCamera(nx, ny, vz);
  },
  setZoom(z: number) {
    const viewport = viewportSizeRef.current ?? { w: 1200, h: 800 };
    actions.zoomAt(viewport.w / 2, viewport.h / 2, z, viewport);
  },
  selectNode(id: string | string[] | null, additive = false) {
    if (id == null) {
      setPartial({
        ui: { ...state.ui, selectedNodeIds: [], selectedEdgeIds: [] },
      });
      return;
    }
    const ids = Array.isArray(id) ? id : [id];
    const next = additive
      ? Array.from(new Set([...state.ui.selectedNodeIds, ...ids]))
      : ids;
    setPartial({
      ui: {
        ...state.ui,
        selectedNodeIds: next,
        selectedEdgeIds: [],
        inspectorOpen: next.length > 0 ? true : state.ui.inspectorOpen,
      },
    });
  },
  selectEdge(id: string | string[] | null, additive = false) {
    if (id == null) {
      setPartial({
        ui: { ...state.ui, selectedEdgeIds: [] },
      });
      return;
    }
    const ids = Array.isArray(id) ? id : [id];
    const next = additive
      ? Array.from(new Set([...state.ui.selectedEdgeIds, ...ids]))
      : ids;
    setPartial({
      ui: {
        ...state.ui,
        selectedEdgeIds: next,
        selectedNodeIds: [],
        inspectorOpen: next.length > 0 ? true : state.ui.inspectorOpen,
      },
    });
  },
  clearSelection() {
    setPartial({
      ui: { ...state.ui, selectedNodeIds: [], selectedEdgeIds: [] },
    });
  },
  setMarquee(m: { x1: number; y1: number; x2: number; y2: number } | undefined) {
    setPartial({ ui: { ...state.ui, marquee: m } });
  },
  setTempEdge(e: { from: string; toX: number; toY: number } | undefined) {
    setPartial({ ui: { ...state.ui, tempEdge: e } });
  },
  createNodeAt(wx: number, wy: number, partial: Partial<MMNode> = {}) {
    pushUndo();
    const p = state.project;
    const kind: NodeKind = (partial.kind as NodeKind) ?? "text";
    const n = createNode(p, {
      worldId: p.currentWorldId,
      title: partial.title ?? "New Node",
      subtitle: partial.subtitle,
      kind,
      x: wx - ((partial.w as number) ?? 120),
      y: wy - ((partial.h as number) ?? 55),
      w: partial.w ?? 240,
      h: partial.h ?? 110,
      tags: partial.tags ?? [],
      color: partial.color,
      icon: partial.icon,
    });
    notify();
    actions.selectNode(n.id);
    return n.id;
  },
  updateNode(id: string, patch: Partial<MMNode>) {
    pushUndo();
    const n = state.project.nodes[id];
    if (!n || n.editLocked) return;
    Object.assign(n, patch, { updated: Date.now() });
    notify();
  },
  moveNodes(ids: string[], dx: number, dy: number, snap = false, grid = 40) {
    pushUndo();
    const snapV = (v: number) => (snap ? Math.round(v / grid) * grid : v);
    for (const id of ids) {
      const n = state.project.nodes[id];
      if (!n || n.locked) continue;
      n.x = snapV(n.x + dx);
      n.y = snapV(n.y + dy);
      n.updated = Date.now();
    }
    notify();
  },
  resizeNode(id: string, w: number, h: number, anchor?: "se" | "sw" | "ne" | "nw") {
    pushUndo();
    const n = state.project.nodes[id];
    if (!n || n.locked) return;
    const oldW = n.w;
    const oldH = n.h;
    n.w = Math.max(80, w);
    n.h = Math.max(60, h);
    if (anchor === "sw" || anchor === "nw") {
      n.x -= n.w - oldW;
    }
    if (anchor === "ne" || anchor === "nw") {
      n.y -= n.h - oldH;
    }
    n.updated = Date.now();
    notify();
  },
  deleteNodes(ids: string[]) {
    if (!ids.length) return;
    pushUndo();
    const setIds = new Set(ids);
    for (const id of ids) delete state.project.nodes[id];
    for (const e of Object.values(state.project.edges)) {
      if (setIds.has(e.from) || setIds.has(e.to)) delete state.project.edges[e.id];
    }
    notify();
    actions.clearSelection();
  },
  duplicateNodes(ids: string[]) {
    if (!ids.length) return;
    pushUndo();
    const p = state.project;
    const idMap: Record<string, string> = {};
    const newIds: string[] = [];
    for (const id of ids) {
      const n = p.nodes[id];
      if (!n) continue;
      const clone = createNode(p, {
        ...n,
        id: uid(),
        x: n.x + 30,
        y: n.y + 30,
        worldId: n.worldId,
      });
      clone.created = Date.now();
      clone.updated = Date.now();
      idMap[id] = clone.id;
      newIds.push(clone.id);
    }
    for (const e of Object.values(p.edges)) {
      if (idMap[e.from] && idMap[e.to]) {
        createEdge(p, {
          ...e,
          id: uid(),
          from: idMap[e.from],
          to: idMap[e.to],
          worldId: p.currentWorldId,
        });
      }
    }
    notify();
    actions.selectNode(newIds);
    return newIds;
  },
  linkNodes(ids: string[]) {
    if (ids.length < 2) return;
    pushUndo();
    const p = state.project;
    for (let i = 1; i < ids.length; i++) {
      createEdge(p, { from: ids[i - 1], to: ids[i], worldId: p.currentWorldId });
    }
    notify();
  },
  cloneAsLinked(id: string, wx: number, wy: number) {
    pushUndo();
    const src = state.project.nodes[id];
    if (!src) return;
    const n = createNode(state.project, {
      ...src,
      id: uid(),
      linkedToId: id,
      x: wx - src.w / 2,
      y: wy - src.h / 2,
      worldId: state.project.currentWorldId,
    });
    notify();
    actions.selectNode(n.id);
    return n.id;
  },
  createEdgeFromTo(from: string, to: string) {
    if (from === to) return;
    pushUndo();
    createEdge(state.project, { from, to, worldId: state.project.currentWorldId });
    notify();
  },
  updateEdge(id: string, patch: Partial<MMEdge>) {
    pushUndo();
    const e = state.project.nodes[id] ? null : state.project.edges[id];
    if (!e) return;
    Object.assign(e, patch, { updated: Date.now() });
    notify();
  },
  deleteEdges(ids: string[]) {
    if (!ids.length) return;
    pushUndo();
    for (const id of ids) delete state.project.edges[id];
    notify();
    actions.clearSelection();
  },
  setNodeColor(id: string, color: MMColor) {
    actions.updateNode(id, { color });
  },
  setNodeStatus(id: string, status: NodeStatus) {
    actions.updateNode(id, { status });
  },
  setNodeProgress(id: string, progress: number) {
    actions.updateNode(id, { progress: clamp(progress, 0, 1) });
  },
  setChecklistItem(id: string, itemId: string, patch: Partial<ChecklistItem>) {
    const n = state.project.nodes[id];
    if (!n) return;
    pushUndo();
    const list = n.checklist ?? [];
    const next = list.map((it) => (it.id === itemId ? { ...it, ...patch } : it));
    n.checklist = next;
    n.updated = Date.now();
    notify();
  },
  addChecklistItem(id: string, text: string) {
    const n = state.project.nodes[id];
    if (!n) return;
    pushUndo();
    n.checklist = [...(n.checklist ?? []), { id: uid(), text, done: false }];
    n.updated = Date.now();
    notify();
  },
  removeChecklistItem(id: string, itemId: string) {
    const n = state.project.nodes[id];
    if (!n) return;
    pushUndo();
    n.checklist = (n.checklist ?? []).filter((it) => it.id !== itemId);
    n.updated = Date.now();
    notify();
  },
  addTagToNode(nodeId: string, tagName: string) {
    const n = state.project.nodes[nodeId];
    if (!n) return;
    const tag = ensureTag(state.project, tagName);
    pushUndo();
    n.tags = Array.from(new Set([...(n.tags ?? []), tag.id]));
    n.updated = Date.now();
    notify();
  },
  removeTagFromNode(nodeId: string, tagId: string) {
    const n = state.project.nodes[nodeId];
    if (!n) return;
    pushUndo();
    n.tags = (n.tags ?? []).filter((t) => t !== tagId);
    n.updated = Date.now();
    notify();
  },
  toggleNode(id: string, flag: "locked" | "editLocked" | "pinned" | "favourite" | "hidden") {
    const n = state.project.nodes[id];
    if (!n) return;
    pushUndo();
    (n as any)[flag] = !(n as any)[flag];
    n.updated = Date.now();
    notify();
  },
  setPortalTo(nodeId: string, targetNodeId: string) {
    actions.updateNode(nodeId, {
      isPortal: true,
      portalTarget: targetNodeId,
      kind: "text",
    });
  },
  convertToWorld(nodeId: string) {
    const n = state.project.nodes[nodeId];
    if (!n) return;
    pushUndo();
    if (!n.childWorldId) {
      n.childWorldId = createChildWorld(state.project, state.project.currentWorldId, n.title, "🧩");
    }
    n.isWorld = true;
    n.kind = "world";
    n.updated = Date.now();
    notify();
  },
  enterWorld(worldId: string) {
    if (!state.project.worlds[worldId]) return;
    state.project.currentWorldId = worldId;
    const w = state.project.worlds[worldId];
    state.camera = w.camera ?? { x: 0, y: 0, zoom: 1 };
    actions.clearSelection();
    notify();
  },
  leaveToParentWorld() {
    const cur = state.project.worlds[state.project.currentWorldId];
    if (!cur?.parentWorldId) return;
    actions.enterWorld(cur.parentWorldId);
  },
  renameWorld(worldId: string, name: string, emoji?: string) {
    const w = state.project.worlds[worldId];
    if (!w) return;
    pushUndo();
    w.name = name;
    if (emoji != null) w.emoji = emoji;
    w.updated = Date.now();
    notify();
  },
  createWorld(name: string, emoji?: string, parentId?: string): string {
    pushUndo();
    const id = createChildWorld(
      state.project,
      parentId ?? state.project.currentWorldId,
      name,
      emoji,
    );
    notify();
    return id;
  },
  setInspector(v: boolean) {
    setPartial({ ui: { ...state.ui, inspectorOpen: v } });
  },
  setAtlas(v: boolean) {
    setPartial({ ui: { ...state.ui, atlasOpen: v } });
  },
  setSearch(v: boolean, q?: string) {
    setPartial({
      ui: {
        ...state.ui,
        searchOpen: v,
        searchingFor: q ?? state.ui.searchingFor,
      },
    });
  },
  setSearchQuery(q: string, matches: string[], active?: string) {
    setPartial({
      ui: { ...state.ui, searchingFor: q, matches, activeMatch: active },
    });
  },
  setCommandPalette(v: boolean) {
    setPartial({ ui: { ...state.ui, commandPaletteOpen: v } });
  },
  setHovered(nodeId?: string, edgeId?: string) {
    setPartial({
      ui: { ...state.ui, hoveredNodeId: nodeId, hoveredEdgeId: edgeId },
    });
  },
  addCameraBookmark(name: string) {
    const bm: MMCameraBookmark = {
      id: uid(),
      worldId: state.project.currentWorldId,
      name,
      x: state.camera.x,
      y: state.camera.y,
      zoom: state.camera.zoom,
    };
    pushUndo();
    state.project.bookmarks.push(bm);
    notify();
    return bm.id;
  },
  gotoBookmark(id: string) {
    const bm = state.project.bookmarks.find((b) => b.id === id);
    if (!bm) return;
    if (bm.worldId !== state.project.currentWorldId) {
      actions.enterWorld(bm.worldId);
    }
    actions.setCamera(bm.x, bm.y, bm.zoom);
  },
  startPresentation(nodeIds?: string[]) {
    const ids =
      nodeIds ??
      (state.ui.selectedNodeIds.length
        ? state.ui.selectedNodeIds
        : Object.values(state.project.nodes)
            .filter((n) => n.worldId === state.project.currentWorldId)
            .map((n) => n.id));
    setPartial({
      ui: {
        ...state.ui,
        presentation: { active: true, nodeIds: ids, index: 0 },
      },
    });
    if (ids[0]) actions.fitNode(ids[0]);
  },
  stepPresentation(dir: 1 | -1) {
    const p = state.ui.presentation;
    if (!p.active) return;
    const nextIndex = clamp(p.index + dir, 0, p.nodeIds.length - 1);
    setPartial({
      ui: {
        ...state.ui,
        presentation: { ...p, index: nextIndex },
      },
    });
    const id = p.nodeIds[nextIndex];
    if (id) actions.fitNode(id);
  },
  stopPresentation() {
    setPartial({
      ui: {
        ...state.ui,
        presentation: { ...state.ui.presentation, active: false },
      },
    });
  },
  updateSettings(patch: Partial<MMProject["settings"]>) {
    pushUndo();
    state.project.settings = { ...state.project.settings, ...patch };
    notify();
  },
  undo() {
    const prev = undoStack.pop();
    if (!prev) return;
    redoStack.push(JSON.stringify(state.project));
    state.project = JSON.parse(prev) as MMProject;
    state.camera =
      state.project.worlds[state.project.currentWorldId]?.camera ?? state.camera;
    notify();
  },
  redo() {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(JSON.stringify(state.project));
    state.project = JSON.parse(next) as MMProject;
    state.camera =
      state.project.worlds[state.project.currentWorldId]?.camera ?? state.camera;
    notify();
  },
  saveNow() {
    persist();
  },
  exportJSON(): string {
    return JSON.stringify(state.project, null, 2);
  },
  importJSON(text: string) {
    const parsed = JSON.parse(text) as MMProject;
    if (parsed.version !== 1) throw new Error("Unsupported version");
    pushUndo();
    state.project = parsed;
    state.camera =
      state.project.worlds[state.project.currentWorldId]?.camera ?? {
        x: 0,
        y: 0,
        zoom: 1,
      };
    notify();
    persist();
  },
  takeSnapshot(name?: string) {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY) ?? "[]";
      const snaps = JSON.parse(raw) as Array<{
        id: string;
        name: string;
        ts: number;
        data: string;
      }>;
      snaps.push({
        id: uid(),
        name: name ?? `Snapshot ${new Date().toLocaleString()}`,
        ts: Date.now(),
        data: JSON.stringify(state.project),
      });
      if (snaps.length > 50) snaps.splice(0, snaps.length - 50);
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snaps));
    } catch {}
  },
  listSnapshots() {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY) ?? "[]";
      return JSON.parse(raw) as Array<{
        id: string;
        name: string;
        ts: number;
        data: string;
      }>;
    } catch {
      return [];
    }
  },
  restoreSnapshot(id: string) {
    const snaps = actions.listSnapshots();
    const s = snaps.find((x) => x.id === id);
    if (!s) return;
    pushUndo();
    state.project = JSON.parse(s.data) as MMProject;
    state.camera =
      state.project.worlds[state.project.currentWorldId]?.camera ?? {
        x: 0,
        y: 0,
        zoom: 1,
      };
    notify();
  },
  resetProject() {
    pushUndo();
    state.project = seededProject();
    state.camera = state.project.worlds[state.project.currentWorldId].camera!;
    notify();
  },
  setProjectName(name: string) {
    pushUndo();
    state.project.name = name;
    notify();
  },
  jumpToNode(id: string) {
    const n = state.project.nodes[id];
    if (!n) return;
    if (n.worldId !== state.project.currentWorldId) {
      actions.enterWorld(n.worldId);
    }
    actions.selectNode(id);
    actions.fitNode(id);
  },
  layoutAuto(worldId?: string) {
    const wid = worldId ?? state.project.currentWorldId;
    const nodes = Object.values(state.project.nodes).filter(
      (n) => n.worldId === wid && !n.parentId,
    );
    if (!nodes.length) return;
    pushUndo();
    const byId = (id: string) => state.project.nodes[id];
    const roots = nodes.filter((n) => {
      for (const e of Object.values(state.project.edges)) {
        if (e.to === n.id) return false;
      }
      return true;
    });
    const startNodes = roots.length ? roots : nodes.slice(0, 1);
    const visited = new Set<string>();
    const spacingX = 320;
    const spacingY = 220;
    let cursorY = 0;
    const layout = (id: string, depth: number, yStart: number) => {
      if (visited.has(id)) return { yUsed: 0 };
      visited.add(id);
      const node = byId(id);
      if (!node) return { yUsed: 0 };
      node.x = depth * spacingX;
      node.y = yStart;
      const children: string[] = [];
      for (const e of Object.values(state.project.edges)) {
        if (e.from === id) children.push(e.to);
      }
      let y = yStart;
      if (children.length) {
        for (const cid of children) {
          const res = layout(cid, depth + 1, y);
          y += Math.max(spacingY, res.yUsed);
        }
        const first = byId(children[0]);
        const last = byId(children[children.length - 1]);
        if (first && last) {
          node.y = (first.y + last.y + last.h) / 2 - node.h / 2;
        }
      }
      return { yUsed: children.length ? y - yStart : spacingY };
    };
    for (const r of startNodes) {
      const res = layout(r.id, 0, cursorY);
      cursorY += Math.max(spacingY, res.yUsed);
    }
    notify();
    actions.resetCamera();
  },
};

function worldNodesBoundingBox() {
  const nodes = Object.values(state.project.nodes).filter(
    (n) => n.worldId === state.project.currentWorldId,
  );
  if (!nodes.length) return null;
  let x1 = Infinity,
    y1 = Infinity,
    x2 = -Infinity,
    y2 = -Infinity;
  for (const n of nodes) {
    x1 = Math.min(x1, n.x);
    y1 = Math.min(y1, n.y);
    x2 = Math.max(x2, n.x + n.w);
    y2 = Math.max(y2, n.y + n.h);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export const viewportSizeRef = { current: { w: 1200, h: 800 } };
export function setViewportSize(w: number, h: number) {
  viewportSizeRef.current = { w, h };
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => persist());
}
