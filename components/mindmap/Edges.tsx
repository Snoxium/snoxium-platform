"use client";

import { memo } from "react";
import type { MMEdge, MMNode } from "./types";
import { bezierPoints, nearestAnchor } from "./engine";
import { actions } from "./store";

interface Props {
  edges: MMEdge[];
  nodesById: Record<string, MMNode>;
  worldId: string;
  hoveredId?: string;
  selectedIds: string[];
  tempEdge?: { from: string; toX: number; toY: number };
  width: number;
  height: number;
}

export const EdgesLayer = memo(function EdgesLayer({
  edges,
  nodesById,
  worldId,
  hoveredId,
  selectedIds,
  tempEdge,
  width,
  height,
}: Props) {
  const defsId = `mm-marker-${worldId}`;
  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      style={{ width, height, overflow: "visible" }}
    >
      <defs>
        <marker
          id={defsId + "-arrow"}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
        </marker>
        <marker
          id={defsId + "-arrow-active"}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3ee" />
        </marker>
      </defs>

      <g style={{ overflow: "visible" }}>
        {edges.map((e) => {
          const a = nodesById[e.from];
          const b = nodesById[e.to];
          if (!a || !b) return null;
          const fromP = nearestAnchor(a, { x: b.x + b.w / 2, y: b.y + b.h / 2 });
          const toP = nearestAnchor(b, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
          const { d, mid } = bezierPoints(fromP, toP, e.style ?? "bezier");
          const active = selectedIds.includes(e.id) || hoveredId === e.id;
          const color = e.color ?? (active ? "#22d3ee" : "#64748b");
          const marker =
            e.direction === "none"
              ? undefined
              : `url(#${defsId + "-arrow"}${active ? "-active" : ""})`;
          const markerEnd =
            e.direction === "forward" || e.direction === "both" ? marker : undefined;
          const markerStart =
            e.direction === "back" || e.direction === "both" ? marker : undefined;
          return (
            <g key={e.id} className="pointer-events-auto">
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                style={{ cursor: "pointer" }}
                onPointerDown={(ev) => {
                  ev.stopPropagation();
                  actions.selectEdge(e.id, ev.shiftKey);
                }}
              />
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={active ? (e.thickness ?? 2) + 1 : e.thickness ?? 2}
                strokeDasharray={e.dashed ? "6 6" : undefined}
                opacity={active ? 1 : 0.75}
                markerEnd={markerEnd}
                markerStart={markerStart}
              />
              {e.label && (
                <text
                  x={mid.x}
                  y={mid.y - 6}
                  fontSize="11"
                  textAnchor="middle"
                  fill="#cbd5e1"
                  className="pointer-events-none select-none"
                  style={{ paintOrder: "stroke", stroke: "#0b0b12", strokeWidth: 3 }}
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {tempEdge &&
          (() => {
            const a = nodesById[tempEdge.from];
            if (!a) return null;
            const fromP = nearestAnchor(a, { x: tempEdge.toX, y: tempEdge.toY });
            const { d } = bezierPoints(fromP, { x: tempEdge.toX, y: tempEdge.toY }, "bezier");
            return (
              <path
                d={d}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={2}
                strokeDasharray="6 4"
                opacity={0.85}
              />
            );
          })()}
      </g>
    </svg>
  );
});
