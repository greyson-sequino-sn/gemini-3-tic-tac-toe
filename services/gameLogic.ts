import { WINNING_LINES } from '../constants';
import { Player } from '../types';

export function calculateWinner(squares: Player[]): { winner: Player | 'DRAW' | null; line: number[] | null } {
  for (let i = 0; i < WINNING_LINES.length; i++) {
    const [a, b, c] = WINNING_LINES[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: WINNING_LINES[i] };
    }
  }

  if (!squares.includes(null)) {
    return { winner: 'DRAW', line: null };
  }

  return { winner: null, line: null };
}

export function isMoveValid(squares: Player[], index: number): boolean {
  return squares[index] === null;
}
