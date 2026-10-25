"use client";

import { useEffect, useRef, useState } from "react";
import { actions, beginUndoGroup, endUndoGroup, useStore } from "./store";
import { uid } from "./engine";
import { MarkdownContent } from "./NodeContent";
import { LinkPreviews } from "./LinkPreviews";
import { backgroundColor, withBackgroundOpacity } from "./nodeAppearance";
import type { MMNode, NodeKind, NodeStatus } from "./types";

export function NodeEditor({ node }: { node: MMNode }) {
  const worlds = useStore(s => s.project.worlds);
  const [preview, setPreview] = useState(false);
  const [gradientStart, setGradientStart] = useState("#22d3ee");
  const [gradientEnd, setGradientEnd] = useState("#c084fc");
  const undo = useRef<number | null>(null);
  const notesInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => () => { if (undo.current != null) endUndoGroup(undo.current); }, []);
  const patch = (value: Partial<MMNode>) => actions.updateNode(node.id, value);
  const notes = node.notes ?? node.description ?? "";
  const destination = node.linkedWorldId ?? node.childWorldId;
  const chart = node.chart ?? { type: "bar" as const, data: [] };
  const background = backgroundColor(node.color?.fill);
  const color = (key: "stroke" | "fill" | "text", fallback: string) => /^#[0-9a-f]{6}$/i.test(node.color?.[key] ?? "") ? node.color![key]! : fallback;
  const changeKind = (kind: NodeKind) => {
    if (kind === "world") { if (!destination) actions.convertToWorld(node.id); else patch({ kind }); return; }
    patch({ kind, h: Math.max(node.h, kind === "chart" ? 260 : kind === "document" || kind === "checklist" ? 200 : 130),
      ...(kind === "chart" && !node.chart ? { chart: { type: "bar", data: [{ id: uid(), label: "Item A", value: 30 }, { id: uid(), label: "Item B", value: 60 }] } } : {}) });
  };
  const format = (before: string, after = "", sample = "text") => {
    const input = notesInput.current;
    const start = input?.selectionStart ?? notes.length, end = input?.selectionEnd ?? start;
    const text = notes.slice(start, end) || sample;
    const value = notes.slice(0, start) + before + text + after + notes.slice(end);
    patch({ notes: value, description: value });
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + before.length, start + before.length + text.length); });
  };
  const fitContent = () => {
    const card = document.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(node.id)}"]`);
    const body = card?.querySelector<HTMLElement>(".mm-node-body");
    if (!card || !body) return;
    const extra = Array.from(card.children).filter(e => e !== body && !e.matches(".mm-port,.mm-resize")).reduce((sum, e) => sum + (e as HTMLElement).offsetHeight + 8, 0);
    const contentHeight = Array.from(body.children).reduce((sum, e) => {
      const style = getComputedStyle(e);
      const element = e as HTMLElement;
      return sum + Math.max(element.offsetHeight, element.scrollHeight) + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
    }, 0);
    patch({ h: Math.max(130, Math.min(3000, contentHeight + extra + 56)) });
  };
  return <div className="mm-editor" onFocusCapture={e => {
    if ((e.target as HTMLElement).matches('textarea,input:not([type="checkbox"]):not([type="color"])') && undo.current == null) undo.current = beginUndoGroup();
  }} onBlurCapture={() => {
    if (undo.current != null) endUndoGroup(undo.current);
    undo.current = null;
  }}>
    <label>Title<input aria-label="Node title" value={node.title} disabled={node.editLocked} onChange={e => patch({ title: e.target.value })} /></label>
    <fieldset disabled={node.editLocked}>
      <label>Node type<select aria-label="Node type" value={node.kind} onChange={e => changeKind(e.target.value as NodeKind)}>
        <option value="text">Note</option><option value="document">Markdown document / table</option><option value="checklist">To-do list</option><option value="chart">Chart</option><option value="code">Code block</option><option value="world">World doorway</option>
        {!["text", "document", "checklist", "chart", "code", "world"].includes(node.kind) && <option value={node.kind}>{node.kind} (existing content)</option>}
      </select></label>
      <section className="mm-editor-section">
        <div className="mm-panel-heading"><h3>Content</h3><button aria-pressed={preview} onClick={() => setPreview(v => !v)}>{preview ? "Edit Markdown" : "Preview Markdown"}</button></div>
        {!preview && node.kind !== "code" && <div className="mm-format-tools" aria-label="Markdown formatting"><button title="Bold" onClick={() => format("**", "**")}>B</button><button title="Italic" onClick={() => format("*", "*")}>I</button><button title="Heading" onClick={() => format("\n## ")}>H</button><button title="List" onClick={() => format("\n- ")}>List</button><button title="Link" onClick={() => format("[", "](https://example.com)", "link")}>Link</button><button title="Code" onClick={() => format("`", "`")}>Code</button></div>}
        {preview ? <div className="mm-preview"><MarkdownContent text={notes || "*Nothing written yet.*"} textColors={node.textColors} /></div> : <label>{node.kind === "code" ? "Code" : "Notes (Markdown)"}<textarea ref={notesInput} aria-label="Node notes" rows={6} placeholder="**Bold**, *italic*, # heading, - list, [link](https://…)" value={notes} onChange={e => patch({ notes: e.target.value, description: e.target.value })} /></label>}
        <details className="mm-help"><summary>Discord Markdown formatting help</summary><p>Use **bold**, *italic*, ***both***, __underline__, ~~strike~~ and ||spoilers||. Combine them: __***all three***__. Start lines with #, ## or ### for headings, -# for small subtext, &gt; for quotes, or &gt;&gt;&gt; for a quote continuing to the end. Lists, nested lists, tasks, `code`, fenced code blocks, masked links and tables work too. Escape formatting with a backslash. Pasted web links are clickable.</p></details>
        <LinkPreviews key={node.id} node={{ ...node }} editor />
        <label className="mm-check"><input type="checkbox" checked={!!node.textColors} onChange={e => patch({ textColors: e.target.checked })} />Enable Minecraft text colors</label>
        {node.textColors && <div className="mm-text-color-tools"><p className="mm-muted">Use &amp;0–&amp;f, &amp;#RRGGBB, &amp;x&amp;R&amp;R&amp;G&amp;G&amp;B&amp;B or § codes. Birdflop’s per-letter hex gradients and MiniMessage &lt;gradient:#22d3ee:#c084fc&gt;text&lt;/gradient&gt; work. &amp;l bold, &amp;o italic, &amp;n underline, &amp;m strike, &amp;k obfuscate, &amp;r reset. Code stays literal.</p><div className="mm-color-grid"><label>Gradient start<input aria-label="Gradient start" type="color" value={gradientStart} onChange={e => setGradientStart(e.target.value)} /></label><label>Gradient end<input aria-label="Gradient end" type="color" value={gradientEnd} onChange={e => setGradientEnd(e.target.value)} /></label></div><button disabled={preview} onClick={() => format(`<gradient:${gradientStart}:${gradientEnd}>`, "</gradient>", "Gradient text")}>Apply gradient to selection</button></div>}
        <p className="mm-muted">Discord timestamps: &lt;t:UNIX&gt; or &lt;t:UNIX:t/T/d/D/f/F/R&gt;. Dates use your local time; R updates automatically.</p>
        {node.kind === "checklist" && <div className="mm-task-editor">
          <p className="mm-muted">{node.checklist?.filter(i => i.done).length ?? 0} / {node.checklist?.length ?? 0} complete</p>
          {node.checklist?.map(item => <div className="mm-task-row" key={item.id}><input aria-label={`Complete ${item.text}`} type="checkbox" checked={item.done} onChange={e => actions.setChecklistItem(node.id, item.id, { done: e.target.checked })} /><input aria-label="Checklist item" value={item.text} onChange={e => actions.setChecklistItem(node.id, item.id, { text: e.target.value })} /><button onClick={() => actions.removeChecklistItem(node.id, item.id)} aria-label={`Remove ${item.text}`}>×</button></div>)}
          <button onClick={() => actions.addChecklistItem(node.id, "New task")}>+ Add task</button>
        </div>}
        {node.kind === "chart" && <div className="mm-chart-editor">
          <label>Chart style<select aria-label="Chart style" value={chart.type} onChange={e => patch({ chart: { ...chart, type: e.target.value as typeof chart.type } })}><option value="bar">Bar</option><option value="line">Line</option><option value="pie">Pie / doughnut</option></select></label>
          <p className="mm-muted">Label and value for each data point. Pie charts use positive values.</p>
          {chart.data.map(row => <div className="mm-chart-row" key={row.id}><input aria-label="Chart label" value={row.label} onChange={e => patch({ chart: { ...chart, data: chart.data.map(r => r.id === row.id ? { ...r, label: e.target.value } : r) } })} /><input aria-label="Chart value" type="number" value={row.value} onChange={e => patch({ chart: { ...chart, data: chart.data.map(r => r.id === row.id ? { ...r, value: Number(e.target.value) || 0 } : r) } })} /><button aria-label={`Remove data ${row.label}`} onClick={() => patch({ chart: { ...chart, data: chart.data.filter(r => r.id !== row.id) } })}>×</button></div>)}
          <button onClick={() => patch({ chart: { ...chart, data: [...chart.data, { id: uid(), label: "New item", value: 0 }] } })}>+ Add data point</button>
        </div>}
      </section>
      <details className="mm-editor-section" open><summary>Appearance</summary>
        <div className="mm-color-grid">{([['fill','Background','#181826'],['stroke','Border','#475569'],['text','Text','#e4e4e7']] as const).map(([key,label,fallback]) => <label key={key}>{label}<input aria-label={`Node ${label.toLowerCase()} color`} type="color" value={key === 'fill' ? background.color : color(key, fallback)} onChange={e => patch({ color: { ...node.color, [key]: key === 'fill' ? withBackgroundOpacity(e.target.value, background.opacity) : e.target.value } })} /></label>)}</div>
        <label>Background opacity · {background.opacity}%<input aria-label="Background opacity" type="range" min="0" max="100" step="1" value={background.opacity} onChange={e => patch({ color: { ...node.color, fill: withBackgroundOpacity(background.color, Number(e.target.value)) } })} /></label>
        <label className="mm-check"><input type="checkbox" checked={node.glass !== false} onChange={e => patch({ glass: e.target.checked })} />Glass finish</label>
        <p className="mm-muted">Lower opacity to see through the background. Text stays clear.</p>
        <div className="mm-swatches" aria-label="Color presets">{['#22d3ee','#a78bfa','#f472b6','#fb7185','#fbbf24','#34d399'].map(c => <button key={c} aria-label={`Use ${c} colors`} style={{ background: c }} onClick={() => patch({ color: { fill: withBackgroundOpacity(c, background.opacity), stroke: c, text: '#f4f4f5' } })} />)}<button onClick={() => patch({ color: undefined, glass: undefined })}>Reset</button></div>
        <div className="mm-field-grid"><label>Shape<select value={node.shape ?? "card"} onChange={e => patch({ shape: e.target.value as MMNode['shape'] })}><option value="card">Rounded card</option><option value="pill">Pill</option><option value="document">Square card</option></select></label><label>Text size<input aria-label="Node font size" type="number" min="10" max="48" value={node.font?.size ?? 14} onChange={e => patch({ font: { ...node.font, size: Math.max(10, Math.min(48, Number(e.target.value) || 14)) } })} /></label></div>
        <div className="mm-field-grid"><label>Width<input aria-label="Node width" type="number" min="100" max="3000" value={node.w} onChange={e => patch({ w: Math.max(100, Math.min(3000, Number(e.target.value) || 100)) })} /></label><label>Height<input aria-label="Node height" type="number" min="80" max="3000" value={node.h} onChange={e => patch({ h: Math.max(80, Math.min(3000, Number(e.target.value) || 80)) })} /></label></div>
        <button onClick={fitContent}>Fit content</button>
      </details>
      <section className="mm-editor-section"><h3>World link</h3><label>Open an existing world<select aria-label="Linked world" value={destination ?? ""} onChange={e => actions.linkNodeToWorld(node.id, e.target.value || undefined)}><option value="">No world linked</option>{Object.values(worlds).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
        {destination ? <button onClick={() => actions.enterWorld(destination)}>Open world →</button> : <button onClick={() => actions.convertToWorld(node.id)}>Create a new world</button>}
        <p className="mm-muted">Link any node to a world, including one whose doorway you deleted. Removing a link keeps that world and its contents.</p>
      </section>
      <details className="mm-editor-section"><summary>Task details</summary><label>Status<select value={node.status ?? "none"} onChange={e => patch({ status: e.target.value as NodeStatus })}>{['none','todo','in-progress','done','blocked'].map(s => <option key={s} value={s}>{s}</option>)}</select></label><label>Due date<input type="date" value={node.dueDate ?? ""} onChange={e => patch({ dueDate: e.target.value })} /></label></details>
    </fieldset>
    <label className="mm-check"><input type="checkbox" checked={!!node.locked} onChange={() => actions.toggleNode(node.id, "locked")} />Lock position</label>
    <label className="mm-check"><input type="checkbox" checked={!!node.editLocked} onChange={() => actions.toggleNode(node.id, "editLocked")} />Lock editing</label>
    <div className="mm-node-actions"><button onClick={() => actions.duplicateNodes([node.id])}>Duplicate node</button><button className="mm-danger" onClick={() => actions.deleteNodes([node.id])}>Delete node</button></div>
  </div>;
}
