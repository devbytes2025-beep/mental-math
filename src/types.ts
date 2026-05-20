/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type Difficulty = '1-digit' | '2-digits' | '3-digits' | 'intermediate' | 'advanced';
export type GameMode = 'input' | 'multiple-choice';

export interface GameSettings {
  operation: Operation;
  questionCount: number;
  difficulty: Difficulty;
  mode: GameMode;
}

export interface Question {
  text: string;
  answer: number;
  options?: number[];
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface GameRecord {
  operation: Operation;
  questionCount: number;
  difficulty: Difficulty;
  mode: GameMode;
  bestTime: number; // in seconds
  lastTime: number;
  date: string;
}

export type GameState = 'menu' | 'config' | 'countdown' | 'playing' | 'results';
