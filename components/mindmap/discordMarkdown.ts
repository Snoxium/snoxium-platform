import type { Root, RootContent, PhrasingContent, Text } from "mdast";
import { colorInline } from "./textColors";

/** Discord's >>> quote continues to the end; never reinterpret fenced code. */
export function prepareDiscordMarkdown(source: string): string {
  let fence = "", quoting = false;
  return source.split("\n").map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (!fence && !quoting && /^>>>\s?/.test(line)) quoting = true;
    const result = quoting ? `> ${line.replace(/^>>>\s?/, "")}` : !fence && /^-# /.test(line) ? `\n${line}\n` : line;
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = "";
    }
    return result;
  }).join("\n");
}

type Inline = PhrasingContent & { children?: Inline[]; data?: { hName?: string; hProperties?: Record<string, unknown> } };
const textNode = (value: string): Text => ({ type: "text", value });

/** Safe AST extensions: HTML stays disabled and code is never processed. */
export function remarkDiscord(options: { textColors?: boolean } = {}) {
  return (tree: Root, file: { value: unknown }) => {
    const source = String(file.value);
    function inline(children: Inline[]): Inline[] {
      const tokens: Inline[] = [];
      const escaped = new WeakSet<Inline>();
      for (let node of children) {
        if (node.type === "link" && /^gradient:(?:#[\da-f]{6}:){1,7}#[\da-f]{6}$/i.test(node.url) && source[node.position?.start.offset ?? -1] === "<") node = { type: "text", value: `<${node.url}>`, position: node.position };
        if (node.type === "strong" && source.slice(node.position?.start.offset, (node.position?.start.offset ?? 0) + 2) === "__") {
          node.data = { hName: "u" };
        }
        if (node.children && node.type !== "link" && node.type !== "linkReference") node.children = inline(node.children);
        // Discord timestamps and mentions are plain, safe tokens, never raw HTML.
        if (node.type === "html" && (/^<(?:t:-?\d+(?::[tTdDfFR])?|@!?\d+|@&\d+|#\d+)>$/.test(node.value) || node.value === "</gradient>")) node = { ...node, type: "text" };
        if (node.type !== "text") { tokens.push(node); continue; }
        // Respect escaped spoiler delimiters using source offsets.
        const raw = source.slice(node.position?.start.offset, node.position?.end.offset);
        const parts = node.value.split(/(\|\||\n|<t:-?\d{1,13}(?::[tTdDfFR])?>)/g);
        // Map CommonMark backslash escapes to the decoded text, so an escaped
        // delimiter doesn't disable other spoilers or timestamps in the same line.
        let decoded = ""; const escapedOffsets = new Set<number>();
        for (let i = 0; i < raw.length; i++) {
          if (raw[i] === "\\" && /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(raw[i + 1] ?? "")) { escapedOffsets.add(decoded.length); decoded += raw[++i]; }
          else decoded += raw[i];
        }
        let offset = 0;
        for (const part of parts) {
          if (part === "\n") tokens.push({ type: "break" });
          else if (/^<t:/.test(part)) {
            const match = part.match(/^<t:(-?\d+)(?::([tTdDfFR]))?>$/)!;
            tokens.push({ type: "emphasis", children: [textNode(part)], data: { hName: "time", hProperties: { "data-seconds": match[1], "data-format": match[2] ?? "f" } } });
          } else if (part) {
            const value = textNode(part);
            if (decoded === node.value && (escapedOffsets.has(offset) || escapedOffsets.has(offset + 1))) escaped.add(value);
            tokens.push(value);
          }
          offset += part.length;
        }
      }
      const result: Inline[] = [];
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === "text" && token.value === "||" && !escaped.has(token)) {
          const end = tokens.findIndex((n, j) => j > i && n.type === "text" && n.value === "||" && !escaped.has(n));
          if (end > i + 1) {
            result.push({ type: "emphasis", children: tokens.slice(i + 1, end), data: { hName: "span", hProperties: { "data-spoiler": "true" } } });
            i = end; continue;
          }
        }
        result.push(token);
      }
      return options.textColors ? colorInline(result) : result;
    }
    function visit(node: Root | RootContent) {
      if (node.type === "paragraph" || node.type === "heading" || node.type === "tableCell") {
        if (node.type === "paragraph" && source.slice(node.position?.start.offset, (node.position?.start.offset ?? 0) + 3) === "-# ") {
          const first = node.children[0];
          if (first?.type === "text") first.value = first.value.replace(/^-# /, "");
          node.data = { hName: "div", hProperties: { className: ["mm-subtext"] } };
        }
        node.children = inline(node.children as Inline[]);
      } else if ("children" in node) for (const child of node.children) visit(child as RootContent);
    }
    visit(tree);
  };
}

/** HTTP(S) links become preview candidates; code stays out. */
export function extractLinks(text: string): string[] {
  const withoutCode = text.replace(/(`{3,}|~{3,})[^\n]*\n[\s\S]*?\1/g, "").replace(/`[^`]*`/g, "");
  const found: string[] = [];
  for (const match of withoutCode.matchAll(/https?:\/\/[^\s<>"`|]+/gi)) {
    let value = match[0].replace(/[.,!?;:]+$/, "");
    while (value.endsWith(")") && (value.match(/\)/g)?.length ?? 0) > (value.match(/\(/g)?.length ?? 0)) value = value.slice(0, -1);
    value = value.replace(/\]+$/, "");
    try {
      const url = new URL(value);
      if (!url.username && !url.password && !found.includes(url.href)) found.push(url.href);
    } catch { /* Not a usable URL. */ }
  }
  return found.slice(0, 8);
}
