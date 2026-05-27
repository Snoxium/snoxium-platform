import { FeatureCard } from "@/components/site/FeatureCard";
import { GAMES } from "@/lib/games";

export default function GamesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
      <div className="space-y-4">
        <div className="text-xs font-medium tracking-widest text-cyan-200/70">
          GAMES
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          Worlds under Snoxium
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-zinc-200/70 sm:text-base">
          Each game lives inside the same ecosystem—shared identity, progression,
          and systems designed to make Snoxium feel connected instead of
          fragmented.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {GAMES.map((game) => (
          <FeatureCard
            key={game.slug}
            title={game.name}
            eyebrow={game.status}
            description={game.description}
            href={`/games/${game.slug}`}
            meta={game.tagline}
          />
        ))}
      </div>
    </div>
  );
}

