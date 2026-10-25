import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";

const blocked = new BlockList();
for (const [network, prefix] of [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.0.2.0",24],["192.168.0.0",16],["198.18.0.0",15],["198.51.100.0",24],["203.0.113.0",24],["224.0.0.0",3]] as const) blocked.addSubnet(network, prefix);
export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) return !blocked.check(address);
  // Accept global-unicast IPv6 only; mapped IPv4, local and special-use ranges stay out.
  return isIP(address) === 6 && /^[23]/i.test(address) && !/^2001:(?:0*:|0?db8:|0?10:|0?20:)/i.test(address) && !/^2002:/i.test(address);
}
export function webURL(value: string): URL {
  const url = new URL(value);
  if (value.length > 2048 || !["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port || !url.hostname.includes(".") || /(?:^|\.)(?:localhost|local|internal|home|test|invalid)$/.test(url.hostname)) throw new Error("Use a public HTTP or HTTPS link.");
  return url;
}
async function publicHost(url: URL, signal: AbortSignal) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = await Promise.race([
    lookup(host, { all: true }),
    new Promise<never>((_, reject) => { signal.addEventListener("abort", () => reject(new Error("Preview timed out.")), { once: true }); }),
  ]);
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new Error("This address cannot be previewed.");
  return addresses[0];
}
async function readPage(url: URL, signal: AbortSignal): Promise<{ html?: string; redirect?: string }> {
  const address = await publicHost(url, signal);
  return new Promise((resolve, reject) => {
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;
    // Pin the checked IP through connect; DNS cannot change between validation and request.
    const req = send(url, { signal, family: address.family, lookup: (_host, _options, callback) => callback(null, address.address, address.family), headers: { "User-Agent": "Snoxium-LinkPreview/1.0", Accept: "text/html,application/xhtml+xml", "Accept-Encoding": "identity" } }, res => {
      if ([301,302,303,307,308].includes(res.statusCode ?? 0)) {
        const redirect = res.headers.location; res.destroy();
        if (!redirect) reject(new Error("Website redirected without a destination.")); else resolve({ redirect });
        return;
      }
      if ((res.statusCode ?? 500) >= 400 || !/text\/html|application\/xhtml\+xml/i.test(res.headers["content-type"] ?? "")) { res.destroy(); reject(new Error("This website does not provide a page preview.")); return; }
      let size = 0; const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 512 * 1024) { res.destroy(); reject(new Error("Page is too large to preview.")); }
        else chunks.push(chunk);
      });
      res.on("end", () => resolve({ html: Buffer.concat(chunks).toString("utf8") }));
      res.on("error", reject);
    });
    req.on("error", reject); req.end();
  });
}
const decode = (value: string) => value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
  const names: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
  if (names[entity.toLowerCase()]) return names[entity.toLowerCase()];
  const num = entity[2].toLowerCase() === "x" ? parseInt(entity.slice(3), 16) : parseInt(entity.slice(2), 10);
  return num > 0 && num <= 0x10ffff ? String.fromCodePoint(num) : "";
}).replace(/\s+/g, " ").trim();
export function parseMetadata(html: string, url: URL) {
  const values: Record<string, string> = Object.create(null);
  for (const tag of html.match(/<meta\b[^>]{0,8192}>/gi) ?? []) {
    const attrs: Record<string, string> = Object.create(null);
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4]);
    const key = attrs.property ?? attrs.name;
    if (key && attrs.content && !values[key.toLowerCase()]) values[key.toLowerCase()] = attrs.content;
  }
  let image: string | undefined;
  const imageValue = values["og:image"] ?? values["twitter:image"];
  try { if (imageValue) image = webURL(new URL(imageValue, url).href).href; } catch { /* Optional. */ }
  return {
    title: (values["og:title"] || values["twitter:title"] || decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || url.hostname).slice(0, 300),
    description: (values["og:description"] || values["twitter:description"] || values.description || "").slice(0, 1000),
    siteName: (values["og:site_name"] || url.hostname).slice(0, 100), image,
  };
}
export async function fetchLinkPreview(value: string) {
  let url = webURL(value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    for (let i = 0; i < 4; i++) {
      const page = await readPage(url, controller.signal);
      if (page.redirect) { url = webURL(new URL(page.redirect, url).href); continue; }
      const metadata = parseMetadata(page.html ?? "", url);
      if (metadata.image) { try { await publicHost(webURL(metadata.image), controller.signal); } catch { metadata.image = undefined; } }
      return { ...metadata, updatedAt: Date.now() };
    }
    throw new Error("This link has too many redirects.");
  } finally { clearTimeout(timeout); }
}
