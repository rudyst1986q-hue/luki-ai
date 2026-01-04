
export enum GameMode {
  FREE_CHAT = 'FREE_CHAT',
  RP_MODE = 'RP_MODE',
  TEXT_GAMES = 'TEXT_GAMES',
  IMAGE_ANALYSIS = 'IMAGE_ANALYSIS',
  IMAGE_GAMES = 'IMAGE_GAMES'
}

export type RPSubMode = 'cyberpunk' | 'fantasy' | 'horror' | 'custom';

export interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: number;
}

export interface UserTheme {
  bg: string;
  accent: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  xp: number;
  history: Message[];
  mode: GameMode;
  rpSubMode: RPSubMode;
  isGuest?: boolean;
  friends: string[]; // List of IDs
  pendingRequests: string[]; // List of IDs requesting friendship
  theme?: UserTheme;
}

export interface UserStats {
  level: number;
  rank: string;
}
