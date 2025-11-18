import React from 'react';
import { Player } from '../types';
import { X, Circle } from 'lucide-react';

interface SquareProps {
  value: Player;
  onClick: () => void;
  isWinningSquare: boolean;
  disabled: boolean;
}

export const Square: React.FC<SquareProps> = ({ value, onClick, isWinningSquare, disabled }) => {
  return (
    <button
      className={`
        h-24 w-24 sm:h-32 sm:w-32 
        flex items-center justify-center 
        rounded-xl text-4xl sm:text-5xl shadow-lg
        transition-all duration-300 ease-out transform
        ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-105 hover:bg-slate-700'}
        ${isWinningSquare ? 'bg-green-500/20 ring-4 ring-green-500 border-green-500' : 'bg-slate-800 border-slate-700'}
        border-2
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {value === 'X' && (
        <X 
          className={`w-16 h-16 sm:w-20 sm:h-20 text-cyan-400 animate-in zoom-in duration-200`} 
          strokeWidth={2.5}
        />
      )}
      {value === 'O' && (
        <Circle 
          className={`w-14 h-14 sm:w-18 sm:h-18 text-fuchsia-400 animate-in zoom-in duration-200`} 
          strokeWidth={2.5}
        />
      )}
    </button>
  );
};
