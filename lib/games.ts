export type Game = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: string;
  highlight: string;
};

export const GAMES: Game[] = [
  {
    slug: "stardew",
    name: "Stardew",
    tagline: "The flagship networked experience.",
    description:
      "A connected progression-driven world built on shared identity, economies, and persistent systems across servers.",
    status: "Live Network",
    highlight: "Cross-server progression and economy",
  },
  {
    slug: "lunar-fish",
    name: "Lunar Fish",
    tagline: "Deep waters. High stakes.",
    description:
      "A progression loop designed for mastery—unlock gear, discover rare waters, and build a reputation that follows you across Snoxium.",
    status: "In Development",
    highlight: "Skill progression and collectibles",
  },
  {
    slug: "trash-tycoon",
    name: "Trash Tycoon",
    tagline: "Build an empire from nothing.",
    description:
      "A systems-heavy economy sandbox where production chains, upgrades, and trading connect into the wider Snoxium ecosystem.",
    status: "Prototype",
    highlight: "Economy simulation and trading",
  },
];

export function getGameBySlug(slug: string) {
  return GAMES.find((g) => g.slug === slug);
}

