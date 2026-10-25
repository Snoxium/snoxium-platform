import type { PhrasingContent } from "mdast";
type Inline = PhrasingContent & { children?: Inline[] };
const palette = ["#000000","#0000aa","#00aa00","#00aaaa","#aa0000","#aa00aa","#ffaa00","#aaaaaa","#555555","#5555ff","#55ff55","#55ffff","#ff5555","#ff55ff","#ffff55","#ffffff"];
type Style = { color?: string; bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; obfuscated?: boolean };
const pattern = /((?:&|§)x(?:(?:&|§)[\da-f]){6}|(?:&|§)#[\da-f]{6}|(?:&|§)[\da-fklmnor]|<#[\da-f]{6}>|<gradient(?::#[\da-f]{6}){2,8}>|<\/gradient>)/gi;
function wrap(children: Inline[], style: Style): Inline {
  const css = [style.color && `color:${style.color}`,style.bold && "font-weight:700",style.italic && "font-style:italic", (style.underline || style.strike) && `text-decoration:${[style.underline && "underline",style.strike && "line-through"].filter(Boolean).join(" ")}`].filter(Boolean).join(";");
  return { type: "emphasis", children, data: { hName: "span", hProperties: { style: css, className: style.obfuscated ? ["mm-obfuscated"] : [] } } };
}
/** Optional Minecraft/Birdflop syntax, processed only as text. Code and URLs are untouched. */
export function colorInline(children: Inline[]): Inline[] {
  let style: Style = {};
  const output: Inline[] = [];
  let gradient: { colors: string[]; children: Inline[] } | undefined;
  const emit = (node: Inline) => (gradient?.children ?? output).push(Object.keys(style).length ? wrap([node], style) : node);
  for (const node of children) {
    if (node.type !== "text") { emit(node); continue; }
    for (const part of node.value.split(pattern)) {
      if (!part) continue;
      if (/^<gradient:/i.test(part)) {
        if (gradient) { emit({ type: "text", value: part }); continue; }
        gradient = { colors: part.slice(10, -1).split(":"), children: [] }; continue;
      }
      if (part.toLowerCase() === "</gradient>") {
        if (gradient) {
          output.push({ type: "emphasis", children: gradient.children, data: { hName: "span", hProperties: { className: ["mm-text-gradient"], style: `background-image:linear-gradient(90deg,${gradient.colors.join(",")})` } } });
          gradient = undefined;
        } else emit({ type: "text", value: part });
        continue;
      }
      if (/^(?:&|§|<#)/.test(part) && pattern.test(part)) {
        pattern.lastIndex = 0;
        if (/^<#[\da-f]{6}>$/i.test(part)) style = { color: part.slice(1, -1) };
        else if (/^[&§]x/i.test(part)) style = { color: "#" + part.slice(2).replace(/[&§]/g, "") };
        else if (/^[&§]#/i.test(part)) style = { color: part.slice(1) };
        else {
          const code = part[1].toLowerCase(), index = parseInt(code, 16);
          if (index >= 0 && index <= 15) style = { color: palette[index] };
          else if (code === "r") style = {};
          else style = { ...style, [({ l: "bold", o: "italic", n: "underline", m: "strike", k: "obfuscated" } as Record<string,string>)[code]]: true };
        }
      } else { pattern.lastIndex = 0; emit({ type: "text", value: part }); }
    }
  }
  if (gradient) output.push({ type: "text", value: `<gradient:${gradient.colors.join(":")}>` }, ...gradient.children);
  return output;
}
