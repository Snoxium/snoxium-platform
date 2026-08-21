import type { Metadata } from "next";
import Link from "next/link";
import { FEATURED_PLUGIN, PLUGINS } from "@/lib/plugins";

export const metadata: Metadata = {
  title: "Minecraft Plugins",
  description:
    "Lightweight, GUI-first Minecraft plugins built by Snoxium. Starting with SnxTeams — the clean teams & clans plugin for SMP and Survival servers on BuiltByBit.",
  openGraph: {
    title: "Minecraft Plugins · Snoxium",
    description:
      "SnxTeams and more Minecraft plugins from Snoxium. Clean GUIs, focused features, zero bloat.",
    type: "website",
    url: "https://www.snoxium.com/minecraft/plugins",
  },
  alternates: {
    canonical: "/minecraft/plugins",
  },
};

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? "text-amber-300" : "text-zinc-600"}>
          ★
        </span>
      ))}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-200/80">
      {children}
    </span>
  );
}

function PluginCard({
  plugin,
  featured = false,
}: {
  plugin: typeof FEATURED_PLUGIN;
  featured?: boolean;
}) {
  const isComing = plugin.status === "COMING SOON";
  return (
    <article
      className={
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white/[0.03] transition hover:-translate-y-0.5 " +
        (featured
          ? "border-cyan-400/20 hover:border-cyan-400/40"
          : "border-white/10 hover:border-white/20")
      }
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute -bottom-24 right-[-4rem] h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
      </div>

      <div className="relative flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wider " +
                  (plugin.status === "LIVE"
                    ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/25"
                    : plugin.status === "BETA"
                      ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/25"
                      : "bg-fuchsia-400/15 text-fuchsia-200 ring-1 ring-fuchsia-400/25")
                }
              >
                {plugin.status}
              </span>
              {featured ? (
                <span className="inline-flex items-center rounded-full bg-cyan-400/15 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-cyan-200 ring-1 ring-cyan-400/25">
                  FEATURED
                </span>
              ) : null}
              <span className="text-[11px] font-medium tracking-wide text-zinc-400">
                {plugin.version}
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              {plugin.name}
            </h2>
            <p className="text-sm text-zinc-300/70">{plugin.tagline}</p>
          </div>

          <div className="text-right">
            <div className="text-lg font-semibold tracking-tight text-zinc-50">
              {plugin.price ?? "—"}
            </div>
            {plugin.rating > 0 ? (
              <div className="mt-1 flex items-center justify-end gap-2 text-xs text-zinc-400">
                <Stars rating={plugin.rating} />
                <span>({plugin.reviews})</span>
              </div>
            ) : (
              <div className="mt-1 text-[11px] text-zinc-500">Not yet rated</div>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-300/75">
          {plugin.description}
        </p>

        {featured ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {plugin.features.slice(0, 3).map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="text-lg">{f.icon}</div>
                <div className="mt-1 text-sm font-semibold text-zinc-100">
                  {f.title}
                </div>
                <div className="mt-0.5 text-[11px] leading-5 text-zinc-400">
                  {f.description}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-1.5">
          {plugin.category.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
          {plugin.gamemodes.slice(0, 3).map((g) => (
            <Chip key={g}>{g}</Chip>
          ))}
          <Chip>{plugin.platforms[0]}+</Chip>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>📦 {plugin.fileSizeKb} KB</span>
            <span>🧩 MC {plugin.mcVersions[0]}–{plugin.mcVersions[plugin.mcVersions.length - 1]}</span>
            {plugin.purchases > 0 ? <span>🛒 {plugin.purchases} sold</span> : null}
            {plugin.views > 0 ? <span>👁 {plugin.views.toLocaleString()} views</span> : null}
          </div>

          {!isComing ? (
            <a
              href={plugin.buyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
            >
              View on BuiltByBit →
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm font-medium text-zinc-300">
              Coming soon
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function FAQBlock({ faq }: { faq: typeof FEATURED_PLUGIN.faq }) {
  if (!faq.length) return null;
  return (
    <section className="mt-16">
      <div className="space-y-2">
        <div className="text-xs font-medium tracking-widest text-fuchsia-200/70">
          FAQ
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Common questions
        </h3>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {faq.map((item) => (
          <div
            key={item.q}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="text-sm font-semibold text-zinc-100">{item.q}</div>
            <p className="mt-2 text-sm leading-6 text-zinc-300/75">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MinecraftPluginsPage() {
  const rest = PLUGINS.filter((p) => p.slug !== FEATURED_PLUGIN.slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
      <section className="space-y-5">
        <div className="text-xs font-medium tracking-widest text-cyan-200/70">
          MINECRAFT · PLUGINS
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          Plugins that ship with a clean GUI, not a 200-page wiki.
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-zinc-200/70 sm:text-base">
          Everything I sell here is what I run on my own servers. No legacy
          command-line cruft, no laggy GUIs, no 500 KB jars full of dead code.
          Buy once, get every update, and drop into a Discord if you need a
          hand.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href={FEATURED_PLUGIN.buyUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_10px_30px_-10px_rgba(34,211,238,0.55)] transition hover:brightness-105"
          >
            Buy SnxTeams on BuiltByBit
            <span aria-hidden>→</span>
          </a>
          <a
            href={FEATURED_PLUGIN.supportUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.06]"
          >
            Join the support Discord
          </a>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 space-y-1.5">
          <div className="text-xs font-medium tracking-widest text-fuchsia-200/70">
            AVAILABLE NOW
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
            {FEATURED_PLUGIN.name} — a better teams & clans plugin
          </h2>
        </div>

        <PluginCard plugin={FEATURED_PLUGIN} featured />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Features
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {FEATURED_PLUGIN.features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl leading-none">{f.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">
                        {f.title}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Specs
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-400">Platforms</dt>
                  <dd className="text-right text-zinc-100">
                    {FEATURED_PLUGIN.platforms.join(", ")}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-400">MC versions</dt>
                  <dd className="text-right text-zinc-100">
                    {FEATURED_PLUGIN.mcVersions[0]} –{" "}
                    {FEATURED_PLUGIN.mcVersions[FEATURED_PLUGIN.mcVersions.length - 1]}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-400">Game modes</dt>
                  <dd className="text-right text-zinc-100">
                    {FEATURED_PLUGIN.gamemodes.join(", ")}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-400">Commands</dt>
                  <dd className="text-right text-zinc-100">{FEATURED_PLUGIN.commandCount}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-400">Jar size</dt>
                  <dd className="text-right text-zinc-100">
                    {FEATURED_PLUGIN.fileSizeKb} KB
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-400">Storage</dt>
                  <dd className="text-right text-zinc-100">MySQL · SQLite</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-400">Source</dt>
                  <dd className="text-right text-zinc-100">
                    Unobfuscated · DRM-free
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Requirements
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300/85">
                {FEATURED_PLUGIN.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-400/10 via-fuchsia-400/5 to-transparent p-6">
              <div className="text-xs font-medium tracking-widest text-cyan-200/80">
                SUPPORT
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-200/90">
                Lifetime standard support is included with every license — drop
                into the Discord, report a bug, or ask for a feature.
              </p>
              <a
                href={FEATURED_PLUGIN.supportUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-zinc-50 transition hover:bg-white/[0.09]"
              >
                Open Discord invite →
              </a>
            </div>
          </div>
        </div>

        <FAQBlock faq={FEATURED_PLUGIN.faq} />
      </section>

      <section className="mt-16">
        <div className="mb-5 space-y-1.5">
          <div className="text-xs font-medium tracking-widest text-indigo-200/70">
            IN THE PIPELINE
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
            More plugins coming
          </h2>
          <p className="max-w-2xl text-sm text-zinc-300/70">
            I’m slowly spinning out the systems I use internally for Snoxium
            into standalone, saleable plugins. Everything below ships with the
            same promise: lightweight, GUI-first, and support that isn’t a
            generic contact form.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {rest.map((p) => (
            <PluginCard key={p.slug} plugin={p} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 sm:p-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="text-xs font-medium tracking-widest text-cyan-200/70">
                BUILTBYBIT · {FEATURED_PLUGIN.name.toUpperCase()}
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                Running an SMP, Survival, or Donut-style server?
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-zinc-300/75 sm:text-base">
                Buy it once, drop the jar in your <code className="rounded bg-black/40 px-1.5 py-0.5 text-[12px] text-cyan-100">plugins/</code> folder,
                and stop fighting clunky factions plugins that try to do 14
                things badly.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:min-w-[240px]">
              <a
                href={FEATURED_PLUGIN.buyUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_10px_30px_-10px_rgba(34,211,238,0.55)] transition hover:brightness-105"
              >
                Buy {FEATURED_PLUGIN.name} — {FEATURED_PLUGIN.price}
              </a>
              <Link
                href="/network"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.06]"
              >
                See how Snoxium uses it →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
