import React, { useState, useEffect, useCallback } from 'react';
import { Board } from './components/Board';
import { GameControls } from './components/GameControls';
import { Player, GameState, GameMode } from './types';
import { INITIAL_BOARD } from './constants';
import { calculateWinner } from './services/gameLogic';
import { getAIMove } from './services/geminiService';
import { Sparkles, BrainCircuit, MessageSquareQuote, Wifi, Trophy, Bot } from 'lucide-react';

const App: React.FC = () => {
  // Game State
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.LOCAL_PVP);
  const [difficulty, setDifficulty] = useState<string>('easy');
  const [board, setBoard] = useState<Player[]>(INITIAL_BOARD);
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  
  // AI State
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [aiComment, setAiComment] = useState<string | null>(null);
  
  // Scores
  const [scores, setScores] = useState({ player1: 0, player2: 0, draws: 0 });

  // Reset Logic
  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD);
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setAiComment(null);
    setIsThinking(false);
  }, []);

  // Mode Change Handler
  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    resetGame();
    // Optionally reset scores on mode change, but keeping them persistent is often preferred in session
    setScores({ player1: 0, player2: 0, draws: 0 });
  };

  const handleDifficultyChange = (diff: string) => {
    setDifficulty(diff);
    resetGame();
  };

  // Update Scores
  useEffect(() => {
    if (winner) {
      setScores(prev => {
        if (winner === 'X') return { ...prev, player1: prev.player1 + 1 };
        if (winner === 'O') return { ...prev, player2: prev.player2 + 1 };
        if (winner === 'DRAW') return { ...prev, draws: prev.draws + 1 };
        return prev;
      });
    }
  }, [winner]);

  // Check for winner on board change
  useEffect(() => {
    const result = calculateWinner(board);
    setWinner(result.winner);
    setWinningLine(result.line);
  }, [board]);

  // AI Turn Effect
  useEffect(() => {
    const makeAIMove = async () => {
      if (
        gameMode === GameMode.VS_AI &&
        !isXNext && 
        !winner && 
        !isThinking
      ) {
        setIsThinking(true);
        try {
          // Small artificial delay for UX if the API is too fast, allows user to register their own move visually
          await new Promise(resolve => setTimeout(resolve, 600));
          
          const response = await getAIMove(board, difficulty);
          
          if (response.moveIndex >= 0 && response.moveIndex < 9 && board[response.moveIndex] === null) {
            const newBoard = [...board];
            newBoard[response.moveIndex] = 'O';
            setBoard(newBoard);
            setIsXNext(true);
            setAiComment(response.comment);
          }
        } catch (err) {
          console.error("AI Failed to move", err);
          // Fallback: random move if not handled in service
        } finally {
          setIsThinking(false);
        }
      }
    };

    makeAIMove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, isXNext, winner, gameMode, difficulty]); 
  // Removed isThinking from deps to avoid double trigger, though logic guard prevents it.

  // Handle Click
  const handleClick = (i: number) => {
    // Prevent move if square filled, game over, or it's AI's turn
    if (board[i] || winner || (gameMode === GameMode.VS_AI && !isXNext && isThinking)) {
      return;
    }

    const newBoard = [...board];
    newBoard[i] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex flex-col items-center justify-center p-4 sm:p-8">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30">
          <Sparkles className="w-5 h-5 text-indigo-400 mr-2" />
          <span className="text-indigo-300 font-medium text-sm tracking-wide">POWERED BY GEMINI 2.5</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 mb-2">
          Tic Tac Toe
        </h1>
        <p className="text-slate-400">
          {gameMode === GameMode.VS_AI ? 'Challenge the AI Intelligence' : 'Local Multiplayer Battle'}
        </p>
      </header>

      <main className="flex flex-col lg:flex-row items-start gap-8 sm:gap-12 w-full max-w-5xl justify-center">
        
        {/* Left Column: Board & Status */}
        <div className="flex flex-col items-center gap-6 flex-1 w-full">
          <div className="relative">
            <Board 
              squares={board} 
              onClick={handleClick} 
              winningLine={winningLine}
              disabled={!!winner || (gameMode === GameMode.VS_AI && !isXNext)}
            />
            
            {/* Status Indicator Overlay or Bottom Text */}
            <div className="mt-6 text-center h-8">
              {winner ? (
                <div className="flex items-center justify-center gap-2 text-xl font-bold animate-in fade-in slide-in-from-bottom-4">
                   {winner === 'DRAW' ? (
                     <span className="text-slate-300">It's a Draw!</span>
                   ) : (
                     <>
                       <span className={winner === 'X' ? 'text-cyan-400' : 'text-fuchsia-400'}>
                         {winner === 'X' ? (gameMode === GameMode.LOCAL_PVP ? 'Player X' : 'You') : (gameMode === GameMode.LOCAL_PVP ? 'Player O' : 'Gemini')}
                       </span>
                       <span className="text-white">Wins!</span>
                       <Trophy className="text-yellow-400 w-6 h-6 ml-1" />
                     </>
                   )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-lg font-medium text-slate-300">
                  {gameMode === GameMode.VS_AI && !isXNext ? (
                    <>
                      <BrainCircuit className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                      <span className="animate-pulse">Gemini is thinking...</span>
                    </>
                  ) : (
                    <>
                      <span className={isXNext ? 'text-cyan-400' : 'text-fuchsia-400'}>
                        {isXNext ? (gameMode === GameMode.LOCAL_PVP ? "Player X's" : "Your") : "Player O's"}
                      </span>
                      <span>Turn</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Chat */}
        <div className="flex flex-col gap-6 w-full lg:w-auto lg:min-w-[350px]">
          <GameControls 
            gameMode={gameMode}
            setGameMode={handleModeChange}
            difficulty={difficulty}
            setDifficulty={handleDifficultyChange}
            onReset={resetGame}
            scores={scores}
          />

          {/* AI Commentary Box */}
          {gameMode === GameMode.VS_AI && (
            <div className="w-full max-w-md bg-slate-800/40 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500 opacity-50"></div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
                  <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Gemini Live Status</span>
                  <p className="text-sm text-slate-300 italic leading-relaxed min-h-[3rem]">
                    {isThinking ? (
                      <span className="opacity-70">Analyzing winning probabilities...</span>
                    ) : aiComment ? (
                      `"${aiComment}"`
                    ) : (
                      "Ready to play. Your move!"
                    )}
                  </p>
                </div>
              </div>
              {/* Pseudo-connectivity indicator */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-40">
                <Wifi size={12} className="text-green-400" />
                <span className="text-[10px] font-mono text-green-400">CONNECTED</span>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;