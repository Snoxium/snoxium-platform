const active = new WeakMap<HTMLElement, Animation>();
const clamp = (n: number, limit: number) => Math.max(-limit, Math.min(limit, n));

/** Decorative only: the store and connection endpoints always retain their exact position. */
export function stretchNode(element: HTMLElement, vx: number, vy: number) {
  active.get(element)?.cancel(); active.delete(element);
  const speed = Math.min(1, Math.hypot(vx, vy) / 24);
  element.classList.add("is-dragging");
  element.style.transform = `translate(${-clamp(vx * .13, 3)}px,${-clamp(vy * .13, 3)}px) rotate(${clamp(vx * .045, 1.2)}deg) skew(${clamp(vx * .06, 1.5)}deg,${clamp(vy * .04, 1)}deg) scale(${1 + speed * .012},${1 - speed * .009})`;
}

export function settleNode(element: HTMLElement, immediate = false) {
  active.get(element)?.cancel(); active.delete(element);
  const from = element.style.transform;
  element.style.removeProperty("transform");
  element.classList.remove("is-dragging");
  if (!from || immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const animation = element.animate([
    { transform: from, offset: 0 },
    { transform: "scale(.993,1.009) rotate(-.25deg)", offset: .32 },
    { transform: "scale(1.003,.997) rotate(.1deg)", offset: .64 },
    { transform: "none", offset: 1 },
  ], { duration: 430, easing: "cubic-bezier(.22,.65,.3,1)" });
  active.set(element, animation);
  // Cancel the finished animation so the browser stops caching a transformed text layer.
  void animation.finished.then(() => { if (active.get(element) === animation) { animation.cancel(); active.delete(element); } }).catch(() => {});
}
