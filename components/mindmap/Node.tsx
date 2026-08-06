"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { MMNode, MMTag, ChecklistItem } from "./types";
import { actions, useStore } from "./store";
import { uid } from "./engine";

interface Props {
  node: MMNode;
  selected: boolean;
  hovered: boolean;
  tagsById: Record<string, MMTag>;
}

function kindIcon(kind: MMNode["kind"]): string {
  switch (kind) {
    case "checklist":
      return "☑";
    case "kanban":
      return "🗂";
    case "spreadsheet":
      return "📊";
    case "calendar":
      return "📅";
    case "whiteboard":
      return "🎨";
    case "code":
      return "⟨/⟩";
    case "bookmarks":
      return "🔖";
    case "gallery":
      return "🖼";
    case "database":
      return "🗄";
    case "timer":
      return "⏱";
    case "calculator":
      return "🧮";
    case "document":
      return "📄";
    case "world":
      return "🌐";
    default:
      return "💡";
  }
}

const statusDot: Record<NonNullable<MMNode["status"]>, string> = {
  none: "#64748b",
  todo: "#fbbf24",
  "in-progress": "#22d3ee",
  done: "#34d399",
  blocked: "#fb7185",
};

export const NodeView = memo(function NodeView({
  node,
  selected,
  hovered,
  tagsById,
}: Props) {
  const editing = useStore((s) =>
    s.ui.selectedNodeIds.length === 1 &&
    s.ui.selectedNodeIds[0] === node.id,
  );
  const [draft, setDraft] = useState(node.title);
  const editingRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setDraft(node.title);
  }, [node.id, node.title]);

  const fill =
    node.color?.fill ??
    (node.kind === "world"
      ? "#a78bfa18"
      : node.kind === "checklist"
        ? "#f472b618"
        : node.status === "done"
          ? "#34d39914"
          : "rgba(255,255,255,0.04)");
  const stroke =
    node.color?.stroke ??
    (selected
      ? "#22d3ee"
      : hovered
        ? "rgba(255,255,255,0.22)"
        : "rgba(255,255,255,0.1)");
  const text = node.color?.text ?? "#e4e4e7";
  const opacity = node.opacity ?? 1;

  const save = () => {
    if (draft !== node.title) actions.updateNode(node.id, { title: draft });
  };

  const shapeRadius = (() => {
    switch (node.shape) {
      case "pill":
        return 999;
      case "diamond":
        return 18;
      case "hex":
        return 18;
      case "circle":
        return 9999;
      case "document":
        return 6;
      case "card":
      default:
        return 20;
    }
  })();

  const tagList = (node.tags ?? [])
    .map((id) => tagsById[id])
    .filter(Boolean) as MMTag[];

  return (
    <div
      className={`absolute will-change-transform select-none ${
        node.locked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        opacity,
        zIndex: selected ? 10 : hovered ? 8 : 2,
      }}
      data-node-id={node.id}
    >
      <div
        className="absolute inset-0 overflow-hidden border shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-[2px] transition-[box-shadow,border-color] duration-150"
        style={{
          background: node.color?.gradient
            ? `linear-gradient(135deg, ${node.color.gradient[0]}, ${node.color.gradient[1]})`
            : fill,
          borderColor: stroke,
          borderRadius: shapeRadius,
          boxShadow: selected
            ? `0 0 0 2px ${stroke}33, 0 20px 60px -20px rgba(34,211,238,0.25)`
            : undefined,
        }}
      />

      {node.pinned && (
        <div className="absolute -top-2 left-3 text-xs text-amber-300">📌</div>
      )}
      {node.favourite && (
        <div className="absolute -top-2 right-3 text-xs text-amber-300">⭐</div>
      )}

      <div className="relative flex h-full flex-col gap-1.5 p-4">
        <div className="flex items-start gap-2">
          <div
            className="flex h-8 w-8 flex-none items-center justify-center rounded-xl text-base"
            style={{
              background:
                (node.color?.stroke ?? "#22d3ee") + "22",
              border: `1px solid ${(node.color?.stroke ?? "#fff") + "22"}`,
              color: node.color?.text,
            }}
            title={node.kind}
          >
            <span>{node.icon ?? kindIcon(node.kind)}</span>
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <textarea
                ref={editingRef}
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setDraft(node.title);
                    e.currentTarget.blur();
                  } else if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    save();
                    e.currentTarget.blur();
                  }
                }}
                className="w-full resize-none bg-transparent text-[15px] font-semibold leading-snug outline-none"
                style={{ color: text }}
                rows={Math.max(1, Math.min(4, draft.split("\n").length))}
              />
            ) : (
              <div
                className="truncate text-[15px] font-semibold leading-snug"
                style={{ color: text }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setDraft(node.title);
                  editingRef.current?.focus();
                }}
              >
                {node.title || <span className="text-zinc-500">Untitled</span>}
              </div>
            )}
            {node.subtitle && (
              <div
                className="mt-1 line-clamp-2 text-xs leading-relaxed"
                style={{ color: (node.color?.text ?? "#a1a1aa") + "cc" }}
              >
                {node.subtitle}
              </div>
            )}
          </div>

          <div className="flex flex-none items-center gap-1">
            {node.status && node.status !== "none" && (
              <span
                title={node.status}
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: statusDot[node.status] }}
              />
            )}
            {node.locked && <span className="text-xs text-zinc-400">🔒</span>}
            {node.editLocked && <span className="text-xs text-zinc-400">✏️🔒</span>}
            {node.linkedToId && <span className="text-xs text-cyan-300">🔗</span>}
            {node.isPortal && <span className="text-xs text-fuchsia-300">🌀</span>}
          </div>
        </div>

        {node.description && (
          <div
            className="line-clamp-3 text-xs leading-relaxed"
            style={{ color: (node.color?.text ?? "#a1a1aa") + "cc" }}
          >
            {node.description}
          </div>
        )}

        {node.kind === "checklist" && node.checklist && node.checklist.length ? (
          <ChecklistView nodeId={node.id} items={node.checklist} textColor={text} />
        ) : null}

        {node.progress != null && (
          <div className="mt-auto">
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-400">
              <span>Progress</span>
              <span>{Math.round(node.progress * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(node.progress * 100)}%`,
                  background: node.color?.stroke ?? "#22d3ee",
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {tagList.slice(0, 4).map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] font-medium"
                style={{
                  background: t.color + "22",
                  borderColor: t.color + "55",
                  color: t.color,
                }}
              >
                #{t.name}
              </span>
            ))}
            {tagList.length > 4 && (
              <span className="text-[10px] text-zinc-500">
                +{tagList.length - 4}
              </span>
            )}
          </div>
          {node.dueDate && (
            <span className="text-[10px] font-medium text-zinc-400">
              📅 {node.dueDate}
            </span>
          )}
        </div>
      </div>

      {(selected || hovered) && (
        <>
          <div
            className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border border-white/50"
            style={{ background: stroke }}
            data-port="top"
            title="Link from top"
          />
          <div
            className="absolute right-0 top-1/2 h-3 w-3 translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border border-white/50"
            style={{ background: stroke }}
            data-port="right"
            title="Drag to connect"
          />
          <div
            className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-crosshair rounded-full border border-white/50"
            style={{ background: stroke }}
            data-port="bottom"
          />
          <div
            className="absolute left-0 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border border-white/50"
            style={{ background: stroke }}
            data-port="left"
          />
        </>
      )}

      {selected && !node.locked && (
        <div
          className="absolute -bottom-1 -right-1 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-cyan-300 bg-black"
          title="Drag to resize"
          data-resize="se"
        />
      )}

      {node.isWorld && (
        <button
          className="absolute bottom-2 right-2 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-200 backdrop-blur hover:bg-black/60"
          onClick={(e) => {
            e.stopPropagation();
            if (node.childWorldId) actions.enterWorld(node.childWorldId);
          }}
          title="Enter this world (double-click node also works)"
        >
          Enter ↗
        </button>
      )}
      {node.isPortal && node.portalTarget && (
        <button
          className="absolute bottom-2 right-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-fuchsia-200 backdrop-blur hover:bg-fuchsia-500/20"
          onClick={(e) => {
            e.stopPropagation();
            actions.jumpToNode(node.portalTarget!);
          }}
        >
          Portal →
        </button>
      )}
    </div>
  );
});

function ChecklistView({
  nodeId,
  items,
  textColor,
}: {
  nodeId: string;
  items: ChecklistItem[];
  textColor: string;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-1">
      {items.slice(0, 4).map((c) => (
        <label
          key={c.id}
          className="flex items-center gap-2 text-xs"
          style={{ color: textColor + "dd" }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={c.done}
            onChange={(e) =>
              actions.setChecklistItem(nodeId, c.id, { done: e.target.checked })
            }
            className="h-3.5 w-3.5 rounded border-white/15 bg-white/5 accent-cyan-400"
          />
          <span className={c.done ? "line-through opacity-60" : ""}>{c.text}</span>
        </label>
      ))}
      {items.length > 4 && (
        <div className="text-[10px] text-zinc-500">
          +{items.length - 4} more (use inspector)
        </div>
      )}
      {adding ? (
        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) actions.addChecklistItem(nodeId, text.trim());
            setText("");
            setAdding(false);
          }}
          className="flex items-center gap-1"
        >
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              if (text.trim()) actions.addChecklistItem(nodeId, text.trim());
              setAdding(false);
              setText("");
            }}
            placeholder="+ Add item"
            className="flex-1 rounded border border-white/10 bg-black/30 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-cyan-300/40"
          />
        </form>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAdding(true);
          }}
          className="mt-0.5 self-start text-[11px] text-zinc-500 hover:text-cyan-300"
        >
          + Add item
        </button>
      )}
    </div>
  );
}
