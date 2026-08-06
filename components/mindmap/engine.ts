import type { MMNode, MMEdge, Rect, Vec2, EdgeStyle, MMProject } from "./types";

export const uid = (len = 9): string =>
  (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12)).slice(
    0,
    len,
  );

export const clamp = (v: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const snap = (v: number, size: number): number =>
  Math.round(v / size) * size;

export const snapPoint = (p: Vec2, size: number): Vec2 => ({
  x: snap(p.x, size),
  y: snap(p.y, size),
});

export const rectsOverlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const pointInRect = (p: Vec2, r: Rect): boolean =>
  p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export const nodeRect = (n: MMNode): Rect => ({ x: n.x, y: n.y, w: n.w, h: n.h });

export function nodesBoundingBox(nodes: MMNode[]): Rect | null {
  if (!nodes.length) return null;
  let x1 = Infinity,
    y1 = Infinity,
    x2 = -Infinity,
    y2 = -Infinity;
  for (const n of nodes) {
    if (n.x < x1) x1 = n.x;
    if (n.y < y1) y1 = n.y;
    if (n.x + n.w > x2) x2 = n.x + n.w;
    if (n.y + n.h > y2) y2 = n.y + n.h;
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export function screenToWorld(
  sx: number,
  sy: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): Vec2 {
  return {
    x: (sx - offsetX) / zoom,
    y: (sy - offsetY) / zoom,
  };
}

export function worldToScreen(
  wx: number,
  wy: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): Vec2 {
  return { x: wx * zoom + offsetX, y: wy * zoom + offsetY };
}

export function bezierPoints(
  a: Vec2,
  b: Vec2,
  style: EdgeStyle,
): { d: string; mid: Vec2; controlA: Vec2; controlB: Vec2 } {
  const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
  const dy = Math.max(40, Math.abs(b.y - a.y) * 0.5);
  let controlA: Vec2;
  let controlB: Vec2;
  if (style === "straight") {
    controlA = a;
    controlB = b;
  } else if (style === "orthogonal") {
    const mx = (a.x + b.x) / 2;
    controlA = { x: mx, y: a.y };
    controlB = { x: mx, y: b.y };
  } else {
    controlA = { x: a.x + dx, y: a.y };
    controlB = { x: b.x - dx, y: b.y };
  }
  const d =
    style === "orthogonal"
      ? `M ${a.x} ${a.y} L ${controlA.x} ${controlA.y} L ${controlB.x} ${controlB.y} L ${b.x} ${b.y}`
      : `M ${a.x} ${a.y} C ${controlA.x} ${controlA.y} ${controlB.x} ${controlB.y} ${b.x} ${b.y}`;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return { d, mid, controlA, controlB };
}

export function nodeAnchors(n: MMNode): {
  left: Vec2;
  right: Vec2;
  top: Vec2;
  bottom: Vec2;
  center: Vec2;
} {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  return {
    left: { x: n.x, y: cy },
    right: { x: n.x + n.w, y: cy },
    top: { x: cx, y: n.y },
    bottom: { x: cx, y: n.y + n.h },
    center: { x: cx, y: cy },
  };
}

export function nearestAnchor(from: MMNode, to: Vec2): Vec2 {
  const a = nodeAnchors(from);
  const cands = [a.left, a.right, a.top, a.bottom, a.center];
  let best = a.center;
  let bd = Infinity;
  for (const c of cands) {
    const d = (c.x - to.x) ** 2 + (c.y - to.y) ** 2;
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}

export function fuzzyMatch(text: string, query: string): number {
  if (!query) return 1;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return 1 + 1 / (1 + Math.abs(t.length - q.length));
  let ti = 0;
  let score = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    let found = -1;
    for (let j = ti; j < t.length; j++) {
      if (t[j] === ch) {
        found = j;
        break;
      }
    }
    if (found === -1) return 0;
    score += 1 / (1 + (found - ti));
    ti = found + 1;
  }
  return score / q.length;
}

export function searchInProject(
  p: MMProject,
  q: string,
): { score: number; nodeId: string; field: string; snippet: string }[] {
  const out: { score: number; nodeId: string; field: string; snippet: string }[] =
    [];
  if (!q) return out;
  const lower = q.toLowerCase();
  for (const n of Object.values(p.nodes)) {
    const fields: [string, string][] = [
      ["title", n.title],
      ["subtitle", n.subtitle ?? ""],
      ["description", n.description ?? ""],
      ["notes", n.notes ?? ""],
      ["tags", n.tags.join(",")],
    ];
    for (const [field, val] of fields) {
      if (!val) continue;
      const score = fuzzyMatch(val, lower);
      if (score > 0) {
        const idx = Math.max(0, val.toLowerCase().indexOf(lower));
        const snippet = val.slice(Math.max(0, idx - 24), idx + 120);
        out.push({ score, nodeId: n.id, field, snippet });
        break;
      }
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const PALETTE = [
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#60a5fa",
  "#f97316",
  "#e879f9",
  "#38bdf8",
];

export function colorForString(s: string): string {
  return PALETTE[hashString(s) % PALETTE.length];
}

export function projectStats(p: MMProject) {
  const nodes = Object.values(p.nodes);
  const words = nodes.reduce(
    (sum, n) =>
      sum +
      (n.title?.split(/\s+/).length ?? 0) +
      (n.description?.split(/\s+/).length ?? 0) +
      (n.notes?.split(/\s+/).length ?? 0),
    0,
  );
  const todos = nodes.filter((n) => n.status === "todo").length;
  const done = nodes.filter((n) => n.status === "done").length;
  const tagsCount = Object.values(p.tags).length;
  let maxBranch = 0;
  let mostConnected: string | null = null;
  let mostCount = -1;
  const counts: Record<string, number> = {};
  for (const e of Object.values(p.edges)) {
    counts[e.from] = (counts[e.from] ?? 0) + 1;
    counts[e.to] = (counts[e.to] ?? 0) + 1;
  }
  for (const [id, c] of Object.entries(counts)) {
    if (c > mostCount) {
      mostCount = c;
      mostConnected = id;
    }
  }
  return {
    totalNodes: nodes.length,
    totalEdges: Object.values(p.edges).length,
    totalWorlds: Object.values(p.worlds).length,
    totalWords: words,
    openTasks: todos,
    completedTasks: done,
    tagsUsed: tagsCount,
    largestBranch: maxBranch,
    mostConnectedNode: mostConnected,
    density:
      nodes.length <= 1
        ? 0
        : (2 * Object.values(p.edges).length) /
          (nodes.length * (nodes.length - 1)),
  };
}

export function edgesForNode(
  edges: Record<string, MMEdge>,
  nodeId: string,
): MMEdge[] {
  const out: MMEdge[] = [];
  for (const e of Object.values(edges)) {
    if (e.from === nodeId || e.to === nodeId) out.push(e);
  }
  return out;
}
