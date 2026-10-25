/** Keep background alpha separate from foreground text and connection handles. */
export function backgroundColor(fill = "#181826") {
  const hex = fill.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
  if (!hex) return { color: "#181826", opacity: 100 };
  const expanded = hex.length <= 4 ? [...hex].map(c => c + c).join("") : hex;
  return { color: "#" + expanded.slice(0, 6), opacity: expanded.length === 8 ? Math.round(parseInt(expanded.slice(6), 16) / 255 * 100) : 100 };
}

export function withBackgroundOpacity(color: string, percent: number) {
  return backgroundColor(color).color + Math.round(Math.max(0, Math.min(100, percent)) / 100 * 255).toString(16).padStart(2, "0");
}
