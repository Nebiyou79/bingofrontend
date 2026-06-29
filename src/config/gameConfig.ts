/**
 * config/gameConfig.ts
 * Central configuration for all DashBets games
 * Background images: bg (1).png through bg (17).png
 * Loading images: loading1.png through loading17.png (per-game artwork
 * shown in the LoadingScreen medallion — see numbering reference below)
 */

export interface GameConfig {
  id: string;
  name: string;
  path: string;
  icon: string;
  backgroundImage: string;
  backgroundOverlay?: string;
  backgroundPattern?: string;
  loadingImage: string;
  rtp: string;
  category: string;
  badge?: string;
  description: string;
  accentColor: string;
  secondaryColor: string;
  backgroundStyle: 'gradient' | 'image' | 'pattern' | 'solid';
}

export const GAMES_CONFIG: GameConfig[] = [
  {
    id: 'keno',
    name: 'Keno',
    path: '/games/keno',
    icon: '/images/games/keno.png',
    backgroundImage: '/images/games/bg1.png',
    loadingImage: '/images/games/loading1.png',
    backgroundStyle: 'image',
    accentColor: '#f5c842',
    secondaryColor: '#e8a800',
    rtp: '97.1%',
    category: 'Lottery',
    description: 'Pick your lucky numbers and win big!'
  },
  {
    id: 'bingo',
    name: 'Bingo',
    path: '/games/bingo',
    icon: '/images/games/bingo.png',
    backgroundImage: '/images/games/bg (2).png',
    loadingImage: '/images/games/loading2.png',
    backgroundStyle: 'image',
    accentColor: '#10b981',
    secondaryColor: '#059669',
    rtp: '90.2%',
    category: 'Multiplayer',
    description: 'Join live bingo rooms and win massive prizes!'
  },
  {
    id: 'spin',
    name: 'Spin Wheel',
    path: '/games/spin',
    icon: '/images/games/spin.png',
    backgroundImage: '/images/games/bg (3).png',
    loadingImage: '/images/games/loading3.png',
    backgroundStyle: 'image',
    accentColor: '#f59e0b',
    secondaryColor: '#d97706',
    rtp: '96.5%',
    category: 'Instant Win',
    badge: 'HOT',
    description: 'Spin the wheel of fortune for instant rewards!'
  },
  {
    id: 'limbo',
    name: 'Limbo',
    path: '/games/limbo',
    icon: '/images/games/limbo.png',
    backgroundImage: '/images/games/bg4.png',
    loadingImage: '/images/games/loading4.png',
    backgroundStyle: 'gradient',
    backgroundOverlay: 'radial-gradient(ellipse at 50% 0%, #1a0a3e 0%, #0d0b1e 60%)',
    accentColor: '#7c3aed',
    secondaryColor: '#5b21b6',
    rtp: '97.0%',
    category: 'Crash',
    description: 'How high can you go? Cash out before it\'s too late!'
  },
  {
    id: 'zombile',
    name: 'Zombile',
    path: '/games/crash',
    icon: '/images/games/crash.png',
    backgroundImage: '/images/games/bg (5).png',
    loadingImage: '/images/games/loading5.png',
    backgroundStyle: 'image',
    accentColor: '#84cc16',
    secondaryColor: '#65a30d',
    rtp: '96.3%',
    category: 'Adventure',
    badge: 'NEW',
    description: 'Survive the zombie apocalypse and win prizes!'
  },
  {
    id: 'blackjack',
    name: 'BlackJack',
    path: '/games/blackjack',
    icon: '/images/games/blackjack.png',
    backgroundImage: '/images/games/bg (6).png',
    loadingImage: '/images/games/loading6.png',
    backgroundStyle: 'pattern',
    backgroundPattern: 'repeating-linear-gradient(45deg, rgba(0,100,0,0.1) 0px, rgba(0,100,0,0.1) 2px, transparent 2px, transparent 10px)',
    accentColor: '#16a34a',
    secondaryColor: '#15803d',
    rtp: '99.4%',
    category: 'Card Games',
    description: 'Beat the dealer in classic BlackJack!'
  },
  {
    id: 'card-draw',
    name: 'Card Draw',
    path: '/games/card-draw',
    icon: '/images/games/card-draw.png',
    backgroundImage: '/images/games/bg (7).png',
    loadingImage: '/images/games/loading7.png',
    backgroundStyle: 'pattern',
    accentColor: '#3b82f6',
    secondaryColor: '#2563eb',
    rtp: '97.8%',
    category: 'Card Games',
    description: 'Draw cards and match for amazing multipliers!'
  },
  {
    id: 'chicken-road',
    name: 'Chicken Road',
    path: '/games/chicken',
    icon: '/images/games/chicken-road.png',
    backgroundImage: '/images/games/bg (8).png',
    loadingImage: '/images/games/loading8.png',
    backgroundStyle: 'image',
    accentColor: '#f97316',
    secondaryColor: '#ea580c',
    rtp: '96.7%',
    category: 'Adventure',
    description: 'Help the chicken cross the road to win!'
  },
  {
    id: 'hi-lo',
    name: 'HI-LO',
    path: '/games/hilo',
    icon: '/images/games/hi-lo.png',
    backgroundImage: '/images/games/bg (9).png',
    loadingImage: '/images/games/loading9.png',
    backgroundStyle: 'gradient',
    backgroundOverlay: 'linear-gradient(180deg, #1a1225 0%, #0f0c1a 100%)',
    accentColor: '#c0392b',
    secondaryColor: '#a93226',
    rtp: '97.2%',
    category: 'Card Games',
    description: 'Guess higher or lower to multiply your wins!'
  },
  {
    id: 'bane-wild',
    name: 'Bane Wild',
    path: '/games/multihot',
    icon: '/images/games/bane-wild.png',
    backgroundImage: '/images/games/bg (10).png',
    loadingImage: '/images/games/loading10.png',
    backgroundStyle: 'image',
    accentColor: '#d97706',
    secondaryColor: '#b45309',
    rtp: '96.1%',
    category: 'Slots',
    badge: 'POPULAR',
    description: 'Wild west themed slot adventure!'
  },
  {
    id: 'giovani',
    name: 'Giovani',
    path: '/games/giovani',
    icon: '/images/games/giovani.png',
    backgroundImage: '/images/games/bg (11).png',
    loadingImage: '/images/games/loading11.png',
    backgroundStyle: 'image',
    accentColor: '#a855f7',
    secondaryColor: '#9333ea',
    rtp: '96.4%',
    category: 'Slots',
    description: 'Luxury themed slot with massive jackpots!'
  },
  {
    id: 'dragon-tower',
    name: 'Dragon Tower',
    path: '/games/dragontower',
    icon: '/images/games/dragontower.png',
    backgroundImage: '/images/games/bg (12).png',
    loadingImage: '/images/games/loading12.png',
    backgroundStyle: 'image',
    accentColor: '#ef4444',
    secondaryColor: '#dc2626',
    rtp: '96.8%',
    category: 'Adventure',
    description: 'Climb the dragon tower for legendary rewards!'
  },
  {
    id: 'mines',
    name: 'Mines',
    path: '/games/mines',
    icon: '/images/games/mines.png',
    backgroundImage: '/images/games/bg (13).png',
    loadingImage: '/images/games/loading13.png',
    backgroundStyle: 'pattern',
    accentColor: '#f59e0b',
    secondaryColor: '#d97706',
    rtp: '97.5%',
    category: 'Strategy',
    description: 'Avoid the mines and collect gems!'
  },
  {
    id: 'plinko',
    name: 'Plinko',
    path: '/games/plinko',
    icon: '/images/games/plinko.png',
    backgroundImage: '/images/games/bg (14).png',
    loadingImage: '/images/games/loading14.png',
    backgroundStyle: 'image',
    accentColor: '#06b6d4',
    secondaryColor: '#0891b2',
    rtp: '96.9%',
    category: 'Instant Win',
    description: 'Drop the ball and watch it bounce to victory!'
  },
  {
    id: 'rps',
    name: 'RPS',
    path: '/games/rps',
    icon: '/images/games/rps.png',
    backgroundImage: '/images/games/bg15.png',
    loadingImage: '/images/games/loading15.png',
    backgroundStyle: 'gradient',
    backgroundOverlay: 'linear-gradient(180deg, #060612 0%, #08081a 100%)',
    accentColor: '#8b5cf6',
    secondaryColor: '#7c3aed',
    rtp: '97.3%',
    category: 'Strategy',
    description: 'Rock, Paper, Scissors - beat the house!'
  },
  {
    id: 'crash',
    name: 'Crash',
    path: '/games/crash',
    icon: '/images/games/crash.png',
    backgroundImage: '/images/games/bg (16).png',
    loadingImage: '/images/games/loading16.png',
    backgroundStyle: 'gradient',
    backgroundOverlay: 'linear-gradient(180deg, #0f0a1f 0%, #0a0d1a 100%)',
    accentColor: '#22d3ee',
    secondaryColor: '#06b6d4',
    rtp: '97.0%',
    category: 'Crash',
    badge: 'LIVE',
    description: 'Watch the multiplier rise and cash out in time!'
  },
  // {
  //   id: 'slots',
  //   name: 'Giovani',
  //   path: '/games/giovani',
  //   icon: '/images/games/slots.png',
  //   backgroundImage: '/images/games/bg17.png',
  //   loadingImage: '/images/games/loading17.png',
  //   backgroundStyle: 'image',
  //   accentColor: '#ec4899',
  //   secondaryColor: '#db2777',
  //   rtp: '96.2%',
  //   category: 'Slots',
  //   badge: 'POPULAR',
  //   description: 'Classic slot machine with modern twists!'
  // }
];

export const getGameByPath = (path: string): GameConfig | undefined => {
  return GAMES_CONFIG.find(game => game.path === path);
};

export const getGameById = (id: string): GameConfig | undefined => {
  return GAMES_CONFIG.find(game => game.id === id);
};

export const getGamesByCategory = (category: string): GameConfig[] => {
  return GAMES_CONFIG.filter(game => game.category === category);
};

export const GAME_CATEGORIES = [
  'All',
  'Lottery',
  'Multiplayer',
  'Instant Win',
  'Crash',
  'Adventure',
  'Card Games',
  'Slots',
  'Strategy'
];

// Game numbering reference:
// (1)  - Keno
// (2)  - Bingo
// (3)  - Spin Wheel
// (4)  - Limbo
// (5)  - Zombile
// (6)  - BlackJack
// (7)  - Card Draw
// (8)  - Chicken Road
// (9)  - HI-LO
// (10) - Bane Wild
// (11) - Giovani
// (12) - Dragon Tower
// (13) - Mines
// (14) - Plinko
// (15) - RPS
// (16) - Crash
// (17) - Slots