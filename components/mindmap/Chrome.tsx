"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { actions, useStore } from "./store";
import type { MMEdge, MMNode, NodeKind, NodeStatus, MMProject } from "./types";
import { PALETTE, colorForString, projectStats, uid } from "./engine";
import { download, exportSVG, toCSV, toMarkdown, toOPML, toPlainText, exportPNG } from "./exporters";

export function Toolbar() {
  const project = useStore((s) => s.project);
  const ui = useStore((s) => s.ui);
  const camera = useStore((s) => s.camera);
  const stats = useMemo(() => projectStats(project), [project]);
  const world = project.worlds[project.currentWorldId];
  const parentWorld = world?.parentWorldId
    ? project.worlds[world.parentWorldId]
    : undefined;

  return (
    <div className="relative z-50 flex flex-col gap-2">
      <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur">
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1">
          <span className="text-base">{world?.emoji ?? "🌐"}</span>
          <input
            value={world?.name ?? ""}
            onChange={(e) => actions.renameWorld(project.currentWorldId, e.target.value, world?.emoji)}
            className="w-32 bg-transparent text-xs font-semibold text-zinc-100 outline-none placeholder:text-zinc-500"
            placeholder="World name"
          />
        </div>
        {parentWorld && (
          <button
            onClick={() => actions.leaveToParentWorld()}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] text-zinc-200 hover:bg-white/[0.08]"
            title="Go to parent world"
          >
            ← {parentWorld.emoji} {parentWorld.name.length > 14 ? parentWorld.name.slice(0, 14) + "…" : parentWorld.name}
          </button>
        )}

        <div className="mx-1 shrink-0 h-5 w-px bg-white/10" />

        <ToolBtn onClick={() => actions.resetCamera()} title="Home (H)">🏠</ToolBtn>
        <ToolBtn onClick={() => actions.fitSelection()} title="Fit selection (F)">🎯 Fit</ToolBtn>
        <ZoomControls zoom={camera.zoom} />

        <div className="mx-1 shrink-0 h-5 w-px bg-white/10" />

        <AddMenu onPick={(kind) => {
          const { x, y } = { x: -camera.x / camera.zoom, y: -camera.y / camera.zoom };
          const id = actions.createNodeAt(x + 200, y + 200, {
            kind,
            title: kind === "checklist" ? "Checklist" : kind === "world" ? "New World" : kind === "kanban" ? "Kanban" : "New Node",
          });
          if (kind === "world") actions.convertToWorld(id);
          if (kind === "checklist")
            actions.updateNode(id, {
              checklist: [
                { id: uid(), text: "Item 1", done: false },
                { id: uid(), text: "Item 2", done: true },
              ],
            });
        }} />

        <ToolBtn
          onClick={() => actions.duplicateNodes(ui.selectedNodeIds)}
          disabled={!ui.selectedNodeIds.length}
          title="Duplicate (Ctrl+D)"
        >
          ⎘
        </ToolBtn>
        <ToolBtn
          onClick={() => actions.deleteNodes(ui.selectedNodeIds)}
          disabled={!ui.selectedNodeIds.length}
          title="Delete (Del)"
        >
          🗑
        </ToolBtn>
        <ToolBtn
          onClick={() => actions.linkNodes(ui.selectedNodeIds)}
          disabled={ui.selectedNodeIds.length < 2}
          title="Connect selected"
        >
          🔗
        </ToolBtn>

        <div className="mx-1 shrink-0 h-5 w-px bg-white/10" />

        <ToolBtn onClick={() => actions.undo()} title="Undo (Ctrl+Z)">↶</ToolBtn>
        <ToolBtn onClick={() => actions.redo()} title="Redo (Ctrl+Y)">↷</ToolBtn>

        <div className="mx-1 shrink-0 h-5 w-px bg-white/10" />

        <ToolBtn onClick={() => actions.setAtlas(!ui.atlasOpen)} active={ui.atlasOpen} title="Atlas / Worlds">
          🗺
        </ToolBtn>
        <ToolBtn onClick={() => actions.setInspector(!ui.inspectorOpen)} active={ui.inspectorOpen} title="Inspector">
          🧩
        </ToolBtn>
        <SettingsMenu />
        <ExportMenu />
        <ImportBtn />
      </div>
    </div>
  );
}

function ToolBtn(props: {
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
      className={
        "inline-flex shrink-0 items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition " +
        (props.disabled
          ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-600"
          : props.active
            ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
            : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]")
      }
    >
      {props.children}
    </button>
  );
}

function ZoomControls({ zoom }: { zoom: number }) {
  const pct = Math.round(zoom * 100);
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1">
      <button
        onClick={() => actions.setZoom(zoom * 0.8)}
        className="h-5 w-5 rounded-md text-zinc-200 hover:bg-white/10"
        title="Zoom out"
      >
        −
      </button>
      <input
        type="range"
        min={5}
        max={800}
        value={pct}
        onChange={(e) => actions.setZoom(Number(e.target.value) / 100)}
        className="w-20 accent-cyan-400"
      />
      <button
        onClick={() => actions.setZoom(zoom * 1.2)}
        className="h-5 w-5 rounded-md text-zinc-200 hover:bg-white/10"
        title="Zoom in"
      >
        +
      </button>
      <span className="w-10 shrink-0 text-right font-mono text-[10px] text-cyan-300">{pct}%</span>
    </div>
  );
}

function AddMenu({ onPick }: { onPick: (k: NodeKind) => void }) {
  const [open, setOpen] = useState(false);
  const items: { kind: NodeKind; label: string; icon: string }[] = [
    { kind: "text", label: "Text Card", icon: "💡" },
    { kind: "document", label: "Rich Doc", icon: "📄" },
    { kind: "checklist", label: "Checklist", icon: "☑️" },
    { kind: "kanban", label: "Kanban Board", icon: "🗂" },
    { kind: "calendar", label: "Calendar", icon: "📅" },
    { kind: "code", label: "Code Snippet", icon: "⟨/⟩" },
    { kind: "world", label: "Sub-World", icon: "🌐" },
  ];
  return (
    <div className="relative">
      <ToolBtn onClick={() => setOpen((o) => !o)}>+ Add Node</ToolBtn>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 grid w-52 grid-cols-1 gap-1 rounded-2xl border border-white/10 bg-[#0b0b12] p-2 shadow-2xl">
            {items.map((it) => (
              <button
                key={it.kind}
                onClick={() => {
                  onPick(it.kind);
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-zinc-200 hover:bg-white/5"
              >
                <span>{it.icon}</span>
                <span>{it.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const s = useStore((st) => st.project.settings);
  const toggle = (patch: Partial<typeof s>) => actions.updateSettings(patch);
  return (
    <div className="relative">
      <ToolBtn onClick={() => setOpen((o) => !o)} title="Settings">⚙ Settings</ToolBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-[#0b0b12] p-3 text-xs shadow-2xl">
            <Section title="Theme">
              {(["dark", "light", "amoled"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => toggle({ theme: t })}
                  className={
                    "rounded-lg border px-3 py-1.5 capitalize transition " +
                    (s.theme === t
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                      : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/10")
                  }
                >
                  {t}
                </button>
              ))}
            </Section>
            <SwitchRow label="Grid" on={s.gridEnabled} onChange={(v) => toggle({ gridEnabled: v })} />
            <SwitchRow label="Snap to grid" on={s.snapToGrid} onChange={(v) => toggle({ snapToGrid: v })} />
            <SwitchRow label="Rulers" on={s.rulersEnabled} onChange={(v) => toggle({ rulersEnabled: v })} />
            <SwitchRow label="Minimap" on={s.minimapEnabled} onChange={(v) => toggle({ minimapEnabled: v })} />
            <SwitchRow label="WASD movement" on={s.wasdEnabled} onChange={(v) => toggle({ wasdEnabled: v })} />
            <SwitchRow label="Inertia panning" on={s.inertiaEnabled} onChange={(v) => toggle({ inertiaEnabled: v })} />
            <SwitchRow label="Autosave" on={s.autoSave} onChange={(v) => toggle({ autoSave: v })} />
            <Section title="Grid size">
              <input
                type="range"
                min={10}
                max={120}
                value={s.gridSize}
                onChange={(e) => toggle({ gridSize: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
              <div className="text-[11px] text-zinc-500">{s.gridSize}px</div>
            </Section>
            <Section title="Project">
              <ProjectRename />
              <button
                className="mt-1 w-full rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1.5 text-fuchsia-200 hover:bg-fuchsia-400/20"
                onClick={() => actions.takeSnapshot()}
              >
                📸 Take snapshot
              </button>
              <SnapshotsPicker />
              <button
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 hover:bg-white/10"
                onClick={() => actions.saveNow()}
              >
                💾 Save now
              </button>
              <button
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 hover:bg-white/10"
                onClick={() => {
                  if (confirm("Reset project to sample data?")) {
                    actions.resetProject();
                    setOpen(false);
                  }
                }}
              >
                🔄 Reset sample
              </button>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectRename() {
  const name = useStore((s) => s.project.name);
  return (
    <div className="mt-1 flex gap-1">
      <input
        value={name}
        onChange={(e) => actions.setProjectName(e.target.value)}
        className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-200 outline-none focus:border-cyan-400/40"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 space-y-1">
      <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">{title}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function SwitchRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="mb-1 flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1 text-zinc-200 hover:bg-white/[0.05]"
    >
      <span>{label}</span>
      <span
        className={
          "relative h-4 w-8 rounded-full transition " +
          (on ? "bg-cyan-400/30" : "bg-white/10")
        }
      >
        <span
          className={
            "absolute top-0.5 h-3 w-3 rounded-full bg-zinc-100 transition " +
            (on ? "left-[18px]" : "left-0.5")
          }
        />
      </span>
    </button>
  );
}

function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [ok, setOk] = useState(false);
  const project = useStore((s) => s.project);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodesRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const tryInit = () => {
      svgRef.current = document.querySelector(
        "svg[data-mindmap-layer]",
      ) as SVGSVGElement | null;
      nodesRootRef.current = document.querySelector(
        "[data-mindmap-nodes]",
      ) as HTMLElement | null;
    };
    tryInit();
    const t = setInterval(tryInit, 2000);
    return () => clearInterval(t);
  }, []);

  const doExport = async (kind: string) => {
    const name = project.name.replace(/\s+/g, "-").toLowerCase();
    switch (kind) {
      case "json":
        download(`${name}.json`, JSON.stringify(project, null, 2), "application/json");
        break;
      case "md":
        download(`${name}.md`, toMarkdown(project), "text/markdown");
        break;
      case "txt":
        download(`${name}.txt`, toPlainText(project), "text/plain");
        break;
      case "csv":
        download(`${name}.csv`, toCSV(project), "text/csv");
        break;
      case "opml":
        download(`${name}.opml`, toOPML(project), "application/xml");
        break;
      case "html":
        download(
          `${name}.html`,
          `<!doctype html><html><head><meta charset="utf-8"><title>${project.name}</title></head><body style="background:#05050a;color:#e4e4e7;font-family:ui-sans-serif,system-ui;padding:40px"><pre style="white-space:pre-wrap">${escapeHtml(toMarkdown(project))}</pre></body></html>`,
          "text/html",
        );
        break;
      case "svg":
        if (svgRef.current && nodesRootRef.current)
          exportSVG(svgRef.current, nodesRootRef.current, project, project.currentWorldId);
        else alert("Canvas not ready");
        break;
      case "png":
        if (svgRef.current && nodesRootRef.current)
          await exportPNG(svgRef.current, nodesRootRef.current, project, project.currentWorldId);
        else alert("Canvas not ready");
        break;
    }
    setOk(true);
    setTimeout(() => setOk(false), 1500);
    setOpen(false);
  };
  return (
    <div className="relative">
      <ToolBtn onClick={() => setOpen((o) => !o)}>{ok ? `✓ Exported` : `⬇ Export`}</ToolBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-white/10 bg-[#0b0b12] p-2 text-xs shadow-2xl">
            {[
              ["json", "JSON (.json)"],
              ["md", "Markdown (.md)"],
              ["txt", "Plain text (.txt)"],
              ["csv", "CSV (.csv)"],
              ["svg", "SVG image (.svg)"],
              ["png", "PNG image (.png)"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => doExport(k)}
                className="w-full rounded-lg px-2 py-1.5 text-left text-zinc-200 hover:bg-white/5"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c));
}

function ImportBtn() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ok, setOk] = useState(false);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => {
            try {
              actions.importJSON(String(r.result));
              setOk(true);
              setTimeout(() => setOk(false), 1500);
            } catch (err: any) {
              alert("Import failed: " + (err?.message ?? String(err)));
            }
          };
          r.readAsText(f);
          e.target.value = "";
        }}
      />
      <ToolBtn onClick={() => inputRef.current?.click()} title="Import JSON">
        {ok ? `✓ Imported` : `⬆ Import`}
      </ToolBtn>
    </>
  );
}

export function Inspector() {
  const project = useStore((s) => s.project);
  const ui = useStore((s) => s.ui);
  const id = ui.selectedNodeIds[0];
  const eid = ui.selectedEdgeIds[0];
  const n = id ? project.nodes[id] : null;
  const e = eid ? project.edges[eid] : null;
  if (e) {
    return <EdgeInspector key={e.id} edge={e} nodesById={project.nodes} />;
  }
  if (!n) {
    return (
      <div className="flex h-full flex-col gap-4 p-4 text-xs text-zinc-400">
        <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
          Inspector
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 leading-relaxed">
          Select a node or edge to edit its properties, or open search to jump anywhere.
          <div className="mt-3 space-y-1 text-[11px]">
            <div>• Double-click canvas: create node</div>
            <div>• Drag from node ports: connect</div>
            <div>• Space+drag / middle-mouse / right-drag: pan</div>
            <div>• Scroll (wheel): zoom at cursor</div>
            <div>• Shift+scroll: pan</div>
            <div>• Ctrl+F: search · Ctrl+P: commands</div>
          </div>
        </div>
        <StatsPanel />
      </div>
    );
  }
  return <InspectorBody key={n.id} node={n} tagsById={project.tags} />;
}

function InspectorBody({
  node,
  tagsById,
}: {
  node: MMNode;
  tagsById: Record<string, { id: string; name: string; color: string }>;
}) {
  const project = useStore((s) => s.project);
  const n = node;
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
          Node · {n.kind}
        </div>
        <div className="flex gap-1">
          <IconBtn onClick={() => actions.toggleNode(n.id, "pinned")} active={!!n.pinned} title="Pin (B)">📌</IconBtn>
          <IconBtn onClick={() => actions.toggleNode(n.id, "favourite")} active={!!n.favourite} title="Fav">⭐</IconBtn>
          <IconBtn onClick={() => actions.toggleNode(n.id, "locked")} active={!!n.locked} title="Lock position (L)">🔒</IconBtn>
          <IconBtn onClick={() => actions.toggleNode(n.id, "editLocked")} active={!!n.editLocked} title="Lock editing">🛡</IconBtn>
        </div>
      </div>

      <Field label="Title">
        <input
          value={n.title}
          onChange={(e) => actions.updateNode(n.id, { title: e.target.value })}
          className="input"
        />
      </Field>
      <Field label="Subtitle">
        <input
          value={n.subtitle ?? ""}
          onChange={(e) => actions.updateNode(n.id, { subtitle: e.target.value })}
          className="input"
          placeholder="Short subtitle"
        />
      </Field>
      <Field label="Description">
        <textarea
          value={n.description ?? ""}
          onChange={(e) => actions.updateNode(n.id, { description: e.target.value })}
          className="input min-h-[60px]"
          placeholder="Long description shown on the node"
        />
      </Field>
      <Field label="Notes (Markdown)">
        <textarea
          value={n.notes ?? ""}
          onChange={(e) => actions.updateNode(n.id, { notes: e.target.value })}
          className="input min-h-[120px] font-mono text-[11px]"
          placeholder="# Notes\nSupports headings, lists, **bold**..."
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Status">
          <select
            value={n.status ?? "none"}
            onChange={(e) => actions.setNodeStatus(n.id, e.target.value as NodeStatus)}
            className="input"
          >
            <option value="none">None</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </Field>
        <Field label="Priority">
          <select
            value={String(n.priority ?? 0)}
            onChange={(e) =>
              actions.updateNode(n.id, {
                priority: Number(e.target.value) as 0 | 1 | 2 | 3 | 4,
              })
            }
            className="input"
          >
            {[0, 1, 2, 3, 4].map((p) => (
              <option key={p} value={p}>
                P{p} {p === 0 ? "(no)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due">
          <input
            type="date"
            value={n.dueDate ?? ""}
            onChange={(e) => actions.updateNode(n.id, { dueDate: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Progress">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((n.progress ?? 0) * 100)}
            onChange={(e) => actions.setNodeProgress(n.id, Number(e.target.value) / 100)}
            className="accent-cyan-400"
          />
          <div className="text-[10px] text-zinc-500">
            {Math.round((n.progress ?? 0) * 100)}%
          </div>
        </Field>
      </div>

      <Field label="Fill + Stroke">
        <div className="grid grid-cols-6 gap-1.5">
          {["", ...PALETTE].map((c, i) => {
            const fill = c ? c + "22" : "rgba(255,255,255,0.04)";
            const stroke = c ?? "rgba(255,255,255,0.1)";
            const on = n.color?.stroke === stroke || (!c && !n.color?.stroke);
            return (
              <button
                key={i}
                title={c || "default"}
                onClick={() => actions.setNodeColor(n.id, { fill, stroke })}
                className={
                  "h-7 rounded-md border transition " +
                  (on ? "ring-2 ring-cyan-400/50" : "border-white/10")
                }
                style={{ background: fill, borderColor: stroke }}
              />
            );
          })}
        </div>
      </Field>

      <Field label="Shape">
        <div className="grid grid-cols-3 gap-1.5">
          {(["card", "pill", "hex", "diamond", "circle", "document"] as const).map(
            (sh) => (
              <button
                key={sh}
                onClick={() => actions.updateNode(n.id, { shape: sh })}
                className={
                  "rounded-lg border px-2 py-1 capitalize " +
                  ((n.shape ?? "card") === sh
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/10")
                }
              >
                {sh}
              </button>
            ),
          )}
        </div>
      </Field>

      <Field label="Tags">
        <TagEditor nodeId={n.id} tags={n.tags} tagsById={tagsById} />
      </Field>

      <Field label="Checklist">
        <ChecklistEditor nodeId={n.id} items={n.checklist ?? []} />
      </Field>

      <Field label="World / Portal">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => actions.convertToWorld(n.id)}
            className={
              "rounded-lg border px-2 py-1.5 " +
              (n.isWorld
                ? "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-200"
                : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/10")
            }
          >
            {n.isWorld ? "✓ Is World" : "Make World"}
          </button>
          <button
            disabled={!n.childWorldId}
            onClick={() => n.childWorldId && actions.enterWorld(n.childWorldId)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-zinc-200 hover:bg-white/10 disabled:opacity-50"
          >
            Enter →
          </button>
        </div>
        <PortalPicker nodeId={n.id} project={project} />
      </Field>

      <Field label="Linked Clone">
        <button
          onClick={() => actions.cloneAsLinked(n.id, n.x + 200, n.y)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-zinc-200 hover:bg-white/10"
        >
          🔗 Create linked copy (same data everywhere)
        </button>
      </Field>

      <Field label="Size / Position">
        <div className="grid grid-cols-4 gap-1.5">
          {["x", "y", "w", "h"].map((k) => (
            <label key={k} className="space-y-1">
              <div className="text-[10px] uppercase text-zinc-500">{k}</div>
              <input
                type="number"
                value={Math.round((n as any)[k])}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (k === "x" || k === "y") {
                    actions.updateNode(n.id, { [k]: v } as any);
                  } else if (k === "w" || k === "h") {
                    actions.resizeNode(n.id, n.w, n.h);
                    actions.updateNode(n.id, { [k]: v } as any);
                  }
                }}
                className="input text-[11px]"
              />
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}

function EdgeInspector({
  edge,
  nodesById,
}: {
  edge: MMEdge;
  nodesById: Record<string, MMNode>;
}) {
  const fromN = nodesById[edge.from];
  const toN = nodesById[edge.to];
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
          Edge · {edge.direction ?? "forward"}
        </div>
        <button
          onClick={() => actions.deleteEdges([edge.id])}
          className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-zinc-200 hover:bg-red-500/20"
        >
          🗑 Delete
        </button>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-zinc-300">
        <div>
          From: <span className="font-mono text-cyan-200">{fromN?.title ?? "—"}</span>
        </div>
        <div>
          To: <span className="font-mono text-cyan-200">{toN?.title ?? "—"}</span>
        </div>
      </div>
      <Field label="Label">
        <input
          className="input"
          value={edge.label ?? ""}
          onChange={(e) => actions.updateEdge(edge.id, { label: e.target.value })}
          placeholder="Edge label shown on the line"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Style">
          <select
            className="input"
            value={edge.style ?? "bezier"}
            onChange={(e) =>
              actions.updateEdge(edge.id, {
                style: e.target.value as "bezier" | "straight" | "orthogonal",
              })
            }
          >
            <option value="bezier">Bézier</option>
            <option value="straight">Straight</option>
            <option value="orthogonal">Orthogonal</option>
          </select>
        </Field>
        <Field label="Direction">
          <select
            className="input"
            value={edge.direction ?? "forward"}
            onChange={(e) =>
              actions.updateEdge(edge.id, {
                direction: e.target.value as "forward" | "back" | "both" | "none",
              })
            }
          >
            <option value="forward">Forward →</option>
            <option value="back">Back ←</option>
            <option value="both">Both ↔</option>
            <option value="none">None —</option>
          </select>
        </Field>
        <Field label="Thickness">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={edge.thickness ?? 2}
            onChange={(e) =>
              actions.updateEdge(edge.id, { thickness: Number(e.target.value) })
            }
            className="accent-cyan-400"
          />
          <div className="text-[10px] text-zinc-500">{edge.thickness ?? 2}px</div>
        </Field>
        <Field label="Stroke">
          <div className="flex items-center gap-1">
            {["#64748b", "#22d3ee", "#a78bfa", "#f472b6", "#fb7185", "#fbbf24", "#34d399"].map(
              (c) => {
                const on = (edge.color ?? "#64748b") === c;
                return (
                  <button
                    key={c}
                    onClick={() => actions.updateEdge(edge.id, { color: c })}
                    title={c}
                    className={
                      "h-6 w-6 rounded-md border " +
                      (on
                        ? "ring-2 ring-cyan-400/60 border-cyan-400/40"
                        : "border-white/10")
                    }
                    style={{ background: c }}
                  />
                );
              },
            )}
            <input
              type="color"
              className="h-6 w-6 rounded-md border border-white/10"
              value={edge.color ?? "#64748b"}
              onChange={(e) => actions.updateEdge(edge.id, { color: e.target.value })}
            />
          </div>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-[11px] text-zinc-300">
        <input
          type="checkbox"
          checked={!!edge.dashed}
          onChange={(e) => actions.updateEdge(edge.id, { dashed: e.target.checked })}
          className="accent-cyan-400"
        />
        Dashed line
      </label>
      <label className="flex items-center gap-2 text-[11px] text-zinc-300">
        <input
          type="range"
          min={0}
          max={10}
          value={edge.weight ?? 0}
          onChange={(e) => actions.updateEdge(edge.id, { weight: Number(e.target.value) })}
          className="accent-cyan-400"
        />
        Weight ({edge.weight ?? 0})
      </label>
      <Field label="From / To">
        <div className="grid grid-cols-2 gap-1.5">
          <select
            className="input"
            value={edge.from}
            onChange={(e) =>
              actions.updateEdge(edge.id, { from: e.target.value })
            }
          >
            {Object.values(nodesById)
              .filter((n) => n.worldId === edge.worldId)
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title || "—"}
                </option>
              ))}
          </select>
          <select
            className="input"
            value={edge.to}
            onChange={(e) => actions.updateEdge(edge.id, { to: e.target.value })}
          >
            {Object.values(nodesById)
              .filter((n) => n.worldId === edge.worldId)
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title || "—"}
                </option>
              ))}
          </select>
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">{label}</div>
      {children}
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);padding:0.4rem 0.55rem;font-size:0.75rem;color:#e4e4e7;outline:none}.input:focus{border-color:rgba(34,211,238,0.4)}`}</style>
    </div>
  );
}

function IconBtn(props: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      title={props.title}
      onClick={props.onClick}
      className={
        "h-7 w-7 rounded-md border text-[12px] transition " +
        (props.active
          ? "border-cyan-400/40 bg-cyan-400/10"
          : "border-white/10 bg-white/[0.03] hover:bg-white/10")
      }
    >
      {props.children}
    </button>
  );
}

function TagEditor({
  nodeId,
  tags,
  tagsById,
}: {
  nodeId: string;
  tags: string[];
  tagsById: Record<string, { id: string; name: string; color: string }>;
}) {
  const [v, setV] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tid) => {
          const t = tagsById[tid];
          if (!t) return null;
          return (
            <span
              key={tid}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[11px]"
              style={{
                background: t.color + "22",
                borderColor: t.color + "55",
                color: t.color,
              }}
            >
              #{t.name}
              <button
                onClick={() => actions.removeTagFromNode(nodeId, tid)}
                className="ml-1 opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!v.trim()) return;
          actions.addTagToNode(nodeId, v.trim());
          setV("");
        }}
      >
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="Add tag and press Enter"
          className="input"
        />
        <button className="rounded-md border border-white/10 bg-white/[0.04] px-2 text-zinc-200 hover:bg-white/10">
          Add
        </button>
      </form>
    </div>
  );
}

function ChecklistEditor({
  nodeId,
  items,
}: {
  nodeId: string;
  items: { id: string; text: string; done: boolean }[];
}) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-1.5">
      {items.map((c) => (
        <div key={c.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={c.done}
            onChange={(e) => actions.setChecklistItem(nodeId, c.id, { done: e.target.checked })}
            className="accent-cyan-400"
          />
          <input
            value={c.text}
            onChange={(e) => actions.setChecklistItem(nodeId, c.id, { text: e.target.value })}
            className={
              "input text-[11px] " + (c.done ? "line-through opacity-60" : "")
            }
          />
          <button
            onClick={() => actions.removeChecklistItem(nodeId, c.id)}
            className="text-zinc-500 hover:text-rose-300"
          >
            ×
          </button>
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          actions.addChecklistItem(nodeId, text.trim());
          setText("");
        }}
        className="flex gap-1.5"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add checklist item"
          className="input"
        />
        <button className="rounded-md border border-white/10 bg-white/[0.04] px-2 text-zinc-200 hover:bg-white/10">
          Add
        </button>
      </form>
    </div>
  );
}

function PortalPicker({ nodeId, project }: { nodeId: string; project: MMProject }) {
  const candidates = (Object.values(project.nodes) as MMNode[]).filter(
    (n) => n.worldId === project.currentWorldId && n.id !== nodeId,
  );
  return (
    <div className="space-y-1.5">
      <select
        value={project.nodes[nodeId]?.portalTarget ?? ""}
        onChange={(e) => e.target.value && actions.setPortalTo(nodeId, e.target.value)}
        className="input"
      >
        <option value="">Choose target to link as Portal…</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title || "(untitled)"} · {c.id}
          </option>
        ))}
      </select>
    </div>
  );
}

function SnapshotsPicker() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Array<{ id: string; name: string; ts: number; data: string }>>([]);
  useEffect(() => {
    if (open) setList(actions.listSnapshots());
  }, [open]);
  if (!open) {
    return (
      <button
        className="mt-1 w-full rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-amber-200 hover:bg-amber-400/20"
        onClick={() => setOpen(true)}
      >
        ⏮ Restore snapshot
      </button>
    );
  }
  return (
    <div className="mt-1 space-y-1 rounded-lg border border-white/10 bg-white/[0.02] p-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Snapshots ({list.length})</div>
        <button className="text-zinc-500 hover:text-zinc-200" onClick={() => setOpen(false)}>×</button>
      </div>
      {!list.length ? (
        <div className="px-1 py-3 text-center text-[11px] text-zinc-500">No snapshots yet. Take one above.</div>
      ) : (
        <div className="max-h-40 space-y-0.5 overflow-y-auto">
          {list.slice().reverse().map((s) => (
            <div key={s.id} className="flex items-center gap-1 rounded-md px-1 py-1 hover:bg-white/5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] text-zinc-200">{s.name}</div>
                <div className="truncate text-[10px] text-zinc-500">{new Date(s.ts).toLocaleString()}</div>
              </div>
              <button
                className="rounded border border-rose-400/20 bg-rose-400/5 px-1.5 py-0.5 text-[10px] text-rose-200 hover:bg-rose-400/10"
                onClick={() => {
                  if (confirm(`Restore "${s.name}"? Current unsaved state will be pushed to undo stack.`)) {
                    actions.restoreSnapshot(s.id);
                    setOpen(false);
                  }
                }}
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsPanel() {
  const p = useStore((s) => s.project);
  const stats = useMemo(() => projectStats(p), [p]);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px]">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
        Stats
      </div>
      <div className="grid grid-cols-2 gap-y-1.5">
        <span className="text-zinc-400">Nodes</span>
        <span className="text-right font-mono text-zinc-200">{stats.totalNodes}</span>
        <span className="text-zinc-400">Edges</span>
        <span className="text-right font-mono text-zinc-200">{stats.totalEdges}</span>
        <span className="text-zinc-400">Worlds</span>
        <span className="text-right font-mono text-zinc-200">{stats.totalWorlds}</span>
        <span className="text-zinc-400">Words</span>
        <span className="text-right font-mono text-zinc-200">{stats.totalWords}</span>
        <span className="text-zinc-400">Tasks done</span>
        <span className="text-right font-mono text-emerald-300">{stats.completedTasks}</span>
        <span className="text-zinc-400">Tasks open</span>
        <span className="text-right font-mono text-amber-300">{stats.openTasks}</span>
        <span className="text-zinc-400">Tags</span>
        <span className="text-right font-mono text-zinc-200">{stats.tagsUsed}</span>
        <span className="text-zinc-400">Density</span>
        <span className="text-right font-mono text-zinc-200">{stats.density.toFixed(3)}</span>
      </div>
    </div>
  );
}

export { StatsPanel };
