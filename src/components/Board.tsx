import React from 'react';
import { Cell as CellType } from '../types/minesweeper';
import Cell from './Cell';
import './Board.css';

interface BoardProps {
  board: CellType[][];
  onLeftClick: (row: number, col: number) => void;
  onRightClick: (row: number, col: number) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  gameStatus: 'playing' | 'won' | 'lost';
}

const Board: React.FC<BoardProps> = ({ board, onLeftClick, onRightClick, onMouseDown, onMouseUp, onMouseLeave, gameStatus }) => {
  return (
    <div className="board" onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              onLeftClick={onLeftClick}
              onRightClick={onRightClick}
              gameStatus={gameStatus}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
