type Pose = { x: number; y: number; angle: number; skew: number; sx: number; sy: number };
type Spring = { pose: Pose; velocity: Pose; target: Pose; frame: number; last: number; lastInput: number; held: boolean };
const active = new WeakMap<HTMLElement, Spring>();
const zero = (): Pose => ({ x: 0, y: 0, angle: 0, skew: 0, sx: 0, sy: 0 });
const axes = Object.keys(zero()) as Array<keyof Pose>;
const clamp = (n: number, limit: number) => Math.max(-limit, Math.min(limit, n));

function clear(element: HTMLElement, spring: Spring) {
  cancelAnimationFrame(spring.frame);
  element.style.removeProperty("transform");
  element.classList.remove("is-dragging");
  active.delete(element);
}

function wake(element: HTMLElement, spring: Spring) {
  if (spring.frame) return;
  spring.last = performance.now();
  const tick = (now: number) => {
    // Small integration steps keep the spring stable across slow frames and tab pauses.
    const elapsed = Math.min(32, Math.max(0, now - spring.last)) / 1000;
    spring.last = now;
    if (spring.held && now - spring.lastInput > 80) spring.target = { ...zero(), sx: .02, sy: .02 };
    const steps = Math.max(1, Math.ceil(elapsed * 120)), dt = elapsed / steps;
    let moving = false;
    for (let step = 0; step < steps; step++) {
      for (const axis of axes) {
        const distance = spring.target[axis] - spring.pose[axis];
        spring.velocity[axis] += (distance * 290 - spring.velocity[axis] * (spring.held ? 20 : 15)) * dt;
        spring.pose[axis] += spring.velocity[axis] * dt;
      }
    }
    for (const axis of axes) {
      const tolerance = axis === "sx" || axis === "sy" ? .00015 : .003;
      if (Math.abs(spring.target[axis] - spring.pose[axis]) > tolerance || Math.abs(spring.velocity[axis]) > tolerance * 12) moving = true;
    }
    const p = spring.pose;
    element.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.angle}deg) skew(${p.skew}deg) scale(${1 + p.sx},${1 + p.sy})`;
    spring.frame = 0;
    if (moving) spring.frame = requestAnimationFrame(tick);
    else if (!spring.held) clear(element, spring);
  };
  spring.frame = requestAnimationFrame(tick);
}

/** Decorative spring only: saved positions and connection endpoints stay exact. */
export function stretchNode(element: HTMLElement, vx: number, vy: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { settleNode(element, true); return; }
  let spring = active.get(element);
  if (!spring) {
    spring = { pose: zero(), velocity: zero(), target: zero(), frame: 0, last: 0, lastInput: 0, held: true };
    active.set(element, spring);
  }
  const speed = Math.min(1, Math.hypot(vx, vy) / 24);
  const horizontal = Math.abs(vx) / (Math.hypot(vx, vy) || 1);
  spring.held = true;
  spring.lastInput = performance.now();
  spring.target = {
    x: -clamp(vx * .22, 4), y: -clamp(vy * .22, 4),
    angle: clamp(vx * .075, 2.4), skew: clamp((vx - vy * .35) * .08, 2.2),
    sx: .02 + speed * (.05 * horizontal - .025 * (1 - horizontal)),
    sy: .02 + speed * (.05 * (1 - horizontal) - .025 * horizontal),
  };
  element.classList.add("is-dragging");
  wake(element, spring);
}

export function settleNode(element: HTMLElement, immediate = false) {
  const spring = active.get(element);
  if (!spring) return;
  if (immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { clear(element, spring); return; }
  spring.held = false;
  spring.target = zero();
  element.classList.remove("is-dragging");
  wake(element, spring);
}
