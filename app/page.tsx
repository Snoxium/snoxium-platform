import Link from "next/link";
import { FeatureCard } from "@/components/site/FeatureCard";
import { FEATURED_GAMES } from "@/lib/games";

export default function Home() {
  return <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-7 py-16 sm:px-12 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.14),transparent_60%)]" />
      <div className="relative max-w-3xl space-y-7">
        <p className="text-xs font-medium tracking-[0.25em] text-cyan-200">INDEPENDENT GAMES & TOOLS</p>
        <h1 className="text-6xl font-semibold tracking-tight sm:text-7xl">Snoxium</h1>
        <p className="text-2xl leading-relaxed text-zinc-100 sm:text-3xl">Small ideas. Worlds to get lost in.</p>
        <p className="max-w-2xl text-base leading-8 text-zinc-300">From voxel runs and sword fights to cleaning up a neighbourhood. We build games with something to discover, something to collect, and a reason to come back.</p>
        <div className="flex flex-wrap gap-3"><Link href="/games" className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-6 py-3 text-sm font-semibold text-slate-950">Explore the games →</Link><Link href="/minecraft/plugins" className="rounded-full border border-white/15 px-6 py-3 text-sm text-zinc-200 hover:bg-white/5">Minecraft plugins</Link></div>
      </div>
    </section>
    <section className="mt-16 space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs tracking-widest text-fuchsia-200">EXPLORE OUR PROJECTS</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Find your next adventure</h2></div><Link href="/games" className="text-sm text-cyan-200">All games →</Link></div>
      <div className="grid gap-5 md:grid-cols-2">{FEATURED_GAMES.map(game => <FeatureCard key={game.slug} title={game.name} eyebrow={`${game.platform} · ${game.status}`} description={game.description} href={`/games/${game.slug}`} meta={game.tagline} />)}</div>
    </section>
    <section className="mt-16 grid gap-5 md:grid-cols-3">
      <FeatureCard title="Plants vs Food" eyebrow="FORTNITE · IN DEVELOPMENT" description="Plant placement, food battles, and progression. Follow our UEFN project as it takes shape." href="/games/plants-vs-food" meta="See the project →" />
      <FeatureCard title="Stardew Network" eyebrow="MINECRAFT" description="The Minecraft side of Snoxium: Nexus, Gens, server communities, and progression systems." href="/network" meta="Explore the network →" />
      <FeatureCard title="Mindmap" eyebrow="A TOOL FOR YOUR IDEAS" description="A simple space to connect ideas and organise projects into worlds. No account required; your map stays in your browser." href="/app/mindmap" meta="Open your canvas →" />
    </section>
  </div>;
}
