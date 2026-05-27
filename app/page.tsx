import Link from "next/link";
import { FeatureCard } from "@/components/site/FeatureCard";
import { GAMES } from "@/lib/games";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 sm:px-10 md:px-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-cyan-400/10 to-indigo-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_62%)]" />
        </div>
        <div className="relative grid gap-10 lg:grid-cols-[1.25fr,0.75fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-medium tracking-widest text-zinc-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.65)]" />
              CONNECTED ECOSYSTEM
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-zinc-50 sm:text-6xl md:text-7xl">
              Snoxium
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-200/75 sm:text-xl">
              Connected worlds, games, and experiences.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/games"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Explore Games
              </Link>
              <Link
                href="/network"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
              >
                Enter Stardew Network
              </Link>
            </div>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)] opacity-70" />
            <div className="relative space-y-5">
              <div className="text-xs font-medium tracking-widest text-zinc-200/60">
                LIVE SIGNAL
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-zinc-50">
                  Unified Identity
                </div>
                <p className="text-sm leading-6 text-zinc-200/70">
                  One account. One profile. A persistent reputation that follows
                  you across Snoxium worlds.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs tracking-widest text-zinc-200/60">
                    SYSTEMS
                  </div>
                  <div className="mt-2 font-semibold text-zinc-50">
                    Progression
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs tracking-widest text-zinc-200/60">
                    NETWORK
                  </div>
                  <div className="mt-2 font-semibold text-zinc-50">Economy</div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-200/70">
                Built for connected serverse, multiplayer experiences, and shared
                systems that evolve over time.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 space-y-8 md:mt-24">
        <div className="grid gap-4 md:grid-cols-[1fr,1.15fr] md:items-end">
          <div className="space-y-3">
            <div className="text-xs font-medium tracking-widest text-cyan-200/70">
              ECOSYSTEM OVERVIEW
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              A platform, not a single game
            </h2>
          </div>
          <p className="text-sm leading-7 text-zinc-200/70 sm:text-base">
            Snoxium is an umbrella ecosystem where each world plugs into shared
            infrastructure—accounts, progression, economies, and identity—so
            your time in one experience carries forward into the next.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Unified Platform",
              body: "Common systems power every world so features don’t feel disconnected or temporary.",
            },
            {
              title: "Progression That Transfers",
              body: "Unlocks, milestones, and reputation can be recognized across worlds and server clusters.",
            },
            {
              title: "Accounts and Identity",
              body: "A single profile underpins stats, permissions, cosmetics, and cross-game identity.",
            },
            {
              title: "Multiplayer Experiences",
              body: "Co-op, economy, and social systems are designed for live communities, not isolated sessions.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-fuchsia-400/20"
            >
              <div className="text-lg font-semibold text-zinc-50">
                {item.title}
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-200/70">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 space-y-8 md:mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-medium tracking-widest text-fuchsia-200/70">
              FEATURED EXPERIENCES
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Worlds inside Snoxium
            </h2>
          </div>
          <Link
            href="/games"
            className="text-sm font-medium text-zinc-200/70 transition hover:text-zinc-50"
          >
            View all games →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {GAMES.map((game) => (
            <FeatureCard
              key={game.slug}
              title={game.name}
              eyebrow={game.status}
              description={game.description}
              href={`/games/${game.slug}`}
              meta={`/games/${game.slug}`}
            />
          ))}
        </div>
      </section>

      <section className="mt-16 md:mt-24">
        <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:grid-cols-[1.1fr,0.9fr] md:p-12">
          <div className="space-y-4">
            <div className="text-xs font-medium tracking-widest text-cyan-200/70">
              NETWORK
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Stardew Network
            </h2>
            <p className="text-sm leading-7 text-zinc-200/70 sm:text-base">
              The connected backbone for multiplayer worlds—Minecraft ecosystem,
              generators, progression, economy, and linked servers built to feel
              like one living universe.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/network"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Open Network
              </Link>
              <Link
                href="/games/stardew"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-fuchsia-400/30 hover:bg-white/[0.06]"
              >
                View Stardew World
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Minecraft Ecosystem", body: "Connected servers and worlds." },
              { title: "Generators", body: "Progression loops and upgrades." },
              { title: "Progression", body: "Milestones that persist." },
              { title: "Economy", body: "Shared markets and balances." },
              { title: "Identity", body: "Profiles across servers." },
              { title: "Live Events", body: "Seasonal and community moments." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/30 p-5"
              >
                <div className="text-sm font-semibold text-zinc-50">
                  {item.title}
                </div>
                <div className="mt-1 text-xs leading-5 text-zinc-200/65">
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
