import { DEFAULT_SETTINGS, type MMProject } from "./types";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** Validate a complete map before allowing it to replace the current map. */
export function parseProject(text: string): MMProject {
  const value: unknown = JSON.parse(text);
  const fail = (): never => { throw new Error("Invalid mindmap file. Your current map has not been replaced."); };
  if (!record(value) || value.version !== 1 || typeof value.name !== "string" ||
    !record(value.worlds) || !record(value.nodes) || !record(value.edges) ||
    !record(value.tags) || !record(value.settings) || !Array.isArray(value.bookmarks) ||
    !Array.isArray(value.history) || !finite(value.created) || !finite(value.updated) ||
    typeof value.rootWorldId !== "string" || typeof value.currentWorldId !== "string") return fail();
  const worlds = value.worlds;
  if (!worlds[value.rootWorldId] || !worlds[value.currentWorldId]) return fail();
  for (const [id, world] of Object.entries(worlds)) {
    if (!record(world) || world.id !== id || typeof world.name !== "string") return fail();
    if (world.camera != null && (!record(world.camera) || !finite(world.camera.x) ||
      !finite(world.camera.y) || !finite(world.camera.zoom) || world.camera.zoom < 0.05 || world.camera.zoom > 12)) return fail();
    const visited = new Set([id]);
    let parent = world.parentWorldId;
    while (parent != null) {
      if (typeof parent !== "string" || visited.has(parent) || !record(worlds[parent])) return fail();
      visited.add(parent);
      parent = (worlds[parent] as Record<string, unknown>).parentWorldId;
    }
  }
  for (const [id, node] of Object.entries(value.nodes)) {
    if (!record(node) || node.id !== id || typeof node.title !== "string" ||
      typeof node.worldId !== "string" || !worlds[node.worldId] || typeof node.kind !== "string" ||
      !finite(node.x) || !finite(node.y) || !finite(node.w) || !finite(node.h) || node.w <= 0 || node.h <= 0 ||
      !Array.isArray(node.tags) || !node.tags.every(t => typeof t === "string")) return fail();
    for (const key of ["subtitle", "description", "notes", "icon"])
      if (node[key] != null && typeof node[key] !== "string") return fail();
    if (node.childWorldId != null && (typeof node.childWorldId !== "string" || !worlds[node.childWorldId])) return fail();
    if (node.checklist != null && (!Array.isArray(node.checklist) || !node.checklist.every(item =>
      record(item) && typeof item.id === "string" && typeof item.text === "string" && typeof item.done === "boolean"))) return fail();
    if (node.color != null && (!record(node.color) || Object.entries(node.color).some(([key, color]) =>
      key === "gradient" ? !Array.isArray(color) || color.length !== 2 || !color.every(c => typeof c === "string") : typeof color !== "string"))) return fail();
  }
  const nodes = value.nodes;
  for (const [id, edge] of Object.entries(value.edges)) {
    if (!record(edge) || edge.id !== id || typeof edge.from !== "string" || typeof edge.to !== "string" ||
      !record(nodes[edge.from]) || !record(nodes[edge.to]) || typeof edge.worldId !== "string" ||
      !worlds[edge.worldId] || (nodes[edge.from] as Record<string, unknown>).worldId !== edge.worldId || (nodes[edge.to] as Record<string, unknown>).worldId !== edge.worldId ||
      (edge.label != null && typeof edge.label !== "string")) return fail();
  }
  for (const [id, tag] of Object.entries(value.tags))
    if (!record(tag) || tag.id !== id || typeof tag.name !== "string" || typeof tag.color !== "string") return fail();
  value.settings = { ...DEFAULT_SETTINGS, ...value.settings };
  const settings = value.settings as Record<string, unknown>;
  if (!["dark", "light", "amoled"].includes(String(settings.theme)) ||
    !finite(settings.gridSize) || settings.gridSize < 10 ||
    !finite(settings.autoSaveIntervalMs) || settings.autoSaveIntervalMs < 500) return fail();
  return value as unknown as MMProject;
}
