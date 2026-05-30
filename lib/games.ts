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
    tagline: "Minecraft network: Nexus + Gens.",
    description:
      "A connected Minecraft network with two core servers—Stardew Nexus and Stardew Gens—built on shared progression, economy, and cross-server identity.",
    status: "Minecraft Network",
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
    tagline: "Roblox leaderboard economy.",
    description:
      "A Roblox economy runner where you collect trash, sell it, and buy upgrades to climb the leaderboards with faster routes, bigger bags, and higher-value drops.",
    status: "Roblox Experience",
    highlight: "Upgrade loop + leaderboards",
  },
  {
    slug: "runalong",
    name: "Runalong",
    tagline: "Voxel runner: reflex and speed.",
    description:
      "Dive into the exciting world of Runalong, the voxel style runner game that will keep you on the edge of your seat. As you speed through a mysterious landscape, use your quick reflexes to dodge obstacles and collect coins. Complete challenges to unlock special items and characters that will enhance your adventure. Can you make it to the top of the leaderboard? Download Runalong now and join the race!",
    status: "Mobile Runner",
    highlight: "3-lane reflex gameplay + unlocks",
  },
  {
    slug: "rift-arcade",
    name: "Rift Arcade",
    tagline: "Fast competitive minigames.",
    description:
      "A premium competitive hub of short-format challenges with match-based progression, ranked leaderboards, and shared cosmetics across Snoxium.",
    status: "In Development",
    highlight: "Ranked queues + cosmetics",
  },
  {
    slug: "neon-raids",
    name: "Neon Raids",
    tagline: "Co-op boss progression.",
    description:
      "A co-op raid ladder built around squad synergy, timed clears, and progression that feeds into your Snoxium identity and network reputation.",
    status: "In Development",
    highlight: "Co-op raids + timed clears",
  },
  {
    slug: "orbit-forge",
    name: "Orbit Forge",
    tagline: "Crafting and upgrades at scale.",
    description:
      "A systems-first crafting experience where resources, recipes, and upgrades connect into the wider economy, designed for long-term mastery and trade.",
    status: "Prototype",
    highlight: "Crafting trees + market loops",
  },
  {
    slug: "shadow-couriers",
    name: "Shadow Couriers",
    tagline: "High-speed delivery routes.",
    description:
      "A precision delivery game focused on route mastery, risky shortcuts, and competitive time trials that feed into Snoxium progression and seasonal events.",
    status: "Concept",
    highlight: "Time trials + seasonal events",
  },
  {
    slug: "aether-outposts",
    name: "Aether Outposts",
    tagline: "Persistent settlement systems.",
    description:
      "A connected outpost simulation focused on building upgrades, shared economy layers, and multiplayer cooperation tied into Snoxium accounts and identity.",
    status: "Concept",
    highlight: "Persistent upgrades + co-op",
  },
];

export function getGameBySlug(slug: string) {
  return GAMES.find((g) => g.slug === slug);
}
