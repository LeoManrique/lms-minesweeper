import React from 'react';
import { Cell as CellType } from '../types/minesweeper';
import './Cell.css';

interface CellProps {
  cell: CellType;
  onLeftClick: (row: number, col: number) => void;
  onRightClick: (row: number, col: number) => void;
  gameStatus: 'playing' | 'won' | 'lost';
}

const Cell: React.FC<CellProps> = ({ cell, onLeftClick, onRightClick, gameStatus }) => {
  const handleClick = () => {
    if (gameStatus === 'playing') {
      onLeftClick(cell.row, cell.col);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameStatus === 'playing') {
      onRightClick(cell.row, cell.col);
    }
  };

  const getCellContent = () => {
    if (cell.isFlagged) {
      return '🚩';
    }

    if (cell.isRevealed) {
      if (cell.isMine) {
        return '💣';
      }
      if (cell.neighborMines > 0) {
        return cell.neighborMines;
      }
    }

    return '';
  };

  const getCellClassName = () => {
    const classes = ['cell'];

    if (cell.isRevealed) {
      classes.push('revealed');
      if (cell.isMine) {
        // Only add 'mine' class (red background) for the clicked mine
        if (cell.isClickedMine) {
          classes.push('mine');
        }
      } else if (cell.neighborMines > 0) {
        classes.push(`number-${cell.neighborMines}`);
      }
    } else {
      classes.push('hidden');
    }

    if (cell.isFlagged) {
      classes.push('flagged');
      // Add class for incorrectly flagged cells (flagged but not a mine) when game is lost
      if (gameStatus === 'lost' && !cell.isMine) {
        classes.push('incorrect-flag');
      }
    }

    // Add disabled class when game is over
    if (gameStatus === 'lost' || gameStatus === 'won') {
      classes.push('disabled');
    }

    return classes.join(' ');
  };

  return (
    <div
      className={getCellClassName()}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {getCellContent()}
    </div>
  );
};

export default Cell;
