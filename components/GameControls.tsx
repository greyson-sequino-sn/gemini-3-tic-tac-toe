import React from 'react';
import { GameMode } from '../types';
import { Users, Bot, RotateCcw, Globe } from 'lucide-react';
import { DIFFICULTIES } from '../constants';

interface GameControlsProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  difficulty: string;
  setDifficulty: (diff: string) => void;
  onReset: () => void;
  scores: { player1: number; player2: number; draws: number };
  isOnlineConnected?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({ 
  gameMode, 
  setGameMode, 
  difficulty,
  setDifficulty,
  onReset,
  scores,
  isOnlineConnected
}) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      {/* Score Board */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-slate-400">
            {gameMode === GameMode.LOCAL_PVP ? 'Player X' : 'You'}
          </span>
          <span className="text-2xl font-bold text-cyan-400">{scores.player1}</span>
        </div>
        <div className="flex flex-col border-x border-slate-800">
          <span className="text-xs uppercase tracking-wider text-slate-400">Draws</span>
          <span className="text-2xl font-bold text-slate-200">{scores.draws}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-slate-400">
            {gameMode === GameMode.LOCAL_PVP ? 'Player O' : (gameMode === GameMode.ONLINE ? 'Opponent' : 'Gemini')}
          </span>
          <span className="text-2xl font-bold text-fuchsia-400">{scores.player2}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
        <div className="flex gap-2">
          <button
            onClick={() => setGameMode(GameMode.LOCAL_PVP)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 text-sm sm:text-base rounded-lg transition-all ${
              gameMode === GameMode.LOCAL_PVP 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Users size={16} /> Local
          </button>
          <button
            onClick={() => setGameMode(GameMode.VS_AI)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 text-sm sm:text-base rounded-lg transition-all ${
              gameMode === GameMode.VS_AI 
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Bot size={16} /> AI
          </button>
          <button
            onClick={() => setGameMode(GameMode.ONLINE)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 text-sm sm:text-base rounded-lg transition-all ${
              gameMode === GameMode.ONLINE
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Globe size={16} /> Online
          </button>
        </div>

        {gameMode === GameMode.VS_AI && (
          <div className="flex gap-2">
             {DIFFICULTIES.map((diff) => (
               <button
                key={diff.id}
                onClick={() => setDifficulty(diff.id)}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  difficulty === diff.id
                    ? 'bg-slate-600 text-white ring-1 ring-slate-400'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                }`}
               >
                 {diff.name}
               </button>
             ))}
          </div>
        )}

        <button
          onClick={onReset}
          disabled={gameMode === GameMode.ONLINE && !isOnlineConnected}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all active:scale-95"
        >
          <RotateCcw size={18} /> Reset Game
        </button>
      </div>
    </div>
  );
};