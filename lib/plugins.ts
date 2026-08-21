export type Plugin = {
  slug: string;
  name: string;
  tagline: string;
  version: string;
  status: "LIVE" | "BETA" | "COMING SOON";
  category: ("Gameplay" | "GUI" | "Storage" | "Chat" | "Economy")[];
  description: string;
  longDescription: string;
  price: string | null;
  rating: number;
  reviews: number;
  purchases: number;
  views: number;
  publishedAt: string;
  updatedAt: string;
  platforms: string[];
  mcVersions: string[];
  gamemodes: string[];
  languages: string[];
  openSource: boolean;
  drmFree: boolean;
  unobfuscated: boolean;
  supportUrl: string;
  buyUrl: string;
  author: string;
  features: {
    title: string;
    description: string;
    icon: string;
  }[];
  faq: { q: string; a: string }[];
  requirements: string[];
  commandCount: number;
  fileSizeKb: number;
  tags: string[];
};

const FEATURED: Plugin = {
  slug: "teams",
  name: "SnxTeams",
  tagline: "Clean GUI-based teams & clans for Survival and SMP servers",
  version: "v1.0.0-a",
  status: "LIVE",
  category: ["Gameplay", "GUI", "Storage"],
  description:
    "SnxTeams is a clean, GUI-based teams and clans plugin built for survival and SMP servers that want organized team gameplay without the complexity or bloat of full factions plugins. It focuses on essential team features, intuitive menus, and strong performance — making it easy for players to group up and for servers to stay lag-free.",
  longDescription:
    "Built for SMP, Survival, Prison, and Towny servers, SnxTeams keeps the core teams experience focused and approachable. Every action flows through clean in-game menus so players never have to remember a wall of commands — but every command still exists for power users and scripting. Bank accounts with Vault, shared chests, team homes, invite workflows, ranks, alliances, and leaderboards all ship in a lightweight ~150KB jar.",
  price: "$8.99",
  rating: 5.0,
  reviews: 1,
  purchases: 1,
  views: 785,
  publishedAt: "Dec 23, 2025",
  updatedAt: "Jan 27, 2026",
  platforms: ["Bukkit", "Spigot", "Paper", "Purpur"],
  mcVersions: [
    "1.21.10",
    "1.21.8",
    "1.21.5",
    "1.21.4",
    "1.21.2",
    "1.21",
    "1.20",
    "1.18",
    "1.17",
    "1.16",
  ],
  gamemodes: ["Survival", "Prison", "Towny"],
  languages: ["English"],
  openSource: false,
  drmFree: true,
  unobfuscated: true,
  supportUrl: "https://discord.gg/4sjDgwQNgj",
  buyUrl: "https://builtbybit.com/resources/teams-plugin.86753/",
  author: "Snox",
  features: [
    {
      icon: "🪟",
      title: "Intuitive GUI interface",
      description:
        "Beautiful, user-friendly menus that make team management effortless for players of all skill levels. Click through instead of memorizing commands.",
    },
    {
      icon: "🛡️",
      title: "Full team lifecycle",
      description:
        "Create, disband, invite, kick, promote, and transfer ownership — with sensible role defaults and an easy permissions flow.",
    },
    {
      icon: "💰",
      title: "Shared banking via Vault",
      description:
        "Deposit and withdraw from a team balance. Works with any Vault-compatible economy plugin and keeps team funds audit-able.",
    },
    {
      icon: "🏠",
      title: "Team homes",
      description:
        "Set, teleport to, and manage strategic team locations with cooldown controls so bases always have a waypoint.",
    },
    {
      icon: "📦",
      title: "Team chests & storage",
      description:
        "Shared team storage for collaborative item management and resource sharing without messy trust commands.",
    },
    {
      icon: "📊",
      title: "Stats and leaderboards",
      description:
        "Track team performance, member contributions, and competitive metrics so good play feels rewarding.",
    },
    {
      icon: "⚔️",
      title: "Alliances & friendly fire",
      description:
        "Declare allies and toggle friendly fire per team so PvP servers get the diplomacy they need without the bloat.",
    },
    {
      icon: "🧩",
      title: "Placeholders & API",
      description:
        "A clean event-driven API and PlaceholderAPI support so you can plug SnxTeams into scoreboards, web panels, and custom scripts.",
    },
    {
      icon: "⚡",
      title: "Lightweight and async",
      description:
        "All storage and queries run off the main thread. The jar is only ~154 KB and ships with both MySQL and SQLite backends.",
    },
  ],
  faq: [
    {
      q: "Which server software is supported?",
      a: "Bukkit, Spigot, Paper, and Purpur. Any fork that implements the Bukkit API should work.",
    },
    {
      q: "What Minecraft versions are supported?",
      a: "1.16 through the latest 1.21.x releases, including 1.21.10. All tested in survival and SMP environments.",
    },
    {
      q: "Do I need Vault or PlaceholderAPI?",
      a: "Vault is only required if you want the team banking features. PlaceholderAPI is optional and unlocks SnxTeams placeholders in scoreboards and chat.",
    },
    {
      q: "Is the source code obfuscated?",
      a: "No. The purchase includes the unobfuscated, DRM-free jar so you can audit it, patch it, or embed it into your own build pipeline worry-free.",
    },
    {
      q: "How do I get support?",
      a: "Join the Snoxium support Discord from the link on the resource page — lifetime standard support is included with every purchase.",
    },
  ],
  requirements: [
    "Java 17 or newer",
    "Bukkit / Spigot / Paper / Purpur 1.16+",
    "Optional: Vault for team banking",
    "Optional: PlaceholderAPI for placeholders",
  ],
  commandCount: 18,
  fileSizeKb: 153.9,
  tags: [
    "clan",
    "clans",
    "custom teams plugin",
    "donut",
    "gui",
    "smp",
    "survival",
    "team",
    "team alliance",
    "team plugin",
  ],
};

const UPCOMING: Plugin[] = [
  {
    slug: "portals",
    name: "SnxPortals",
    tagline: "Scriptable portals with region-gated destinations and cooldowns",
    version: "v0.3.0",
    status: "BETA",
    category: ["Gameplay", "Storage"],
    description:
      "Lightweight portal system that connects survival worlds, minigame lobbies, and event areas without the overhead of a full regions plugin.",
    longDescription:
      "SnxPortals lets you define portals by cuboid selection, assign destinations, require permissions, apply cooldowns, and fire custom commands on entry — all through a GUI.",
    price: null,
    rating: 0,
    reviews: 0,
    purchases: 0,
    views: 0,
    publishedAt: "Coming soon",
    updatedAt: "Coming soon",
    platforms: ["Paper", "Purpur"],
    mcVersions: ["1.21", "1.20"],
    gamemodes: ["Survival", "Minigames"],
    languages: ["English"],
    openSource: false,
    drmFree: true,
    unobfuscated: true,
    supportUrl: "https://discord.gg/4sjDgwQNgj",
    buyUrl: "#",
    author: "Snox",
    features: [
      {
        icon: "🌀",
        title: "GUI portal editor",
        description: "Create and tweak portals in-game without touching YAML.",
      },
      {
        icon: "🚪",
        title: "Cross-world destinations",
        description:
          "Teleport between worlds, sub-servers, or exact coordinates.",
      },
      {
        icon: "⏳",
        title: "Cooldowns & costs",
        description:
          "Attach per-player cooldowns and Vault fees to portal usage.",
      },
    ],
    faq: [],
    requirements: ["Paper 1.20+"],
    commandCount: 6,
    fileSizeKb: 92,
    tags: ["portals", "teleport", "lobby", "survival"],
  },
  {
    slug: "chat",
    name: "SnxChat",
    tagline: "Minimal, fast, permission-aware channels with placeholders",
    version: "v0.1.0",
    status: "COMING SOON",
    category: ["Chat"],
    description:
      "SnxChat keeps your chat readable: separate channels, weighted mentions, optional Discord relay, and zero bloat.",
    longDescription:
      "Modern chat plugin for survival and SMP servers that want clean formatting, team chat, and placeholder support without 500 KB of legacy junk.",
    price: null,
    rating: 0,
    reviews: 0,
    purchases: 0,
    views: 0,
    publishedAt: "Coming soon",
    updatedAt: "Coming soon",
    platforms: ["Paper", "Purpur"],
    mcVersions: ["1.21", "1.20"],
    gamemodes: ["Survival"],
    languages: ["English"],
    openSource: false,
    drmFree: true,
    unobfuscated: true,
    supportUrl: "https://discord.gg/4sjDgwQNgj",
    buyUrl: "#",
    author: "Snox",
    features: [
      {
        icon: "💬",
        title: "Configurable channels",
        description:
          "Local, global, staff, and team channels out of the box.",
      },
      {
        icon: "🤝",
        title: "SnxTeams integration",
        description: "Team chat works with SnxTeams with zero config.",
      },
      {
        icon: "🏷️",
        title: "Rich placeholders",
        description:
          "Per-channel prefixes and PlaceholderAPI support everywhere.",
      },
    ],
    faq: [],
    requirements: ["Paper 1.20+"],
    commandCount: 9,
    fileSizeKb: 68,
    tags: ["chat", "channels", "team chat", "placeholders"],
  },
];

export const PLUGINS: Plugin[] = [FEATURED, ...UPCOMING];
export const FEATURED_PLUGIN: Plugin = FEATURED;
