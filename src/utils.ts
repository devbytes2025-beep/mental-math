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

/**
 * Enterprise client-side low-latency synthesized audio feedback engine.
 * Leverages the browser's Web Audio API for zero-dependency sound effects,
 * fully configurable and safely volume-controlled to prevent fatigue.
 */
class AudioFeedbackEngine {
  private ctx: AudioContext | null = null;
  private isMutedState: boolean = false;

  constructor() {
    this.isMutedState = localStorage.getItem('mindmath-audio') === 'muted';
  }

  public setMuted(muted: boolean) {
    this.isMutedState = muted;
    localStorage.setItem('mindmath-audio', muted ? 'muted' : 'unmuted');
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  private initCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playTick() {
    if (this.isMutedState) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio feedback context blocked', e);
    }
  }

  public playCorrect() {
    if (this.isMutedState) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      // Two-note bright ascending chime
      const triggerTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.04, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      triggerTone(659.25, now, 0.08); // E5
      triggerTone(880.00, now + 0.06, 0.15); // A5
    } catch (e) {
      console.warn('Audio blocked', e);
    }
  }

  public playIncorrect() {
    if (this.isMutedState) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.16);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn('Audio blocked', e);
    }
  }

  public playFanfare() {
    if (this.isMutedState) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      const triggerTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.05, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      triggerTone(261.63, now, 0.12); // C4
      triggerTone(329.63, now + 0.06, 0.12); // E4
      triggerTone(392.00, now + 0.12, 0.12); // G4
      triggerTone(523.25, now + 0.18, 0.25); // C5
    } catch (e) {
      console.warn('Audio blocked', e);
    }
  }
}

export const audioFeedback = new AudioFeedbackEngine();

export function getStreak(records: { date: string }[]): number {
  if (records.length === 0) return 0;

  // Set of formatted local date strings 'YYYY-MM-DD'
  const dates = new Set(
    records.map(r => {
      const d = new Date(r.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  );

  const getLocalDateString = (dateVal: Date) => 
    `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`;

  let current = new Date();
  let streak = 0;
  const todayStr = getLocalDateString(current);

  // If today isn't in records, check if yesterday was. Otherwise streak is broken (0).
  if (!dates.has(todayStr)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    if (!dates.has(yesterdayStr)) {
      return 0;
    }
    current = yesterday;
  }

  while (true) {
    const checkStr = getLocalDateString(current);
    if (dates.has(checkStr)) {
      streak++;
      // Decrement one day
      current = new Date(current);
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export interface LevelDetails {
  level: number;
  title: string;
  nextAt: number;
  percent: number;
  desc: string;
}

export function getLevelDetails(sessionCount: number): LevelDetails {
  if (sessionCount < 3) {
    return {
      level: 1,
      title: 'Novice Calculator',
      nextAt: 3,
      percent: (sessionCount / 3) * 100,
      desc: `Complete ${3 - sessionCount} more sessions for Lvl 2`,
    };
  }
  if (sessionCount < 8) {
    return {
      level: 2,
      title: 'Operand Beginner',
      nextAt: 8,
      percent: ((sessionCount - 3) / 5) * 100,
      desc: `Complete ${8 - sessionCount} more sessions for Lvl 3`,
    };
  }
  if (sessionCount < 15) {
    return {
      level: 3,
      title: 'Deduction Apprentice',
      nextAt: 15,
      percent: ((sessionCount - 8) / 7) * 100,
      desc: `Complete ${15 - sessionCount} more sessions for Lvl 4`,
    };
  }
  if (sessionCount < 30) {
    return {
      level: 4,
      title: 'Fluent Latency Solver',
      nextAt: 30,
      percent: ((sessionCount - 15) / 15) * 100,
      desc: `Complete ${30 - sessionCount} more sessions for Lvl 5`,
    };
  }
  if (sessionCount < 50) {
    return {
      level: 5,
      title: 'Arithmetic Adept',
      nextAt: 50,
      percent: ((sessionCount - 30) / 20) * 100,
      desc: `Complete ${50 - sessionCount} more sessions for Lvl 6`,
    };
  }
  return {
    level: 6,
    title: 'Quantum Latency Master',
    nextAt: 999,
    percent: 100,
    desc: 'Top-tier processing latency certification active!',
  };
}
