import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-5">
          <div className="text-xs font-medium tracking-widest text-cyan-200/70">
            ABOUT
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            Snoxium Platform
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-200/70 sm:text-base">
            Snoxium is an ecosystem built to connect worlds, games and
            communities. It’s not a single title—it’s an identity layer and a
            set of shared systems that make every experience feel like it belongs
            to the same universe.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/games"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Explore Games
            </Link>
            <Link
              href="/network"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
            >
              View Network
            </Link>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="text-xs font-medium tracking-widest text-zinc-200/60">
            DESIGN PRINCIPLES
          </div>
          <ul className="space-y-3 text-sm leading-6 text-zinc-200/70">
            <li>
              Premium, futuristic presentation built for a connected gaming-tech
              ecosystem.
            </li>
            <li>
              Shared progression, identity, and economy—built once, experienced
              everywhere.
            </li>
            <li>
              Multiplayer-first systems that scale with communities and
              server networks.
            </li>
            <li>
              Worlds that feel distinct, but never disconnected from the
              platform.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

