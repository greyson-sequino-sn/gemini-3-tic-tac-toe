import { Difficulty } from './types';

export const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const DIFFICULTIES: Difficulty[] = [
  { id: 'easy', name: 'Casual', description: 'Gemini plays for fun' },
  { id: 'hard', name: 'Grandmaster', description: 'Gemini plays to win' },
];

export const INITIAL_BOARD = Array(9).fill(null);
