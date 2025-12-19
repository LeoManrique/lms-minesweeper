export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
  isClickedMine: boolean;
}

export interface GameState {
  board: Cell[][];
  gameStatus: 'playing' | 'won' | 'lost';
  mineCount: number;
  flagCount: number;
  revealedCount: number;
  startTime: number | null;
  endTime: number | null;
}

export interface Difficulty {
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Record<string, Difficulty> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};
