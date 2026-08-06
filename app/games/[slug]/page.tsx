import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/games";

export default function GamePage({
  params,
}: {
  params: { slug: string };
}) {
  const game = getGameBySlug(params.slug);

  if (!game) {
    notFound();
  }

  const isStardew = game.slug === "stardew";
  const isRunalong = game.slug === "runalong";

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <div className="text-xs font-medium tracking-widest text-zinc-200/60">
            /games/{game.slug}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            {game.name}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-200/70 sm:text-base">
            {game.description}
          </p>
        </div>

        {isStardew ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs font-medium tracking-widest text-cyan-200/70">
                STARDEW NEXUS
              </div>
              <div className="mt-3 text-lg font-semibold text-zinc-50">
                Core Network Server
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-200/70">
                The main hub for progression, social loops, and the connected
                ecosystem layer—where identity and economy feel persistent.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs font-medium tracking-widest text-fuchsia-200/70">
                STARDEW GENS
              </div>
              <div className="mt-3 text-lg font-semibold text-zinc-50">
                Generator Progression
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-200/70">
                The grind-and-upgrade layer—generators, scaling progression, and
                economy systems tuned for long-term leaderboard competition.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs font-medium tracking-widest text-cyan-200/70">
              STATUS
            </div>
            <div className="mt-3 text-lg font-semibold text-zinc-50">
              {game.status}
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-200/70">
              Shipping inside the Snoxium ecosystem with shared systems and a
              persistent identity layer.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs font-medium tracking-widest text-fuchsia-200/70">
              HIGHLIGHT
            </div>
            <div className="mt-3 text-lg font-semibold text-zinc-50">
              {game.highlight}
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-200/70">
              Designed to feel premium, systemic, and connected—never a
              throwaway minigame.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-xs font-medium tracking-widest text-zinc-200/60">
              ECOSYSTEM
            </div>
            <ul className="mt-4 space-y-2 text-sm text-zinc-200/70">
              <li>Unified account + cross-game identity</li>
              <li>Progression that can transfer between worlds</li>
              <li>Shared economy and multiplayer foundation</li>
            </ul>
          </div>
        </div>

        {isRunalong ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-xs font-medium tracking-widest text-cyan-200/70">
              DOWNLOAD
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
              Runalong on mobile
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-200/70 sm:text-base">
              A 3‑lane voxel runner built for speed, reflex, and leaderboard
              climbs. Dodge obstacles, collect coins, and unlock special items
              and characters.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://play.google.com/store/apps/details?id=net.snygames.runalong"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Android (Google Play)
              </a>
              <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-100 opacity-80">
                iOS (Coming soon)
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/games"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
          >
            Back to Games
          </Link>
          <Link
            href="/network"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
          >
            {isStardew ? "Enter Stardew Network" : "Explore the Network"}
          </Link>
        </div>
      </div>
    </div>
  );
}
