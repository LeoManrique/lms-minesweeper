import { Cell, GameState, Difficulty } from '../types/minesweeper';

export function createEmptyBoard(rows: number, cols: number): Cell[][] {
  const board: Cell[][] = [];
  for (let row = 0; row < rows; row++) {
    board[row] = [];
    for (let col = 0; col < cols; col++) {
      board[row][col] = {
        row,
        col,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
        isClickedMine: false,
      };
    }
  }
  return board;
}

export function placeMines(board: Cell[][], mineCount: number, firstClickRow: number, firstClickCol: number): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  let minesPlaced = 0;

  while (minesPlaced < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    // Don't place mine on first click or adjacent cells
    const isFirstClick = row === firstClickRow && col === firstClickCol;
    const isAdjacent = Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1;

    if (!newBoard[row][col].isMine && !isFirstClick && !isAdjacent) {
      newBoard[row][col].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate neighbor mines
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!newBoard[row][col].isMine) {
        newBoard[row][col].neighborMines = countNeighborMines(newBoard, row, col);
      }
    }
  }

  return newBoard;
}

export function countNeighborMines(board: Cell[][], row: number, col: number): number {
  const rows = board.length;
  const cols = board[0].length;
  let count = 0;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        if (board[newRow][newCol].isMine) {
          count++;
        }
      }
    }
  }

  return count;
}

export function revealCell(board: Cell[][], row: number, col: number): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    return newBoard;
  }

  const cell = newBoard[row][col];

  if (cell.isRevealed || cell.isFlagged) {
    return newBoard;
  }

  cell.isRevealed = true;

  // If no neighbor mines, reveal adjacent cells (flood fill)
  if (cell.neighborMines === 0 && !cell.isMine) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
          if (!newBoard[newRow][newCol].isRevealed) {
            const revealed = revealCell(newBoard, newRow, newCol);
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                newBoard[r][c] = revealed[r][c];
              }
            }
          }
        }
      }
    }
  }

  return newBoard;
}

export function toggleFlag(board: Cell[][], row: number, col: number): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const cell = newBoard[row][col];

  if (!cell.isRevealed) {
    cell.isFlagged = !cell.isFlagged;
  }

  return newBoard;
}

export function revealAllMines(board: Cell[][], clickedRow: number, clickedCol: number): Cell[][] {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      // Mark the clicked mine
      isClickedMine: (cell.row === clickedRow && cell.col === clickedCol && cell.isMine) ? true : cell.isClickedMine,
      // Only reveal mines that are NOT flagged
      isRevealed: (cell.isMine && !cell.isFlagged) ? true : cell.isRevealed,
    }))
  );
}

export function flagAllMines(board: Cell[][]): Cell[][] {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      isFlagged: cell.isMine ? true : cell.isFlagged,
    }))
  );
}

export function checkWinCondition(board: Cell[][], mineCount: number): boolean {
  const rows = board.length;
  const cols = board[0].length;
  const totalCells = rows * cols;
  let revealedCount = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].isRevealed) {
        revealedCount++;
      }
    }
  }

  return revealedCount === totalCells - mineCount;
}

export function countFlags(board: Cell[][]): number {
  let count = 0;
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      if (board[row][col].isFlagged) {
        count++;
      }
    }
  }
  return count;
}

export function initializeGame(difficulty: Difficulty): GameState {
  const board = createEmptyBoard(difficulty.rows, difficulty.cols);

  return {
    board,
    gameStatus: 'playing',
    mineCount: difficulty.mines,
    flagCount: 0,
    revealedCount: 0,
    startTime: null,
    endTime: null,
  };
}
