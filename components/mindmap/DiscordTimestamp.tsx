"use client";
import { useSyncExternalStore } from "react";
import { formatTimestamp, type TimestampStyle } from "./timestamps";

let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) timer = setInterval(() => { now = Date.now(); for (const update of listeners) update(); }, 1000);
  return () => { listeners.delete(listener); if (!listeners.size) { clearInterval(timer); timer = undefined; } };
}
const snapshot = () => now, serverSnapshot = () => 0;
const noSubscribe = () => () => {};
export function DiscordTimestamp({ seconds, format = "f" }: { seconds: number; format?: TimestampStyle }) {
  const tick = useSyncExternalStore(format === "R" ? subscribe : noSubscribe, snapshot, serverSnapshot);
  const date = new Date(seconds * 1000);
  if (!Number.isFinite(date.getTime())) return <>{`<t:${seconds}:${format}>`}</>;
  return <time className="mm-timestamp" dateTime={date.toISOString()} title={tick ? date.toLocaleString() : date.toISOString()}>{tick ? formatTimestamp(seconds, format, tick) : `<t:${seconds}:${format}>`}</time>;
}
