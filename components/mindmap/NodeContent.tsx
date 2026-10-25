"use client";

import { memo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MMNode } from "./types";
import { prepareDiscordMarkdown, remarkDiscord } from "./discordMarkdown";
import { DiscordTimestamp } from "./DiscordTimestamp";
import type { TimestampStyle } from "./timestamps";

const plugins = [remarkGfm, remarkDiscord];
const colorPlugins = [remarkGfm, [remarkDiscord, { textColors: true }] as [typeof remarkDiscord, { textColors: boolean }]];
function Spoiler({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return <span className={`mm-spoiler${revealed ? " is-revealed" : ""}`}><button aria-label={revealed ? "Hide spoiler" : "Reveal spoiler"} aria-pressed={revealed} onClick={() => setRevealed(v => !v)}>{revealed ? "Hide" : "Spoiler"}</button><span aria-hidden={!revealed}>{children}</span></span>;
}
export const MarkdownContent = memo(function MarkdownContent({ text, textColors = false }: { text: string; textColors?: boolean }) {
  return <div className="mm-markdown"><Markdown remarkPlugins={textColors ? colorPlugins : plugins} skipHtml components={{
    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
    span: ({ children, node, style, className }) => (node?.properties?.["data-spoiler"] ?? node?.properties?.dataSpoiler) === "true" ? <Spoiler>{children}</Spoiler> : <span style={style} className={className}>{children}</span>,
    time: ({ children, node }) => node?.properties?.["data-seconds"] != null ? <DiscordTimestamp seconds={Number(node.properties["data-seconds"])} format={String(node.properties["data-format"] ?? "f") as TimestampStyle} /> : <time>{children}</time>,
  }}>{prepareDiscordMarkdown(text)}</Markdown></div>;
});

const palette = ["#22d3ee", "#c084fc", "#fb7185", "#fbbf24", "#34d399", "#60a5fa"];
export function ChartContent({ chart }: { chart: NonNullable<MMNode["chart"]> }) {
  const rows = chart.data.slice(0, 30);
  if (!rows.length) return <span className="mm-muted">Add data in the node editor.</span>;
  const max = Math.max(1, ...rows.map(r => Math.abs(r.value)));
  if (chart.type === "pie") {
    const total = rows.reduce((sum, r) => sum + Math.max(0, r.value), 0);
    return <div className="mm-chart"><svg viewBox="0 0 200 120" role="img" aria-label="Pie chart"><circle cx="100" cy="60" r="43" fill="none" stroke="#475569" strokeWidth="24" />{rows.map((r, i) => {
      const fraction = total ? Math.max(0, r.value) / total : 0;
      const start = total ? rows.slice(0, i).reduce((sum, row) => sum + Math.max(0, row.value), 0) / total * 100 : 0;
      return <circle key={r.id} cx="100" cy="60" r="43" fill="none" stroke={palette[i % palette.length]} strokeWidth="24" pathLength="100" strokeDasharray={`${fraction * 100} ${100 - fraction * 100}`} strokeDashoffset={-start} transform="rotate(-90 100 60)"><title>{r.label}: {r.value}</title></circle>;
    })}</svg><div className="mm-chart-legend">{rows.map((r, i) => <span key={r.id}><i style={{ background: palette[i % palette.length] }} />{r.label}: {r.value}</span>)}</div></div>;
  }
  if (chart.type === "line") return <div className="mm-chart"><svg viewBox="0 0 260 130" role="img" aria-label="Line chart"><path d="M15 10 V110 H245" stroke="#64748b" fill="none" /><polyline points={rows.map((r, i) => `${20 + i * 220 / Math.max(1, rows.length - 1)},${60 - r.value / max * 45}`).join(" ")} fill="none" stroke="#22d3ee" strokeWidth="3" />{rows.map((r, i) => <circle key={r.id} cx={20 + i * 220 / Math.max(1, rows.length - 1)} cy={60 - r.value / max * 45} r="4" fill="#22d3ee"><title>{r.label}: {r.value}</title></circle>)}</svg><div className="mm-chart-legend">{rows.map(r => <span key={r.id}>{r.label}: {r.value}</span>)}</div></div>;
  return <div className="mm-chart-bars">{rows.map((r, i) => <div key={r.id}><span>{r.label || "Untitled"}</span><div><i style={{ width: `${Math.abs(r.value) / max * 100}%`, background: palette[i % palette.length] }} /></div><b>{r.value}</b></div>)}</div>;
}
