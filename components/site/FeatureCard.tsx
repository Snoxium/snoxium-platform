import Link from "next/link";

export function FeatureCard({
  title,
  description,
  href,
  eyebrow,
  meta,
}: {
  title: string;
  description: string;
  href: string;
  eyebrow?: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.05]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-20 right-[-5rem] h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
      </div>
      <div className="relative flex flex-1 flex-col gap-3">
        {eyebrow ? (
          <div className="text-xs font-medium tracking-widest text-cyan-200/80">
            {eyebrow}
          </div>
        ) : null}
        <div className="text-xl font-semibold tracking-tight text-zinc-50">
          {title}
        </div>
        <p className="text-sm leading-6 text-zinc-200/75">{description}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-sm text-zinc-200/70">
          <span className="font-medium text-zinc-100/90">Open</span>
          <span className="text-xs tracking-wide text-zinc-300/60">
            {meta ?? "Snoxium Experience"}
          </span>
        </div>
      </div>
    </Link>
  );
}

