import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GAMES, getGameBySlug } from "@/lib/games";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return [...GAMES.map(game => ({ slug: game.slug })), { slug: "trash-tycoon" }]; }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = getGameBySlug((await params).slug);
  return game ? { title: game.name, description: game.description, alternates: { canonical: `/games/${game.slug}` } } : {};
}
export default async function GamePage({ params }: Props) {
  const game = getGameBySlug((await params).slug);
  if (!game) notFound();
  return <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
    <Link href="/games" className="text-sm text-cyan-200 hover:underline">← All games</Link>
    <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-6">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-200/80">{game.platform} · {game.status}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{game.name}</h1>
        <p className="text-xl text-zinc-200">{game.tagline}</p>
        <p className="max-w-2xl text-base leading-8 text-zinc-300">{game.description}</p>
        {game.playUrl ? <div className="flex flex-wrap gap-3">
          <a href={game.playUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-200">{game.playLabel} ↗</a>
          {game.appStoreUrl && <a href={game.appStoreUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-200">View on App Store ↗</a>}
        </div> : <p className="text-sm text-zinc-400">Follow Snoxium for future project updates.</p>}
        {game.status === "Beta" && <p className="text-sm text-amber-200/80">This game is in beta. Features and balance may change.</p>}
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
        <h2 className="text-lg font-semibold">Inside the game</h2>
        <ul className="mt-6 space-y-5">{game.features.map(feature => <li className="flex gap-3 text-sm leading-6 text-zinc-300" key={feature}><span className="text-cyan-300">↗</span>{feature}</li>)}</ul>
      </section>
    </div>
    <section className="mt-16 border-t border-white/10 pt-8"><h2 className="text-xl font-semibold">More from Snoxium</h2><div className="mt-5 flex flex-wrap gap-3">{GAMES.filter(g => g.slug !== game.slug).slice(0, 4).map(g => <Link key={g.slug} href={`/games/${g.slug}`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:border-cyan-300/50">{g.name} →</Link>)}</div></section>
  </div>;
}
