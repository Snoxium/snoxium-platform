import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#05050a]/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <div className="text-lg font-semibold tracking-tight text-zinc-50">
            Snoxium
          </div>
          <p className="text-sm leading-6 text-zinc-200/70">
            A connected ecosystem where identity, progression, and systems flow
            between worlds.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm text-zinc-200/70">
          <div className="space-y-3">
            <div className="text-xs font-medium tracking-widest text-zinc-200/60">
              PLATFORM
            </div>
            <Link href="/games" className="block transition hover:text-zinc-50">
              Games
            </Link>
            <Link
              href="/network"
              className="block transition hover:text-zinc-50"
            >
              Network
            </Link>
            <Link href="/about" className="block transition hover:text-zinc-50">
              About
            </Link>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-medium tracking-widest text-zinc-200/60">
              SOCIAL
            </div>
            <a className="block transition hover:text-zinc-50" href="#">
              Discord
            </a>
            <a className="block transition hover:text-zinc-50" href="#">
              X / Twitter
            </a>
            <a className="block transition hover:text-zinc-50" href="#">
              YouTube
            </a>
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-xs font-medium tracking-widest text-zinc-200/60">
            STATUS
          </div>
          <p className="text-sm leading-6 text-zinc-200/70">
            Build: modern Next.js platform UI. Worlds: Stardew Network, Lunar
            Fish, Trash Tycoon.
          </p>
          <p className="text-xs text-zinc-200/50">
            © {new Date().getFullYear()} Snoxium. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

