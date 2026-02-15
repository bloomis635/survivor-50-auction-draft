export type RoomPhase = "LOBBY" | "AUCTION" | "COMPLETE";
export type AuctionStatus = "IDLE" | "RUNNING" | "ENDED";
export type ContestantStatus = "AVAILABLE" | "NOMINATED" | "DRAFTED";

export interface Player {
  id: string;
  name: string;
  budgetRemaining: number;
  connected: boolean;
  roster: string[]; // contestant IDs
}

export interface Contestant {
  id: string;
  name: string;
  bio: string;
  imageUrl?: string;
  star?: boolean;
  status: ContestantStatus;
  draftedByPlayerId?: string;
  draftedPrice?: number;
  draftOrder?: number;
}

export interface RoomSettings {
  startingBudget: number;
  minIncrement: number;
  timerSeconds: number;
}

export interface CurrentAuction {
  contestantId?: string;
  status: AuctionStatus;
  currentBid: number;
  currentBidderPlayerId?: string;
  endTime?: number; // Unix timestamp
}

export interface RoomState {
  id: string;
  phase: RoomPhase;
  settings: RoomSettings;
  players: Record<string, Player>;
  contestants: Record<string, Contestant>;
  currentAuction: CurrentAuction;
  nominatorPlayerId?: string; // player who gets to nominate next (last auction winner)
}

// Socket events
export interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "error": (message: string) => void;
  "auction:tick": (timeRemaining: number) => void;
}

export interface ClientToServerEvents {
  "room:join": (data: { roomId: string; playerName: string; playerId?: string }) => void;
  "player:update": (data: { name: string }) => void;
  "contestant:add": (data: { adminKey: string; contestant: Omit<Contestant, "id" | "status"> }) => void;
  "contestant:edit": (data: { adminKey: string; contestantId: string; updates: Partial<Contestant> }) => void;
  "contestant:delete": (data: { adminKey: string; contestantId: string }) => void;
  "settings:update": (data: { adminKey: string; settings: Partial<RoomSettings> }) => void;
  "auction:start": (data: { adminKey: string }) => void;
  "auction:nominate": (data: { adminKey?: string; contestantId: string }) => void;
  "auction:bid": (data: { amount: number }) => void;
  "auction:pause": (data: { adminKey: string }) => void;
  "auction:resume": (data: { adminKey: string }) => void;
  "draft:start": (data: { adminKey: string }) => void;
}
