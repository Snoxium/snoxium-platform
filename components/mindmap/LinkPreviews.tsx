"use client";

import { memo, useEffect, useRef, useState } from "react";
import { actions, getState } from "./store";
import { extractLinks } from "./discordMarkdown";
import type { LinkPreview, MMNode } from "./types";

export const LinkPreviews = memo(function LinkPreviews({ node, editor = false }: { node: MMNode; editor?: boolean }) {
  const links = extractLinks(node.notes ?? node.description ?? node.subtitle ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<{ url: string; message: string } | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), [node.id]);
  const save = (url: string, value: LinkPreview) => {
    const current = getState().project.nodes[node.id];
    if (current && !current.editLocked) actions.updateNode(node.id, { linkPreviews: { ...current.linkPreviews, [url]: value } });
  };
  const refresh = async (url: string) => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(url); setError(null);
    try {
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`, { signal: controller.signal, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't load this preview.");
      if (!controller.signal.aborted) save(url, { ...data, hidden: false });
    } catch (error) {
      if (!controller.signal.aborted) setError({ url, message: error instanceof Error ? error.message : "Couldn't load this preview." });
    } finally { if (!controller.signal.aborted) setLoading(null); }
  };
  if (!links.length || (node.kind === "code" && !editor)) return null;
  return <div className={`mm-link-previews${editor ? " is-editor" : ""}`} aria-label="Link embeds">
    {links.map(url => {
      const preview = node.linkPreviews?.[url];
      const visible = preview && !preview.hidden;
      const hostname = new URL(url).hostname;
      return <div className="mm-link-preview" key={url}>
        {visible && !editor && <a className="mm-embed-card" href={url} target="_blank" rel="noopener noreferrer">
          {preview.image && <EmbedImage key={preview.image} src={preview.image} />}
          <small>{preview.siteName || hostname}</small><strong>{preview.title || hostname}</strong>{preview.description && <span>{preview.description}</span>}
        </a>}
        <div className="mm-embed-controls">
          {editor && <a href={url} target="_blank" rel="noopener noreferrer" title={url}>{hostname}</a>}
          {!node.editLocked && <>
            {visible ? <><button onClick={() => save(url, { ...preview, hidden: true })}>Hide embed</button><button disabled={loading !== null} onClick={() => refresh(url)}>{loading === url ? "Updating…" : "Refresh embed"}</button></> : <button disabled={loading !== null} onClick={() => preview ? save(url, { ...preview, hidden: false }) : refresh(url)}>{loading === url ? "Loading…" : `Show embed${links.length > 1 || editor ? ` · ${hostname}` : ""}`}</button>}
          </>}
        </div>
        {editor && visible && <details><summary>Edit embed</summary><label>Embed title<input aria-label="Embed title" value={preview.title} onChange={e => save(url, { ...preview, title: e.target.value })} /></label><label>Embed description<textarea aria-label="Embed description" rows={3} value={preview.description} onChange={e => save(url, { ...preview, description: e.target.value })} /></label><small>Refresh replaces these details with the website’s latest preview.</small></details>}
        {error?.url === url && <span className="mm-embed-error" role="status">{error.message} <button onClick={() => refresh(url)}>Retry</button></span>}
        {editor && visible && <small>Updated {new Date(preview.updatedAt).toLocaleString()}</small>}
      </div>;
    })}
  </div>;
}, (a, b) => a.editor === b.editor && a.node.id === b.node.id && a.node.notes === b.node.notes &&
  a.node.description === b.node.description && a.node.subtitle === b.node.subtitle && a.node.kind === b.node.kind &&
  a.node.editLocked === b.node.editLocked && a.node.linkPreviews === b.node.linkPreviews);

function EmbedImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  // Remote preview images are optional and should never break the card.
  // eslint-disable-next-line @next/next/no-img-element
  return failed ? null : <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
