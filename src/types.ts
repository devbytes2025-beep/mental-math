/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type Difficulty = '1-digit' | '2-digits' | '3-digits' | 'intermediate' | 'advanced';
export type GameMode = 'input' | 'multiple-choice';
export type ChallengeType = 'sprint' | 'survival';

export interface GameSettings {
  operation: Operation;
  questionCount: number;
  difficulty: Difficulty;
  mode: GameMode;
  challengeType: ChallengeType;
}

export interface Question {
  text: string;
  answer: number;
  options?: number[];
  userAnswer?: string;
  isCorrect?: boolean;
  solveTime?: number; // reaction time for this specific question
}

export interface GameRecord {
  operation: Operation;
  questionCount: number;
  difficulty: Difficulty;
  mode: GameMode;
  challengeType?: ChallengeType;
  bestTime: number; // in seconds (for sprint) or high score count (for survival)
  lastTime: number; // last performance metric
  date: string;
}

export type GameState = 'menu' | 'config' | 'countdown' | 'playing' | 'results';
