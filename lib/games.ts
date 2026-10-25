export type Game = {
  slug: string; name: string; tagline: string; description: string;
  status: string; platform: string; highlight: string; features: string[];
  playUrl?: string; playLabel?: string;
  appStoreUrl?: string;
};

export const GAMES: Game[] = [
  {
    slug: "runalong", name: "Runalong", platform: "Mobile · Unity", status: "Mobile game",
    tagline: "A voxel runner built for quick reflexes.",
    description: "Run through colourful voxel worlds, dodge obstacles, collect coins, and unlock characters. Runalong brings three-lane runner action together with challenges and a home world to make your own.",
    highlight: "Running, characters, and a home world",
    features: ["Three-lane running with obstacles and coin collection", "Unlockable characters and items", "Challenges and leaderboard competition", "Ongoing work on world detail, animation, and mobile performance"],
    playUrl: "https://play.google.com/store/apps/details?id=net.snygames.runalong", playLabel: "View on Google Play",
    appStoreUrl: "https://apps.apple.com/app/runalong/id1636757952",
  },
  {
    slug: "cleanup-club", name: "Cleanup Club", platform: "Roblox", status: "Cleaning simulator",
    tagline: "Clean up the neighbourhood. Build something better.",
    description: "Collect litter, sell your haul, and upgrade your equipment. Grow a recycling business, explore new regions, and help restore a shared neighbourhood at your own pace.",
    highlight: "Cleaning, recycling, and restoration",
    features: ["Collect and sell litter to improve your equipment", "Build a recycling business with independent income", "Explore regions and work on restoration projects", "Play alone or alongside other cleaners"],
    playUrl: "https://www.roblox.com/games/76724086592638/", playLabel: "Play on Roblox",
  },
  {
    slug: "steal-a-box", name: "Steal a Box", platform: "Roblox", status: "Collection simulator",
    tagline: "Grab a box. Escape its keeper. Discover what is inside.",
    description: "Venture into colourful regions, steal guarded boxes, and get back to safety. Open your haul to collect toys, build up your plot, and train your speed for the next adventure.",
    highlight: "Keeper chases and toy collections",
    features: ["Steal boxes and escape their keepers", "Discover toys and put them to work on your plot", "Train speed and upgrade your home", "Explore new areas and hidden adventures"],
    playUrl: "https://www.roblox.com/games/92545360272876/", playLabel: "Play on Roblox",
  },
  {
    slug: "slashbound", name: "Slashbound [BETA]", platform: "Roblox", status: "Beta",
    tagline: "Make every strike count.",
    description: "A sword-combat action RPG across five fantasy worlds. Build your equipment, learn abilities, face guardians, and choose when to ascend and return stronger.",
    highlight: "Sword combat, equipment, and ascension",
    features: ["Sword combat with equipped abilities", "Five fantasy worlds and guardian encounters", "Equipment, crafting, and build progression", "Ascension and a free progression unlock for Auto combat"],
    playUrl: "https://www.roblox.com/games/73419768377965/", playLabel: "Play the beta on Roblox",
  },
  {
    slug: "plants-vs-food", name: "Plants vs Food", platform: "Fortnite · UEFN", status: "In development",
    tagline: "Plant your defence. Take on the food.",
    description: "A Fortnite project combining plant placement, food enemies, and progression. Current development focuses on planting, inventory, combat feedback, and a clear controller-friendly interface.",
    highlight: "Plant placement and food battles",
    features: ["Plant and manage your own plot", "Plants fight incoming food enemies", "Inventory and hotbar interactions", "In development; no public island code announced here"],
  },
  {
    slug: "stardew", name: "Stardew", platform: "Minecraft", status: "Network project",
    tagline: "Nexus, generators, and a connected community.",
    description: "The Minecraft side of Snoxium: Stardew Nexus and Stardew Gens, built around server communities, progression, and economy systems.",
    highlight: "Minecraft progression and server systems",
    features: ["Stardew Nexus and Stardew Gens", "Generator progression and upgrades", "Economy and community systems"],
  },
  {
    slug: "lunar-fish", name: "Lunar Fish", platform: "Minecraft", status: "Server project",
    tagline: "A sci-fi fishing RPG.",
    description: "A Minecraft fishing server project with a science-fiction setting, equipment upgrades, new zones, and long-term progression.",
    highlight: "Fishing and exploration",
    features: ["Fishing-focused progression", "Equipment upgrades and zones", "A science-fiction setting"],
  },
];

export const FEATURED_GAMES = GAMES.slice(0, 4);
export function getGameBySlug(slug: string) {
  // Preserve links to the earlier name of the cleanup project.
  return GAMES.find(game => game.slug === (slug === "trash-tycoon" ? "cleanup-club" : slug));
}
