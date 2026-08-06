"use client";

import type { MMProject, MMNode, MMWorld } from "./types";

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

export async function exportPNG(svgElement: SVGSVGElement, nodesRoot: HTMLElement, project: MMProject, worldId: string, scale = 2) {
  const nodes = Object.values(project.nodes).filter((n) => n.worldId === worldId);
  if (!nodes.length) return;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const n of nodes) {
    x1 = Math.min(x1, n.x);
    y1 = Math.min(y1, n.y);
    x2 = Math.max(x2, n.x + n.w);
    y2 = Math.max(y2, n.y + n.h);
  }
  const pad = 40;
  x1 -= pad; y1 -= pad; x2 += pad; y2 += pad;
  const w = Math.ceil((x2 - x1) * scale);
  const h = Math.ceil((y2 - y1) * scale);

  const doctype =
    '<?xml version="1.0" encoding="UTF-8"?>';
  const svgData = serializeSVG(svgElement, nodesRoot, x1, y1, x2 - x1, y2 - y1);
  const svgBlob = new Blob([doctype + svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = (e) => rej(e);
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#05050a";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  const png = await new Promise<string>((res) =>
    canvas.toBlob((b) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(b!);
    }, "image/png"),
  );
  const a = document.createElement("a");
  a.href = png;
  a.download = `${project.name.replace(/\s+/g, "-")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function serializeSVG(svgEl: SVGSVGElement, nodesRoot: HTMLElement, x: number, y: number, w: number, h: number): string {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  clone.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
  const foreign = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
  foreign.setAttribute("x", String(x));
  foreign.setAttribute("y", String(y));
  foreign.setAttribute("width", String(w));
  foreign.setAttribute("height", String(h));
  const div = document.createElement("div");
  div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  const wrap = document.createElement("div");
  wrap.setAttribute(
    "style",
    "transform-origin:0 0; position:absolute; inset:0;",
  );
  wrap.innerHTML = nodesRoot.outerHTML;
  div.appendChild(wrap);
  foreign.appendChild(div);
  clone.appendChild(foreign);
  const serializer = new XMLSerializer();
  return serializer.serializeToString(clone);
}

export function exportSVG(svgEl: SVGSVGElement, nodesRoot: HTMLElement, project: MMProject, worldId: string) {
  const nodes = Object.values(project.nodes).filter((n) => n.worldId === worldId);
  if (!nodes.length) return;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const n of nodes) {
    x1 = Math.min(x1, n.x);
    y1 = Math.min(y1, n.y);
    x2 = Math.max(x2, n.x + n.w);
    y2 = Math.max(y2, n.y + n.h);
  }
  const pad = 40;
  x1 -= pad; y1 -= pad; x2 += pad; y2 += pad;
  const data = serializeSVG(svgEl, nodesRoot, x1, y1, x2 - x1, y2 - y1);
  download(`${project.name.replace(/\s+/g, "-")}.svg`, data, "image/svg+xml");
}
