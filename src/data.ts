export type LaunchStatus = "live" | "upcoming" | "ended";

export interface LaunchProject {
  name: string;
  ticker: string;
  emoji: string;
  status: LaunchStatus;
  raise: string;
  progress: number;
  price: string;
  chain: string;
  tint: string;
}

export const launches: LaunchProject[] = [
  {
    name: "Bubble Finance",
    ticker: "BUBL",
    emoji: "🫧",
    status: "live",
    raise: "$420,000",
    progress: 72,
    price: "0.012 RBH",
    chain: "Robinhood Chain",
    tint: "from-plops-sky/40 to-plops-blue/30",
  },
  {
    name: "Lumen Protocol",
    ticker: "LMN",
    emoji: "🌙",
    status: "live",
    raise: "$680,000",
    progress: 54,
    price: "0.008 RBH",
    chain: "Robinhood Chain",
    tint: "from-plops-green/40 to-plops-mint/30",
  },
  {
    name: "Petal Swap",
    ticker: "PETAL",
    emoji: "🌸",
    status: "upcoming",
    raise: "$300,000",
    progress: 0,
    price: "0.015 RBH",
    chain: "Robinhood Chain",
    tint: "from-plops-pink/40 to-plops-rose/30",
  },
  {
    name: "Aurora DAO",
    ticker: "AUR",
    emoji: "🪐",
    status: "upcoming",
    raise: "$1,200,000",
    progress: 0,
    price: "0.021 RBH",
    chain: "Robinhood Chain",
    tint: "from-plops-blue/40 to-plops-green/30",
  },
  {
    name: "Nimbus Pay",
    ticker: "NIMB",
    emoji: "☁️",
    status: "ended",
    raise: "$540,000",
    progress: 100,
    price: "0.009 RBH",
    chain: "Robinhood Chain",
    tint: "from-plops-sky/40 to-plops-mint/30",
  },
  {
    name: "Coral Quest",
    ticker: "CORAL",
    emoji: "🐚",
    status: "ended",
    raise: "$260,000",
    progress: 100,
    price: "0.006 RBH",
    chain: "Robinhood Chain",
    tint: "from-plops-pink/40 to-plops-sky/30",
  },
];

export interface Feature {
  emoji: string;
  title: string;
  desc: string;
}

export const features: Feature[] = [
  {
    emoji: "🚀",
    title: "Fair Launch Engine",
    desc: "Anti-bot, anti-whale allocation with tiered rounds so every plopper gets a fair shot.",
  },
  {
    emoji: "🔒",
    title: "Audited & Locked",
    desc: "Liquidity auto-locks and team tokens vest on-chain. Every contract is audited before listing.",
  },
  {
    emoji: "⚡",
    title: "Robinhood Speed",
    desc: "Sub-second finality and near-zero fees powered natively by the Robinhood Chain.",
  },
  {
    emoji: "🎯",
    title: "Tiered Staking",
    desc: "Stake $PLOP to unlock guaranteed allocations across Diamond, Sapphire and Emerald tiers.",
  },
  {
    emoji: "🌈",
    title: "No-code Creator Studio",
    desc: "Launch a token sale in minutes — pick a template, set your curve, and go live.",
  },
  {
    emoji: "🛡️",
    title: "Rug-proof Vaults",
    desc: "Funds stay escrowed in vaults and release only when milestones are met.",
  },
];

export interface Step {
  step: string;
  title: string;
  desc: string;
}

export const steps: Step[] = [
  {
    step: "01",
    title: "Connect Wallet",
    desc: "Link your Robinhood Chain wallet in a single tap. No sign-ups, no friction.",
  },
  {
    step: "02",
    title: "Stake $PLOP",
    desc: "Lock $PLOP to earn a tier and reserve your allocation for upcoming launches.",
  },
  {
    step: "03",
    title: "Join a Launch",
    desc: "Browse curated projects, contribute during your window, and confirm on-chain.",
  },
  {
    step: "04",
    title: "Claim & Grow",
    desc: "Claim tokens the moment vesting unlocks and track your portfolio in the dashboard.",
  },
];

export interface Stat {
  value: string;
  label: string;
}

export const stats: Stat[] = [
  { value: "$28M+", label: "Total Raised" },
  { value: "140+", label: "Projects Launched" },
  { value: "62K", label: "Active Ploppers" },
  { value: "99.2%", label: "Success Rate" },
];

export interface RoadmapItem {
  quarter: string;
  title: string;
  points: string[];
  done: boolean;
}

export const roadmap: RoadmapItem[] = [
  {
    quarter: "Q1 2026",
    title: "Genesis",
    points: ["plops mainnet on Robinhood Chain", "$PLOP token generation event", "First fair launches go live"],
    done: true,
  },
  {
    quarter: "Q2 2026",
    title: "Bloom",
    points: ["Tiered staking vaults", "No-code Creator Studio beta", "Mobile app launch"],
    done: true,
  },
  {
    quarter: "Q3 2026",
    title: "Constellation",
    points: ["Cross-chain launches", "On-chain governance for listings", "Liquidity-as-a-service"],
    done: false,
  },
  {
    quarter: "Q4 2026",
    title: "Aurora",
    points: ["AI launch scoring", "Institutional launch rails", "plops grants program"],
    done: false,
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const faqs: FaqItem[] = [
  {
    q: "What is plops?",
    a: "plops is a fair-launch launchpad built natively on the Robinhood Chain. It lets creators raise capital and lets the community discover and back new tokens safely.",
  },
  {
    q: "Why the Robinhood Chain?",
    a: "The Robinhood Chain gives us sub-second finality, negligible gas fees, and deep liquidity — perfect for fast, fair token launches at scale.",
  },
  {
    q: "How do I get an allocation?",
    a: "Stake $PLOP to earn a tier. Higher tiers unlock guaranteed allocations, while a lottery pool keeps launches open to everyone.",
  },
  {
    q: "Is it safe?",
    a: "Every listed project is audited, liquidity is auto-locked, and funds sit in milestone-gated vaults to protect contributors from rugs.",
  },
  {
    q: "What are the fees?",
    a: "plops charges a small success fee on completed raises. There are no fees to browse, stake, or claim your tokens.",
  },
];
