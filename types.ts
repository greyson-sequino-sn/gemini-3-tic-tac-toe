export type Player = 'X' | 'O' | null;

export interface GameState {
  board: Player[];
  isXNext: boolean;
  winner: Player | 'DRAW' | null;
  winningLine: number[] | null;
  history: Player[][];
}

export enum GameMode {
  LOCAL_PVP = 'LOCAL_PVP',
  VS_AI = 'VS_AI',
  ONLINE = 'ONLINE',
}

export interface AIMoveResponse {
  moveIndex: number;
  comment: string;
}

export interface Difficulty {
  id: string;
  name: string;
  description: string;
}