import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';
import Board from './Board';
import { GameState, DIFFICULTIES, Difficulty } from '../types/minesweeper';
import {
  initializeGame,
  placeMines,
  revealCell,
  toggleFlag,
  checkWinCondition,
  countFlags,
  revealAllMines,
  flagAllMines,
} from '../utils/gameLogic';
import { useTranslation } from '../contexts/TranslationContext';
import './Minesweeper.css';

// Theme keys
const THEMES = ['classic', 'light', 'dark', 'very-dark'] as const;

type ThemeKey = typeof THEMES[number];

const Minesweeper: React.FC = () => {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES.beginner);
  const [gameState, setGameState] = useState<GameState>(initializeGame(difficulty));
  const [firstClick, setFirstClick] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isClicking, setIsClicking] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState<string | null>(null);
  const [isMacOS, setIsMacOS] = useState(false);
  const [theme, setTheme] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem('minesweeper-theme') as ThemeKey | null;
    return saved && THEMES.includes(saved) ? saved : 'dark';
  });
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Detect platform on mount
  useEffect(() => {
    try {
      const p = platform();
      setIsMacOS(p === 'macos');
    } catch {
      setIsMacOS(false);
    }
  }, []);

  useEffect(() => {
    let interval: number | undefined;

    if (gameState.gameStatus === 'playing' && gameState.startTime) {
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime!) / 1000);
        setTimer(Math.min(elapsed, 9999));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameState.gameStatus, gameState.startTime]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Hide game message after 5 seconds
  useEffect(() => {
    if (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
      setShowMessage(true);
      const timeout = setTimeout(() => {
        setShowMessage(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [gameState.gameStatus]);

  // Apply theme to document and persist to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('minesweeper-theme', theme);
  }, [theme]);

  const resetGame = () => {
    setGameState(initializeGame(difficulty));
    setFirstClick(true);
    setTimer(0);
  };

  const handleLeftClick = (row: number, col: number) => {
    if (gameState.gameStatus !== 'playing') return;

    let newBoard = gameState.board;

    // First click - place mines
    if (firstClick) {
      newBoard = placeMines(gameState.board, gameState.mineCount, row, col);
      setFirstClick(false);
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        startTime: Date.now(),
      }));
    }

    // Reveal cell
    newBoard = revealCell(newBoard, row, col);
    const cell = newBoard[row][col];

    // Check if mine was clicked
    if (cell.isMine) {
      const revealedBoard = revealAllMines(newBoard, row, col);
      setGameState(prev => ({
        ...prev,
        board: revealedBoard,
        gameStatus: 'lost',
        endTime: Date.now(),
      }));
      return;
    }

    // Check win condition
    if (checkWinCondition(newBoard, gameState.mineCount)) {
      const flaggedBoard = flagAllMines(newBoard);
      const newFlagCount = countFlags(flaggedBoard);
      setGameState(prev => ({
        ...prev,
        board: flaggedBoard,
        flagCount: newFlagCount,
        gameStatus: 'won',
        endTime: Date.now(),
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      board: newBoard,
    }));
  };

  const handleRightClick = (row: number, col: number) => {
    if (gameState.gameStatus !== 'playing' || firstClick) return;

    const newBoard = toggleFlag(gameState.board, row, col);
    const flagCount = countFlags(newBoard);

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      flagCount,
    }));
  };

  const isGameOngoing = () => {
    // Game is ongoing if it started (not first click) and still playing
    return !firstClick && gameState.gameStatus === 'playing';
  };

  const handleDifficultyChange = (difficultyKey: string) => {
    // Check if game is ongoing and difficulty is different
    const currentDifficultyKey = Object.keys(DIFFICULTIES).find(key => DIFFICULTIES[key] === difficulty);
    if (isGameOngoing() && difficultyKey !== currentDifficultyKey) {
      setPendingDifficulty(difficultyKey);
      setShowConfirmDialog(true);
      setIsMenuOpen(false);
      return;
    }

    applyDifficultyChange(difficultyKey);
  };

  const applyDifficultyChange = async (difficultyKey: string) => {
    const newDifficulty = DIFFICULTIES[difficultyKey];
    setDifficulty(newDifficulty);
    setGameState(initializeGame(newDifficulty));
    setFirstClick(true);
    setTimer(0);
    setIsMenuOpen(false);
    setShowConfirmDialog(false);
    setPendingDifficulty(null);

    // Resize window to fit new difficulty
    await invoke('resize_window', { difficulty: difficultyKey });
  };

  const handleConfirmDifficultyChange = () => {
    if (pendingDifficulty) {
      applyDifficultyChange(pendingDifficulty);
    }
  };

  const handleCancelDifficultyChange = () => {
    setShowConfirmDialog(false);
    setPendingDifficulty(null);
  };

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleQuit = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    // Only start drag if clicking directly on the drag region (not on buttons)
    if ((e.target as HTMLElement).closest('button')) return;
    const appWindow = getCurrentWindow();
    await appWindow.startDragging();
  };

  const getStatusEmoji = () => {
    if (isClicking && gameState.gameStatus === 'playing') {
      return '😮';
    }

    switch (gameState.gameStatus) {
      case 'won':
        return '😎';
      case 'lost':
        return '😵';
      default:
        return '🙂';
    }
  };

  const formatMineCounter = (value: number): string => {
    // Clamp display value to -99 minimum (still track real value internally)
    const displayValue = Math.max(value, -99);

    if (displayValue < 0) {
      // For negative numbers: "-" + padded absolute value
      // e.g., -1 becomes "-01", -10 becomes "-10"
      return '-' + String(Math.abs(displayValue)).padStart(2, '0');
    } else {
      // For positive numbers: pad to 3 digits
      // e.g., 1 becomes "001", 10 becomes "010"
      return String(displayValue).padStart(3, '0');
    }
  };

  const formatTimer = (value: number): string => {
    // Clamp display value to 999 maximum (internally tracks up to 9999)
    const displayValue = Math.min(value, 999);
    return String(displayValue).padStart(3, '0');
  };

  const remainingMines = gameState.mineCount - gameState.flagCount;

  return (
    <div className={`minesweeper ${isMacOS ? 'macos' : ''}`}>
      <h1 onMouseDown={handleDragStart}>
        {/* macOS traffic lights on the left */}
        {isMacOS && (
          <div className="macos-traffic-lights">
            <button className="traffic-light close" onClick={handleQuit} title={t('window.close')} type="button">
              <svg width="6" height="6" viewBox="0 0 6 6">
                <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="traffic-light minimize" onClick={handleMinimize} title={t('window.minimize')} type="button">
              <svg width="8" height="2" viewBox="0 0 8 2">
                <rect width="8" height="1.5" rx="0.75" fill="currentColor"/>
              </svg>
            </button>
            <button className="traffic-light maximize" disabled title={t('window.maximize')} type="button">
              <svg width="6" height="6" viewBox="0 0 6 6">
                <path d="M0.5 2L3 0.5L5.5 2L5.5 5.5L0.5 5.5Z" stroke="currentColor" strokeWidth="1" fill="none"/>
              </svg>
            </button>
          </div>
        )}
        <span className="app-title">{t('app.title')}</span>
        <div className="header-actions">
          <div className="menu-container" ref={menuRef}>
            <button
              className="menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title={t('menu.label')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
            {isMenuOpen && (
              <div className="dropdown-menu">
                <div className="menu-section">
                  <div className="menu-label">{t('menu.difficulty')}</div>
                  <button
                    className={`menu-item ${Object.keys(DIFFICULTIES).find(key => DIFFICULTIES[key] === difficulty) === 'beginner' ? 'active' : ''}`}
                    onClick={() => handleDifficultyChange('beginner')}
                  >
                    <span className="menu-check">{Object.keys(DIFFICULTIES).find(key => DIFFICULTIES[key] === difficulty) === 'beginner' ? '✓' : ''}</span>
                    {t('difficulty.beginner')}
                  </button>
                  <button
                    className={`menu-item ${Object.keys(DIFFICULTIES).find(key => DIFFICULTIES[key] === difficulty) === 'intermediate' ? 'active' : ''}`}
                    onClick={() => handleDifficultyChange('intermediate')}
                  >
                    <span className="menu-check">{Object.keys(DIFFICULTIES).find(key => DIFFICULTIES[key] === difficulty) === 'intermediate' ? '✓' : ''}</span>
                    {t('difficulty.intermediate')}
                  </button>
                  <button
                    className={`menu-item ${Object.keys(DIFFICULTIES).find(key => DIFFICULTIES[key] === difficulty) === 'expert' ? 'active' : ''}`}
                    onClick={() => handleDifficultyChange('expert')}
                  >
                    <span className="menu-check">{Object.keys(DIFFICULTIES).find(key => DIFFICULTIES[key] === difficulty) === 'expert' ? '✓' : ''}</span>
                    {t('difficulty.expert')}
                  </button>
                </div>
                <div className="menu-divider" />
                <div className="menu-section">
                  <div className="menu-label">{t('menu.theme')}</div>
                  {THEMES.map((themeKey) => (
                    <button
                      key={themeKey}
                      className={`menu-item ${theme === themeKey ? 'active' : ''}`}
                      onClick={() => setTheme(themeKey)}
                    >
                      <span className="menu-check">{theme === themeKey ? '✓' : ''}</span>
                      {t(`theme.${themeKey}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Windows/Linux controls on the right */}
          {!isMacOS && (
            <div className="window-controls">
              <button className="window-control" onClick={handleMinimize} title={t('window.minimize')}>
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <rect width="10" height="1" x="1" y="6" fill="currentColor" />
                </svg>
              </button>
              <button className="window-control close" onClick={handleQuit} title={t('window.close')}>
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <polygon fill="currentColor" points="11 1.576 10.424 1 6 5.424 1.576 1 1 1.576 5.424 6 1 10.424 1.576 11 6 6.576 10.424 11 11 10.424 6.576 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </h1>

      <div className="game-container">

        <div className="game-info">
          <div className="info-item">
            <span className="info-label">{t('game.mines')}</span>
            <span className="info-value">{formatMineCounter(remainingMines)}</span>
          </div>

          <div className="status-face" onClick={resetGame}>
            {getStatusEmoji()}
          </div>

          <div className="info-item">
            <span className="info-label">{t('game.time')}</span>
            <span className="info-value">{formatTimer(timer)}</span>
          </div>
        </div>

        <Board
          board={gameState.board}
          onLeftClick={handleLeftClick}
          onRightClick={handleRightClick}
          onMouseDown={(e: React.MouseEvent) => {
            if (e.button === 0) setIsClicking(true);
          }}
          onMouseUp={(e: React.MouseEvent) => {
            if (e.button === 0) setIsClicking(false);
          }}
          onMouseLeave={() => setIsClicking(false)}
          gameStatus={gameState.gameStatus}
        />

        {gameState.gameStatus === 'won' && showMessage && (
          <div className="game-message win">
            {t('game.won', { time: timer })}
          </div>
        )}

        {gameState.gameStatus === 'lost' && showMessage && (
          <div className="game-message lose">
            {t('game.lost')}
          </div>
        )}
      </div>

      {showConfirmDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-title">{t('dialog.changeDifficulty.title')}</div>
            <div className="dialog-message">
              {t('dialog.changeDifficulty.message')}
            </div>
            <div className="dialog-buttons">
              <button className="dialog-button cancel" onClick={handleCancelDifficultyChange}>
                {t('dialog.changeDifficulty.cancel')}
              </button>
              <button className="dialog-button confirm" onClick={handleConfirmDifficultyChange}>
                {t('dialog.changeDifficulty.continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Minesweeper;
