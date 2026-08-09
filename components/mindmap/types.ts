export type NodeKind =
  | "text"
  | "document"
  | "checklist"
  | "kanban"
  | "spreadsheet"
  | "calendar"
  | "whiteboard"
  | "code"
  | "bookmarks"
  | "gallery"
  | "database"
  | "timer"
  | "calculator"
  | "world";

export type NodeStatus = "none" | "todo" | "in-progress" | "done" | "blocked";
export type EdgeStyle = "bezier" | "straight" | "orthogonal";
export type EdgeDirection = "none" | "forward" | "back" | "both";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MMColor {
  fill?: string;
  stroke?: string;
  text?: string;
  gradient?: [string, string];
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface MMNode {
  id: string;
  worldId: string;
  parentId?: string;
  linkedToId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  notes?: string;
  kind: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  locked?: boolean;
  editLocked?: boolean;
  pinned?: boolean;
  favourite?: boolean;
  hidden?: boolean;
  color?: MMColor;
  shape?: "card" | "pill" | "diamond" | "hex" | "circle" | "document";
  opacity?: number;
  tags: string[];
  status?: NodeStatus;
  priority?: 0 | 1 | 2 | 3 | 4;
  progress?: number;
  dueDate?: string;
  reminder?: string;
  created: number;
  updated: number;
  checklist?: ChecklistItem[];
  attachments?: string[];
  comments?: string[];
  custom?: Record<string, unknown>;
  isWorld?: boolean;
  isPortal?: boolean;
  portalTarget?: string;
  childWorldId?: string;
  icon?: string;
  font?: { size?: number; family?: string; bold?: boolean };
  order?: number;
  _v?: number;
}

export interface MMEdge {
  id: string;
  worldId: string;
  from: string;
  to: string;
  label?: string;
  style?: EdgeStyle;
  direction?: EdgeDirection;
  color?: string;
  thickness?: number;
  dashed?: boolean;
  weight?: number;
  created: number;
  updated: number;
}

export interface MMTag {
  id: string;
  name: string;
  color: string;
}

export interface MMWorld {
  id: string;
  name: string;
  emoji?: string;
  parentWorldId?: string;
  camera?: { x: number; y: number; zoom: number };
  background?: string;
  created: number;
  updated: number;
}

export interface MMCameraBookmark {
  id: string;
  worldId: string;
  name: string;
  x: number;
  y: number;
  zoom: number;
}

export interface MMSettings {
  theme: "dark" | "light" | "amoled";
  accent: string;
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  smartGuides: boolean;
  rulersEnabled: boolean;
  minimapEnabled: boolean;
  wasdEnabled: boolean;
  inertiaEnabled: boolean;
  autoSave: boolean;
  autoSaveIntervalMs: number;
  nodePreset: Partial<MMNode>;
}

export interface MMSnapshot {
  id: string;
  name: string;
  timestamp: number;
  data: string;
}

export interface MMProject {
  version: 1;
  name: string;
  created: number;
  updated: number;
  rootWorldId: string;
  currentWorldId: string;
  worlds: Record<string, MMWorld>;
  nodes: Record<string, MMNode>;
  edges: Record<string, MMEdge>;
  tags: Record<string, MMTag>;
  bookmarks: MMCameraBookmark[];
  history: Array<{ id: string; at: number; kind: string; targetId: string }>;
  settings: MMSettings;
}

export type SelectionMode = "nodes" | "edges" | "mixed";

export interface MMUIState {
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  hoveredNodeId?: string;
  hoveredEdgeId?: string;
  inspectorOpen: boolean;
  atlasOpen: boolean;
  searchOpen: boolean;
  commandPaletteOpen: boolean;
  presentation: { active: boolean; nodeIds: string[]; index: number };
  tempEdge?: { from: string; toX: number; toY: number };
  marquee?: { x1: number; y1: number; x2: number; y2: number };
  searchingFor?: string;
  matches: string[];
  activeMatch?: string;
  connectFromId?: string;
  connectAwaitFirst?: boolean;
}

export const DEFAULT_SETTINGS: MMSettings = {
  theme: "dark",
  accent: "#22d3ee",
  gridEnabled: true,
  gridSize: 40,
  snapToGrid: false,
  smartGuides: true,
  rulersEnabled: false,
  minimapEnabled: true,
  wasdEnabled: false,
  inertiaEnabled: true,
  autoSave: true,
  autoSaveIntervalMs: 5000,
  nodePreset: { shape: "card", kind: "text", w: 240, h: 110 },
};
