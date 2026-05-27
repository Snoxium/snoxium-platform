import Link from "next/link";

export default function NetworkPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-start">
        <div className="space-y-6">
          <div className="text-xs font-medium tracking-widest text-cyan-200/70">
            NETWORK
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            Stardew Network
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-200/70 sm:text-base">
            The connective tissue for Snoxium multiplayer. Linked servers, a
            shared economy, and progression systems that feel coherent across a
            Minecraft ecosystem.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/games/stardew"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Open Stardew World
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
            >
              Explore Games
            </Link>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="text-xs font-medium tracking-widest text-zinc-200/60">
            BUILT-IN SYSTEMS
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Generators", body: "Upgrade loops and automation." },
              { title: "Progression", body: "Milestones that persist." },
              { title: "Economy", body: "Markets, balances, and trading." },
              { title: "Connected Servers", body: "One network, many worlds." },
              { title: "Identity", body: "Accounts and reputation." },
              { title: "Events", body: "Seasonal and community moments." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/30 p-5"
              >
                <div className="text-sm font-semibold text-zinc-50">
                  {item.title}
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-200/65">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Minecraft Ecosystem",
            body: "Multiple servers connected as one experience, built around shared systems and a persistent profile.",
          },
          {
            title: "Progression and Economy",
            body: "Generators, upgrades, and markets built to scale without losing balance or identity between worlds.",
          },
          {
            title: "Connected Communities",
            body: "Multiplayer-first design: parties, social loops, and persistent status that carries forward.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="text-lg font-semibold text-zinc-50">
              {card.title}
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-200/70">
              {card.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

