import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

type Player = 'X' | 'O' | null;
type BoardState = Player[];

interface GameResult {
  winner: Player | 'Draw';
  line: number[] | null;
}

const App: React.FC = () => {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [scores, setScores] = useState({ X: 0, O: 0, Draw: 0 });
  const [isAiMode, setIsAiMode] = useState<boolean>(true);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const calculateWinner = useCallback((squares: BoardState): GameResult | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }

    if (!squares.includes(null)) {
      return { winner: 'Draw', line: null };
    }

    return null;
  }, []);

  const minimax = useCallback((squares: BoardState, depth: number, isMaximizing: boolean): number => {
    const result = calculateWinner(squares);
    if (result) {
      if (result.winner === 'O') return 10 - depth;
      if (result.winner === 'X') return depth - 10;
      return 0;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          const score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          const score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }, [calculateWinner]);

  const getBestMove = useCallback((squares: BoardState): number => {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        const score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }, [minimax]);

  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      setWinningLine(result.line);
      if (result.winner === 'Draw') {
        setGameStatus("It's a Draw!");
        setScores(s => ({ ...s, Draw: s.Draw + 1 }));
      } else {
        setGameStatus(`Player ${result.winner} Wins!`);
        setScores(s => {
          const winner = result.winner as 'X' | 'O';
          return { ...s, [winner]: s[winner] + 1 };
        });
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f3ff', '#ff00ff', '#9d00ff']
        });
      }
      return;
    }

    if (isAiMode && !xIsNext) {
      const timer = setTimeout(() => {
        const move = getBestMove([...board]);
        if (move !== -1) {
          const newBoard = [...board];
          newBoard[move] = 'O';
          setBoard(newBoard);
          setXIsNext(true);
        }
      }, 600);
      return () => clearTimeout(timer);
    }

    setGameStatus(`Next player: ${xIsNext ? 'X' : 'O'}`);
  }, [board, xIsNext, isAiMode, calculateWinner, getBestMove]);

  const handleClick = (i: number) => {
    if (calculateWinner(board) || board[i]) return;
    if (isAiMode && !xIsNext) return;

    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinningLine(null);
    setGameStatus('');
  };

  const toggleAi = () => {
    setIsAiMode(!isAiMode);
    resetGame();
  };

  return (
    <div className="game-container">
      <h1>Tic Tac Toe</h1>
      
      <div className="scoreboard">
        <div className="score-item">
          <span className="score-label">Player X</span>
          <span className="score-value">{scores.X}</span>
        </div>
        <div className="score-item">
          <span className="score-label">Draw</span>
          <span className="score-value" style={{ color: 'var(--text-color)', textShadow: 'none' }}>{scores.Draw}</span>
        </div>
        <div className="score-item">
          <span className="score-label">{isAiMode ? 'AI (O)' : 'Player O'}</span>
          <span className="score-value">{scores.O}</span>
        </div>
      </div>

      <div className="board">
        {board.map((square, i) => (
          <div
            key={i}
            className={`square ${square ? square.toLowerCase() : ''} ${winningLine?.includes(i) ? 'winning' : ''}`}
            onClick={() => handleClick(i)}
          >
            {square}
          </div>
        ))}
      </div>

      <div className="status-msg">{gameStatus}</div>

      <div className="controls">
        <button className="cyber-btn" onClick={resetGame}>Reset Grid</button>
        <button className="cyber-btn secondary" onClick={toggleAi}>
          {isAiMode ? 'Switch to PvP' : 'Switch to PvE'}
        </button>
      </div>
    </div>
  );
};

export default App;
