export type TimestampStyle = "t" | "T" | "d" | "D" | "f" | "F" | "R";
export function formatTimestamp(seconds: number, style: TimestampStyle = "f", now = Date.now(), locale?: string): string {
  const date = new Date(seconds * 1000);
  if (!Number.isFinite(date.getTime())) return `<t:${seconds}:${style}>`;
  if (style === "R") {
    const delta = (seconds * 1000 - now) / 1000;
    const magnitude = Math.abs(delta);
    const [unit, divisor]: [Intl.RelativeTimeFormatUnit, number] = magnitude < 60 ? ["second", 1] : magnitude < 3600 ? ["minute", 60] : magnitude < 86400 ? ["hour", 3600] : magnitude < 2592000 ? ["day", 86400] : magnitude < 31536000 ? ["month", 2592000] : ["year", 31536000];
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(Math.round(delta / divisor), unit);
  }
  const options: Record<Exclude<TimestampStyle, "R">, Intl.DateTimeFormatOptions> = {
    t: { hour: "numeric", minute: "2-digit" }, T: { hour: "numeric", minute: "2-digit", second: "2-digit" },
    d: { year: "numeric", month: "2-digit", day: "2-digit" }, D: { year: "numeric", month: "long", day: "numeric" },
    f: { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" },
    F: { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" },
  };
  return new Intl.DateTimeFormat(locale, options[style] ?? options.f).format(date);
}
