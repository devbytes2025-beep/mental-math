/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Operation, Question, Difficulty, GameMode } from './types';

export function generateQuestion(operation: Operation, difficulty: Difficulty, mode: GameMode): Question {
  let a: number, b: number, text: string, answer: number;

  const getNum = (diff: Difficulty) => {
    let min: number, max: number;
    switch (diff) {
      case '1-digit': min = 1; max = 9; break;
      case '2-digits': min = 10; max = 99; break;
      case '3-digits': min = 100; max = 999; break;
      case 'intermediate': min = 10; max = 150; break;
      case 'advanced': min = 50; max = 999; break;
      default: min = 1; max = 9;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  switch (operation) {
    case 'addition':
      a = getNum(difficulty);
      b = getNum(difficulty);
      text = `${a} + ${b}`;
      answer = a + b;
      break;
    case 'subtraction':
      a = getNum(difficulty);
      b = getNum(difficulty);
      if (a < b) [a, b] = [b, a];
      text = `${a} - ${b}`;
      answer = a - b;
      break;
    case 'multiplication':
      if (difficulty === '1-digit') { a = getNum('1-digit'); b = getNum('1-digit'); }
      else if (difficulty === '2-digits') { a = getNum('2-digits'); b = Math.floor(Math.random() * 9) + 2; }
      else if (difficulty === '3-digits') { a = getNum('2-digits'); b = getNum('2-digits'); }
      else if (difficulty === 'intermediate') { a = Math.floor(Math.random() * 20) + 10; b = Math.floor(Math.random() * 12) + 2; }
      else { a = getNum('2-digits'); b = Math.floor(Math.random() * 20) + 10; }
      text = `${a} × ${b}`;
      answer = a * b;
      break;
    case 'division':
      if (difficulty === '1-digit') { b = Math.floor(Math.random() * 8) + 2; answer = Math.floor(Math.random() * 9) + 1; }
      else if (difficulty === '2-digits') { b = Math.floor(Math.random() * 9) + 2; answer = Math.floor(Math.random() * 20) + 5; }
      else if (difficulty === '3-digits') { b = Math.floor(Math.random() * 12) + 2; answer = Math.floor(Math.random() * 50) + 10; }
      else if (difficulty === 'intermediate') { b = Math.floor(Math.random() * 15) + 2; answer = Math.floor(Math.random() * 30) + 5; }
      else { b = Math.floor(Math.random() * 25) + 5; answer = Math.floor(Math.random() * 90) + 10; }
      a = b * answer;
      text = `${a} ÷ ${b}`;
      break;
    default:
      throw new Error('Invalid operation');
  }

  const question: Question = { text, answer };

  if (mode === 'multiple-choice') {
    const options = new Set<number>();
    options.add(answer);
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 10) + 1;
      const sign = Math.random() > 0.5 ? 1 : -1;
      const alt = Math.max(0, answer + offset * sign);
      options.add(alt);
    }
    question.options = Array.from(options).sort(() => Math.random() - 0.5);
  }

  return question;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
