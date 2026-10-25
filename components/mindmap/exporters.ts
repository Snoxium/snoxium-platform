"use client";

import type { MMProject, MMNode, MMWorld } from "./types";
import { bezierPoints, nearestAnchor } from "./engine";

export function toPlainText(p: MMProject): string {
  const lines: string[] = [];
  lines.push(`# ${p.name}`);
  lines.push("");
  const walk = (worldId: string, depth: number) => {
    const w = p.worlds[worldId];
    if (!w) return;
    lines.push(`${"#".repeat(Math.min(6, depth + 1))} ${w.emoji ?? "🌐"} ${w.name}`);
    lines.push("");
    const roots = Object.values(p.nodes).filter((n) => n.worldId === worldId);
    for (const n of roots) lines.push(nodeLine(n, 0));
    lines.push("");
    for (const c of Object.values(p.worlds).filter(
      (x) => x.parentWorldId === worldId,
    ))
      walk(c.id, depth + 1);
  };
  walk(p.rootWorldId, 0);
  return lines.join("\n");
}

function nodeLine(n: MMNode, depth: number): string {
  const check = n.status === "done" ? "[x]" : n.status === "todo" ? "[ ]" : "";
  const title = n.title ?? "(untitled)";
  const indent = "  ".repeat(depth);
  const extra = n.subtitle ? ` — ${n.subtitle}` : "";
  return `${indent}- ${check} ${title}${extra}`;
}

export function toMarkdown(p: MMProject): string {
  const out: string[] = [];
  out.push(`# ${p.name}`);
  out.push("");
  out.push(
    `_Generated ${new Date().toLocaleString()}. Worlds: ${
      Object.values(p.worlds).length
    } · Nodes: ${Object.values(p.nodes).length} · Edges: ${
      Object.values(p.edges).length
    }_`,
  );
  out.push("");

  const walk = (wid: string, depth: number) => {
    const w = p.worlds[wid];
    if (!w) return;
    out.push(`${"#".repeat(Math.min(6, depth + 2))} ${w.emoji ?? "🌐"} ${w.name}`);
    out.push("");
    const nodes = Object.values(p.nodes).filter((n) => n.worldId === wid);
    for (const n of nodes) {
      const bar = n.progress != null ? ` ${Math.round(n.progress * 100)}%` : "";
      const status = n.status ? ` · ${n.status}` : "";
      const pri = n.priority ? ` · P${n.priority}` : "";
      out.push(`- **${n.title}**${n.subtitle ? ` — ${n.subtitle}` : ""}${status}${pri}${bar}`);
      if (n.description) out.push(`  - ${n.description}`);
      if (n.checklist?.length) {
        for (const c of n.checklist) {
          out.push(`  - ${c.done ? "[x]" : "[ ]"} ${c.text}`);
        }
      }
      if (n.tags?.length) {
        const tagNames = n.tags
          .map((t) => p.tags[t]?.name)
          .filter(Boolean)
          .map((t) => `#${t}`);
        if (tagNames.length) out.push(`  - ${tagNames.join(" ")}`);
      }
      if (n.notes) {
        out.push("");
        out.push("  > " + n.notes.replace(/\n/g, "\n  > "));
        out.push("");
      }
      if (n.chart?.data.length) {
        out.push("", "  | Label | Value |", "  | --- | ---: |");
        for (const row of n.chart.data) out.push(`  | ${row.label.replace(/\|/g, "\\|").replace(/\n/g, " ")} | ${row.value} |`);
        out.push("");
      }
    }
    out.push("");
    for (const c of Object.values(p.worlds).filter(
      (x) => x.parentWorldId === wid,
    ))
      walk(c.id, depth + 1);
  };
  walk(p.rootWorldId, 0);
  return out.join("\n");
}

export function toCSV(p: MMProject): string {
  const rows = [
    [
      "id",
      "world",
      "title",
      "subtitle",
      "status",
      "priority",
      "progress",
      "dueDate",
      "tags",
      "kind",
      "x",
      "y",
      "w",
      "h",
      "updated",
    ],
  ];
  for (const n of Object.values(p.nodes)) {
    rows.push([
      n.id,
      p.worlds[n.worldId]?.name ?? n.worldId,
      (n.title ?? "").replace(/\s+/g, " "),
      (n.subtitle ?? "").replace(/\s+/g, " "),
      n.status ?? "",
      n.priority != null ? String(n.priority) : "",
      n.progress != null ? String(Math.round(n.progress * 100)) : "",
      n.dueDate ?? "",
      n.tags.map((t) => p.tags[t]?.name ?? t).join("|"),
      n.kind,
      String(n.x),
      String(n.y),
      String(n.w),
      String(n.h),
      new Date(n.updated).toISOString(),
    ]);
  }
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function toOPML(p: MMProject): string {
  const tag = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const outline = (n: MMNode) =>
    `<outline text="${tag(n.title)}" _note="${tag(n.description ?? "")}" _status="${
      n.status ?? ""
    }" _id="${n.id}">` +
    (n.checklist?.length
      ? n.checklist
          .map(
            (c) =>
              `<outline text="${tag(c.text)}" _done="${c.done ? "true" : "false"}"/>`,
          )
          .join("")
      : "") +
    `</outline>`;
  const world = (w: MMWorld): string =>
    `<outline text="${tag(w.name)}" _worldId="${w.id}">` +
    Object.values(p.nodes)
      .filter((n) => n.worldId === w.id)
      .map(outline)
      .join("") +
    Object.values(p.worlds)
      .filter((x) => x.parentWorldId === w.id)
      .map(world)
      .join("") +
    `</outline>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>${tag(p.name)}</title></head>
  <body>${world(p.worlds[p.rootWorldId])}</body>
</opml>`;
}

export function download(name: string, data: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const xml = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&apos;" }[c]!));

export function mapSVG(project: MMProject): { svg: string; width: number; height: number } {
  const nodes = Object.values(project.nodes).filter(n => n.worldId === project.currentWorldId && !n.hidden);
  if (!nodes.length) throw new Error("Add a node before exporting an image.");
  const x = Math.min(...nodes.map(n => n.x)) - 40, y = Math.min(...nodes.map(n => n.y)) - 40;
  const width = Math.ceil(Math.max(...nodes.map(n => n.x + n.w)) - x + 40);
  const height = Math.ceil(Math.max(...nodes.map(n => n.y + n.h)) - y + 40);
  const visible = new Set(nodes.map(n => n.id));
  const edges = Object.values(project.edges).filter(e => e.worldId === project.currentWorldId && visible.has(e.from) && visible.has(e.to)).map(e => {
    const a = project.nodes[e.from], b = project.nodes[e.to];
    const shape = bezierPoints(nearestAnchor(a, { x: b.x + b.w / 2, y: b.y + b.h / 2 }), nearestAnchor(b, { x: a.x + a.w / 2, y: a.y + a.h / 2 }), e.style ?? "bezier");
    return `<path d="${shape.d}" stroke="${xml(e.color ?? "#94a3b8")}" stroke-width="2" fill="none"/>` + (e.label ? `<text x="${shape.mid.x}" y="${shape.mid.y - 10}" fill="#e4e4e7" font-size="12" text-anchor="middle">${xml(e.label)}</text>` : "");
  }).join("");
  const cards = nodes.map(n => {
    const lines = [n.title, ...(n.notes || n.description || n.subtitle || "").split(/\n/), ...(n.checklist ?? []).map(c => `${c.done ? "[x]" : "[ ]"} ${c.text}`)];
    const wrapped: string[] = [], limit = Math.max(10, Math.floor((n.w - 32) / 8));
    for (const line of lines) {
      let row = "";
      for (const word of line.split(/\s+/)) {
        if ((row + " " + word).length > limit && row) { wrapped.push(row); row = ""; }
        row += (row ? " " : "") + word;
      }
      wrapped.push(row);
    }
    return `<g><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="14" fill="#181826" stroke="${xml(n.color?.stroke ?? "#475569")}"/>` + wrapped.slice(0, Math.max(1, Math.floor((n.h - 22) / 21))).map((line, i) => `<text x="${n.x + 16}" y="${n.y + 27 + i * 21}" fill="#e4e4e7" font-size="${i ? 12 : 15}" font-weight="${i ? 400 : 600}">${xml(line)}</text>`).join("") + `</g>`;
  }).join("");
  return { width, height, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" font-family="Arial,sans-serif"><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#090c15"/>${edges}${cards}</svg>` };
}

export async function exportMapImage(project: MMProject, kind: "svg" | "png") {
  const { svg, width, height } = mapSVG(project), name = project.name.replace(/[^a-z0-9-]/gi, "-") || "mindmap";
  if (kind === "svg") { download(`${name}.svg`, svg, "image/svg+xml"); return; }
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Could not render image. Download SVG instead.")); image.src = url; });
    const scale = Math.min(2, 8192 / width, 8192 / height, Math.sqrt(16000000 / (width * height)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(width * scale)); canvas.height = Math.max(1, Math.ceil(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image export is unavailable in this browser.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Image is too large. Download SVG instead.")), "image/png"));
    const png = URL.createObjectURL(blob), link = document.createElement("a"); link.href = png; link.download = `${name}.png`; link.click();
    setTimeout(() => URL.revokeObjectURL(png), 5000);
  } finally { URL.revokeObjectURL(url); }
}
