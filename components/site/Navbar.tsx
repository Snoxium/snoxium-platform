import Link from "next/link";

const NAV_LINKS = [
  { href: "/games", label: "Games" },
  { href: "/network", label: "Network" },
  { href: "/about", label: "About" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05050a]/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 font-semibold tracking-tight"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
            <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-fuchsia-500/20 via-cyan-400/10 to-indigo-500/20 opacity-0 blur transition group-hover:opacity-100" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.55)]" />
          </span>
          <span className="text-zinc-50">Snoxium</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-200/75 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/games"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-cyan-300/30 hover:bg-white/[0.06]"
          >
            Explore
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 pb-3 text-xs font-medium text-zinc-200/70 md:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition hover:text-zinc-50"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
