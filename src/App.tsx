/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Settings, 
  RotateCcw, 
  ArrowLeft, 
  Check, 
  X, 
  TrendingUp, 
  Trophy,
  Hash,
  Layers,
  Calculator,
  LayoutGrid,
  Keyboard,
  Menu as MenuIcon,
  Sun,
  Moon
} from 'lucide-react';
import { 
  GameState, 
  Operation, 
  GameSettings, 
  Question, 
  GameRecord,
  Difficulty,
  GameMode
} from './types';
import { generateQuestion, formatTime } from './utils';

const STORAGE_KEY = 'mental-math-records-v2';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [settings, setSettings] = useState<GameSettings>({
    operation: 'addition',
    questionCount: 10,
    difficulty: '2-digits',
    mode: 'input'
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const glassCardClass = theme === 'dark' ? 'glass-ui glass-card-dark' : 'glass-ui glass-card-light';
  const glassSidebarClass = theme === 'dark' ? 'glass-ui glass-sidebar-dark' : 'glass-ui glass-sidebar-light';

  // Load records and theme
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRecords(JSON.parse(saved));
    }
    const savedTheme = localStorage.getItem('mindmath-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  // Update document root class for Tailwind CSS theme changes
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing') {
      const start = performance.now();
      setStartTime(start);
      timerRef.current = window.setInterval(() => {
        setCurrentTime((performance.now() - start) / 1000);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Countdown logic
  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > -1) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        startGame();
      }
    }
  }, [gameState, countdown]);

  // Auto-focus input
  useEffect(() => {
    if (gameState === 'playing' && settings.mode === 'input' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, currentIndex, settings.mode]);

  const startGame = () => {
    const newQuestions = Array.from({ length: settings.questionCount }, () => 
      generateQuestion(settings.operation, settings.difficulty, settings.mode)
    );
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setGameState('playing');
    setCurrentTime(0);
    setUserInput('');
    setFeedback(null);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (settings.mode !== 'input') return;
    const value = e.target.value;
    setUserInput(value);

    if (value === '') {
      setFeedback(null);
      return;
    }

    const currentQuestion = questions[currentIndex];
    const userNum = parseInt(value);
    const answerStr = currentQuestion.answer.toString();

    // Correct answer - instant transition
    if (userNum === currentQuestion.answer) {
      setFeedback('correct');
      setTimeout(() => nextQuestion(true), 250);
    } 
    // Incorrect answer - if length matches or exceeds, show cross and SKIP
    else if (value.length >= answerStr.length) {
      setFeedback('incorrect');
      setTimeout(() => nextQuestion(false), 600);
    } else {
      setFeedback(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (settings.mode !== 'input') return;
    if (e.key === 'Enter' && userInput !== '') {
      const currentQuestion = questions[currentIndex];
      const isCorrect = parseInt(userInput) === currentQuestion.answer;
      if (!isCorrect) {
        setFeedback('incorrect');
        setTimeout(() => nextQuestion(false), 500);
      }
    }
  };

  const handleOptionClick = (option: number) => {
    if (settings.mode !== 'multiple-choice' || feedback !== null) return;
    const currentQuestion = questions[currentIndex];
    const isCorrect = option === currentQuestion.answer;
    
    setUserInput(option.toString());
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => nextQuestion(isCorrect), isCorrect ? 250 : 600);
  };

  const nextQuestion = (wasCorrect: boolean) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex] = {
      ...updatedQuestions[currentIndex],
      userAnswer: userInput,
      isCorrect: wasCorrect
    };
    setQuestions(updatedQuestions);
    setFeedback(null);
    setUserInput('');

    if (currentIndex < settings.questionCount - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    const finalTime = (performance.now() - startTime) / 1000;
    setEndTime(finalTime);
    setGameState('results');
    
    // Record tracking
    const recordKey = {
      operation: settings.operation,
      questionCount: settings.questionCount,
      difficulty: settings.difficulty,
      mode: settings.mode
    };

    const existingRecord = records.find(r => 
      r.operation === recordKey.operation && 
      r.questionCount === recordKey.questionCount && 
      r.difficulty === recordKey.difficulty &&
      r.mode === recordKey.mode
    );

    const isRecord = !existingRecord || finalTime < existingRecord.bestTime;
    setIsNewRecord(isRecord);

    if (isRecord) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#ffffff']
      });
    }

    const newRecord: GameRecord = {
      ...recordKey,
      bestTime: isRecord ? finalTime : existingRecord!.bestTime,
      lastTime: finalTime,
      date: new Date().toISOString()
    };

    const updatedRecords = existingRecord 
      ? records.map(r => r === existingRecord ? newRecord : r)
      : [...records, newRecord];
    
    setRecords(updatedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
  };

  const renderMenu = () => {
    // Helper to calculate the absolute best time for a given operation
    const getOpBestTime = (op: Operation) => {
      const opRecords = records.filter(r => r.operation === op);
      if (opRecords.length === 0) return null;
      return Math.min(...opRecords.map(r => r.bestTime));
    };

    const opBests = {
      addition: getOpBestTime('addition'),
      subtraction: getOpBestTime('subtraction'),
      multiplication: getOpBestTime('multiplication'),
      division: getOpBestTime('division'),
    };
    
    // Sort records chronologically (newest first)
    const recentRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Difficulties color highlights and glows meta
    const getDifficultyStyle = (diff: Difficulty) => {
      switch (diff) {
        case 'advanced':
          return {
            badge: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/40 text-[10px] font-black tracking-widest shadow-[0_0_12px_rgba(245,158,11,0.25)]',
            icon: '🔥',
            glow: 'rgba(245,158,11,0.06)',
            borderColor: 'border-amber-500/40 dark:border-amber-500/30'
          };
        case 'intermediate':
          return {
            badge: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 dark:border-cyan-500/40 text-[10px] font-bold tracking-wider',
            icon: '⚡',
            glow: 'rgba(6,182,212,0.04)',
            borderColor: 'border-cyan-500/30 dark:border-cyan-500/20'
          };
        case '3-digits':
          return {
            badge: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 dark:border-purple-500/40 text-[10px] font-bold tracking-wider',
            icon: '🧠',
            glow: 'rgba(168,85,247,0.04)',
            borderColor: 'border-purple-500/30 dark:border-purple-500/20'
          };
        case '2-digits':
          return {
            badge: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/30 text-[10px] font-semibold',
            icon: '🎯',
            glow: 'transparent',
            borderColor: 'border-indigo-500/10'
          };
        default: // '1-digit'
          return {
            badge: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/10 dark:border-slate-500/20 text-[10px] font-semibold',
            icon: '🌱',
            glow: 'transparent',
            borderColor: 'border-border/60'
          };
      }
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        {/* Welcome Dashboard Banner - Glassmorphism */}
        <div className={`relative overflow-hidden rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${glassCardClass}`}>
          <div className="absolute -right-16 -top-16 opacity-[0.06] dark:opacity-[0.03] pointer-events-none text-accent">
            <Calculator size={300} />
          </div>
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-3.5xl font-black tracking-tight text-text-primary leading-tight">
              Welcome to <span className="text-accent underline decoration-4 underline-offset-4 decoration-accent/30 font-display">MindMath</span>
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Enhance logic latency, reduce processing stress, and unlock high-speed numerical deduction.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 relative z-10 shrink-0">
            <div className="bg-bg/40 dark:bg-bg/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-border/80 flex flex-col min-w-[110px]">
              <span className="text-[9px] text-text-muted font-bold tracking-widest uppercase font-mono">Sessions Run</span>
              <span className="text-2.5xl font-black text-accent mt-0.5 tabular-nums">{records.length}</span>
            </div>
            
            {records.length > 0 && (
              <div className="bg-bg/40 dark:bg-bg/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-border/80 flex flex-col min-w-[110px]">
                <span className="text-[9px] text-text-muted font-bold tracking-widest uppercase font-mono">All-Time Best</span>
                <span className="text-2.5xl font-black text-correct mt-0.5 tabular-nums">
                  {Math.min(...records.map(r => r.bestTime)).toFixed(2)}s
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bento Grid Layout WITHOUT many rough rectangles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Operations Selection */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                 <Calculator size={14} className="text-accent" /> Choose Operation
               </h3>
               <span className="text-[10px] text-text-muted font-mono">Target to start training</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['addition', 'subtraction', 'multiplication', 'division'] as Operation[]).map((op) => {
                const best = opBests[op];
                return (
                  <button
                    key={op}
                    onClick={() => {
                      setSettings({ ...settings, operation: op });
                      setGameState('config');
                    }}
                    className={`group relative p-6 rounded-[1.75rem] flex flex-col gap-4 text-left transition-all duration-300 border hover:border-accent hover:shadow-[0_12px_32px_rgba(99,102,241,0.12)] cursor-pointer overflow-hidden hover:-translate-y-1 ${glassCardClass}`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/10 to-transparent rounded-tr-[1.75rem] group-hover:scale-125 transition-transform duration-500" />
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className={`w-11 h-11 rounded-xl bg-bg/50 border border-border/80 flex items-center justify-center text-2.5xl font-extrabold transition-all duration-300
                        ${op === 'addition' ? 'text-accent border-accent/20 group-hover:bg-accent group-hover:text-white' : ''}
                        ${op === 'subtraction' ? 'text-sky-400 border-sky-400/20 group-hover:bg-sky-400 group-hover:text-bg' : ''}
                        ${op === 'multiplication' ? 'text-violet-400 border-violet-400/20 group-hover:bg-violet-400 group-hover:text-bg' : ''}
                        ${op === 'division' ? 'text-emerald-400 border-emerald-400/20 group-hover:bg-emerald-400 group-hover:text-bg' : ''}
                      `}>
                        {op === 'addition' && '+'}
                        {op === 'subtraction' && '−'}
                        {op === 'multiplication' && '×'}
                        {op === 'division' && '÷'}
                      </div>
                      
                      {best !== null && (
                        <div className="font-mono text-[11px] flex items-center gap-1 text-correct bg-correct/5 dark:bg-correct/10 px-2.5 py-1 rounded-full border border-correct/20">
                          <Trophy size={11} />
                          <span className="font-black">{best.toFixed(1)}s</span>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 mt-1">
                      <span className="font-black text-xl capitalize text-text-primary group-hover:text-accent transition-colors block font-display">
                        {op}
                      </span>
                      <span className="text-xs text-text-secondary mt-1 block leading-normal">
                        {op === 'addition' && 'Maximize summation and mental carry performance'}
                        {op === 'subtraction' && 'Perfect complementary difference and speed checks'}
                        {op === 'multiplication' && 'Achieve reflex-speed tabular products'}
                        {op === 'division' && 'Master high-speed clean factor partitions'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session History panel with Dynamic Level Highlighting */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                 <TrendingUp size={14} className="text-accent" /> Practice History
               </h3>
               {recentRecords.length > 0 && (
                 <span className="text-[10px] text-text-muted font-mono">{recentRecords.length} records</span>
               )}
            </div>

            <div className={`rounded-[2rem] p-6 space-y-3.5 max-h-[460px] overflow-y-auto custom-scrollbar ${glassCardClass}`}>
              {recentRecords.length > 0 ? (
                recentRecords.map((r, i) => {
                  const isPB = r.lastTime <= r.bestTime + 0.005;
                  const diffStyle = getDifficultyStyle(r.difficulty);
                  
                  return (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        boxShadow: diffStyle.glow ? `0 4px 15px 0 ${diffStyle.glow}` : undefined,
                      }}
                      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-bg/40 dark:bg-bg/20 border transition-all duration-300 gap-4
                        ${diffStyle.borderColor} hover:border-accent hover:shadow-[0_4px_12px_rgba(99,102,241,0.08)]`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-bg border border-border/80 flex items-center justify-center text-2xl font-bold font-sans shrink-0
                          ${r.operation === 'addition' ? 'text-accent border-accent/20' : ''}
                          ${r.operation === 'subtraction' ? 'text-sky-400 border-sky-400/20' : ''}
                          ${r.operation === 'multiplication' ? 'text-violet-400 border-violet-400/20' : ''}
                          ${r.operation === 'division' ? 'text-emerald-400 border-emerald-400/20' : ''}
                        `}>
                          {r.operation === 'addition' && '+'}
                          {r.operation === 'subtraction' && '−'}
                          {r.operation === 'multiplication' && '×'}
                          {r.operation === 'division' && '÷'}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black capitalize text-text-primary">{r.operation}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase transition-colors flex items-center gap-1 ${diffStyle.badge}`}>
                              <span>{diffStyle.icon}</span>
                              <span>{r.difficulty.replace('-', ' ')}</span>
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-text-muted flex gap-2 items-center font-medium">
                            <span>{r.questionCount} Questions</span>
                            <span>•</span>
                            <span className="uppercase">{r.mode === 'input' ? 'Type' : 'Choice'}</span>
                            <span>•</span>
                            <span>{new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/20">
                        <div className="flex flex-col text-left sm:text-right">
                          <p className="text-[8px] text-text-muted uppercase font-bold tracking-widest font-mono">My Score</p>
                          <span className="font-mono text-sm font-black text-text-primary tabular-nums">
                            {r.lastTime.toFixed(2)}s
                          </span>
                        </div>

                        <div className="flex flex-col text-left sm:text-right min-w-[65px]">
                          <p className="text-[8px] text-text-muted uppercase font-bold tracking-widest font-mono">Best Score</p>
                          <span className="font-mono text-sm font-bold text-correct tabular-nums flex items-center sm:justify-end gap-0.5">
                            {r.bestTime.toFixed(2)}s
                          </span>
                        </div>
                        
                        <div className="shrink-0 sm:min-w-[40px] text-right">
                          {isPB ? (
                            <div className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 shadow-sm border border-amber-500/30 p-2 rounded-xl animate-pulse" title="Personal Best Record reached!">
                              <Trophy size={15} />
                            </div>
                          ) : (
                            <div className="text-text-muted/40 p-2 border border-transparent">
                              <Check size={15} />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-bg/50 flex items-center justify-center border border-border/80 mb-4 text-text-muted">
                    <TrendingUp size={24} />
                  </div>
                  <p className="text-text-primary text-sm font-bold">No Practice History Detected</p>
                  <p className="text-[11px] text-text-muted mt-1 max-w-[200px] mx-auto">Select any operation on the left to lock in parameters and start training.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderConfig = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-12"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setGameState('menu')}
          className="p-3 rounded-xl bg-bg/50 border border-border hover:bg-border transition-colors cursor-pointer text-text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-black capitalize tracking-tight font-display">{settings.operation}</h2>
          <p className="text-text-muted text-xs font-mono uppercase tracking-[0.2em] font-semibold">Configuration Phase</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-10">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-text-muted mb-6 px-1 flex items-center gap-2">
              <LayoutGrid size={13} className="text-accent" /> Configure Parameters
            </h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-mono font-bold">Questions</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map(count => (
                    <button
                      key={count}
                      onClick={() => setSettings({ ...settings, questionCount: count })}
                      className={`py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                        settings.questionCount === count ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25' : 'bg-bg/40 border-border/80 hover:border-accent/40 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-mono font-bold">Difficulty</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['1-digit', '2-digits', '3-digits', 'intermediate', 'advanced'] as Difficulty[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setSettings({ ...settings, difficulty: d })}
                      className={`py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border ${
                        settings.difficulty === d ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25' : 'bg-bg/40 border-border/80 hover:border-accent/40 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {d.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-mono font-bold">Input Method</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings({ ...settings, mode: 'input' })}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all cursor-pointer border ${
                      settings.mode === 'input' ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25' : 'bg-bg/40 border-border/80 hover:border-accent/40 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Keyboard size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Type Answer</span>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, mode: 'multiple-choice' })}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all cursor-pointer border ${
                      settings.mode === 'multiple-choice' ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25' : 'bg-bg/40 border-border/80 hover:border-accent/40 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <LayoutGrid size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Multiple Choice</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              setCountdown(3);
              setGameState('countdown');
            }}
            className="w-full py-5.5 bg-correct text-white font-black tracking-[0.25em] text-sm rounded-2xl shadow-xl shadow-correct/10 active:scale-[0.98] transition-all cursor-pointer hover:brightness-105"
          >
            LAUNCH SESSION
          </button>
        </section>

        <section className={`rounded-[2rem] p-10 flex flex-col relative group overflow-hidden ${glassCardClass}`}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Settings size={200} />
          </div>
          <div className="flex justify-between items-start mb-16 relative z-10">
            <div>
              <p className="text-[9px] text-text-muted font-mono mb-1 tracking-widest uppercase font-bold">Training Configuration Matrix</p>
              <h4 className="text-xl font-bold uppercase tracking-tight font-display">{settings.operation} // Level {settings.difficulty}</h4>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-10 relative z-10">
            <div className="flex flex-col items-center">
              <p className="text-7xl font-bold tracking-tighter mb-4 opacity-10 font-mono">X {settings.operation === 'addition' ? '+' : settings.operation === 'subtraction' ? '-' : settings.operation === 'multiplication' ? '×' : '÷'} Y</p>
              <div className="h-1.5 w-32 bg-accent/20 rounded-full" />
            </div>

            <div className="w-full max-w-[240px] space-y-4">
              {settings.mode === 'input' ? (
                <div className="flex flex-col gap-2">
                  <div className="h-12 w-full bg-bg/50 border border-border/80 rounded-xl animate-pulse" />
                  <p className="text-[9px] text-center text-text-muted uppercase tracking-widest font-mono">Input Terminal Active</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 opacity-30">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-bg/50 border border-border/80 rounded-xl" />)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="grid grid-cols-6 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-1 rounded transition-colors duration-500 bg-border`} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );

  const renderCountdown = () => (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <motion.div
        key={countdown}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="text-[12rem] font-black text-accent pointer-events-none italic"
      >
        {countdown === 0 ? "GO!" : (countdown === -1 ? "" : countdown)}
      </motion.div>
      <div className="flex flex-col items-center gap-3">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-xs uppercase tracking-[0.4em] text-text-muted mt-8 font-bold"
        >
          {countdown > 0 ? "Get Ready" : "Start!"}
        </motion.p>
        {countdown === 0 && (
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold tracking-tighter text-text-primary"
          >
            GO!
          </motion.p>
        )}
      </div>
    </div>
  );

  const renderPlaying = () => {
    const progress = ((currentIndex + 1) / settings.questionCount) * 105; // soft cap
    const currentQuestion = questions[currentIndex];
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-[2.5rem] p-10 md:p-16 flex flex-col relative overflow-hidden backdrop-blur-xl ${glassCardClass}`}>
          {/* Progress highlight */}
          <div className="absolute top-0 left-0 w-full h-[6px] bg-border/25">
            <motion.div 
              className="h-full bg-gradient-to-r from-accent to-correct shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.4, ease: "circOut" }}
            />
          </div>

          <div className="flex justify-between items-start mb-16 relative z-10">
            <div className="p-4 bg-bg/40 border border-border/80 rounded-2xl">
              <p className="text-[9px] text-text-muted font-mono mb-1 tracking-widest uppercase font-bold">Progress</p>
              <h4 className="text-2xl font-black flex items-baseline gap-1.5 tabular-nums">
                <span className="text-accent underline decoration-4 underline-offset-4">{currentIndex + 1}</span>
                <span className="text-text-muted text-xs font-normal">/ {settings.questionCount}</span>
              </h4>
            </div>
            <div className="text-right font-mono p-4 bg-bg/40 border border-border/80 rounded-2xl">
              <p className="text-[9px] text-text-muted tracking-widest uppercase font-bold">Session Timer</p>
              <p className="text-3xl font-black text-accent tabular-nums tracking-tighter">{currentTime.toFixed(2)}s</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-12 py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -15 }}
                transition={{ duration: 0.28, type: 'spring', damping: 14 }}
                className="text-7.5xl md:text-9.5xl font-black tracking-tighter text-center select-none font-display text-text-primary"
              >
                {currentQuestion?.text}
              </motion.div>
            </AnimatePresence>

            <div className="w-full max-w-[500px]">
              {settings.mode === 'input' ? (
                <div className="relative flex items-center justify-center">
                  <input
                    ref={inputRef}
                    type="number"
                    className={`w-full bg-bg/40 rounded-2xl border-2 text-center text-6xl font-mono py-8 pr-16 outline-none transition-all duration-300 shadow-inner tracking-wide ${
                      feedback === 'correct' ? 'border-correct text-correct shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-correct/5' : 
                      feedback === 'incorrect' ? 'border-incorrect text-incorrect animate-shake shadow-[0_0_30px_rgba(239,68,68,0.15)] bg-incorrect/5 font-bold' : 
                      'border-border/80 focus:border-accent focus:shadow-[0_0_25px_rgba(99,102,241,0.1)] font-bold'
                    }`}
                    value={userInput}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <AnimatePresence>
                      {feedback === 'correct' && (
                        <motion.div 
                          initial={{ scale: 0, rotate: -35 }} 
                          animate={{ scale: 1, rotate: 0 }} 
                          exit={{ scale: 0 }} 
                          className="text-correct"
                        >
                          <Check className="w-10 h-10 stroke-[4px]" />
                        </motion.div>
                      )}
                      {feedback === 'incorrect' && (
                        <motion.div 
                          initial={{ scale: 0, rotate: 35 }} 
                          animate={{ scale: 1, rotate: 0 }} 
                          exit={{ scale: 0 }} 
                          className="text-incorrect"
                        >
                          <X className="w-10 h-10 stroke-[4px]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion?.options?.map((opt, i) => {
                    const isAnswer = opt === currentQuestion.answer;
                    const isSelected = userInput === opt.toString();
                    
                    let btnClass = "bg-bg/40 border-border text-text-primary hover:border-accent";
                    if (feedback !== null) {
                       if (isAnswer) {
                         btnClass = "bg-correct/10 border-correct text-correct shadow-[0_0_20px_rgba(16,185,129,0.25)]";
                       } else if (isSelected && feedback === 'incorrect') {
                         btnClass = "bg-incorrect/10 border-incorrect text-incorrect shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-shake";
                       } else {
                         btnClass = "opacity-30 bg-bg/10 border-border/40 text-text-muted";
                       }
                    }
                    
                    return (
                      <motion.button
                        key={`${currentIndex}-${i}`}
                        whileHover={feedback === null ? { scale: 1.02 } : {}}
                        whileTap={feedback === null ? { scale: 0.96 } : {}}
                        onClick={() => handleOptionClick(opt)}
                        className={`relative py-8 md:py-10 rounded-2xl text-4xl md:text-5xl font-mono font-black border-2 transition-all flex items-center justify-center cursor-pointer shadow-lg ${btnClass}`}
                        disabled={feedback !== null}
                      >
                        <span className="relative z-10">{opt}</span>
                        <AnimatePresence>
                          {feedback !== null && isAnswer && (
                            <motion.div 
                              initial={{ scale: 0, rotate: -45 }} 
                              animate={{ scale: 1, rotate: 0 }} 
                              exit={{ scale: 0 }}
                              className="absolute right-4 top-4 bg-correct text-white p-1.5 rounded-full shadow-lg"
                            >
                              <Check size={14} className="stroke-[3px]" />
                            </motion.div>
                          )}
                          {feedback === 'incorrect' && isSelected && !isAnswer && (
                            <motion.div 
                              initial={{ scale: 0, rotate: 45 }} 
                              animate={{ scale: 1, rotate: 0 }} 
                              exit={{ scale: 0 }}
                              className="absolute right-4 top-4 bg-incorrect text-white p-1.5 rounded-full shadow-lg"
                            >
                              <X size={14} className="stroke-[3px]" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-center pt-8 border-t border-border/30">
            <div className="flex gap-4">
              <span className="text-[9px] text-text-secondary font-black font-mono uppercase tracking-[0.2em] bg-bg/40 px-5 py-2 rounded-full border border-border/80">
                {settings.operation}
              </span>
              <span className="text-[9px] text-text-secondary font-black font-mono uppercase tracking-[0.2em] bg-bg/40 px-5 py-2 rounded-full border border-border/80">
                {settings.difficulty}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const correctCount = questions.filter(q => q.isCorrect).length;
    const wrongCount = settings.questionCount - correctCount;
    const accuracy = questions.length > 0 ? (correctCount / settings.questionCount) * 100 : 0;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-12 pb-20"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-accent/40 mb-6"
            >
              <Trophy size={32} />
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-none text-text-primary font-display">Session Complete</h2>
            <p className="text-text-muted font-mono text-xs tracking-[0.3em] uppercase font-bold">Your Performance Metrics</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto shrink-0 z-10 relative">
            <button 
              onClick={() => {
                setCountdown(3);
                setGameState('countdown');
              }}
              className="flex-1 md:flex-none px-8 py-4.5 bg-accent text-white flex items-center justify-center gap-3 text-base font-bold rounded-2xl shadow-xl shadow-accent/25 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer border-none"
            >
              <RotateCcw size={18} /> RETRY
            </button>
            <button 
              onClick={() => setGameState('menu')}
              className="flex-1 md:flex-none px-8 py-4.5 bg-bg/40 border border-border/80 text-text-primary hover:border-accent flex items-center justify-center gap-3 text-base font-bold rounded-2xl shadow-md hover:bg-bg/60 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Calculator size={18} /> HOME
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`p-8 rounded-[2rem] border relative overflow-hidden transition-all duration-300 ${isNewRecord ? 'bg-amber-500/10 border-amber-500/40 dark:border-amber-500/30 text-text-primary shadow-[0_8px_32px_rgba(245,158,11,0.1)]' : `${glassCardClass} border-border/70`}`}
          >
            {isNewRecord && (
              <div className="absolute top-4 right-4 bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md animate-pulse">Personal Best</div>
            )}
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-4">Total Time</p>
            <span className="text-5xl font-black tracking-tight tabular-nums text-text-primary">{endTime.toFixed(2)}<span className="text-lg font-light text-text-muted ml-0.5">s</span></span>
            <div className="mt-4 h-1 w-full bg-border/20 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: '105%' }} transition={{ duration: 1.2 }} className="h-full bg-accent" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.38 }}
            className={`p-8 rounded-[2rem] border transition-all duration-300 ${glassCardClass} border-border/70`}
          >
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-4">Average Interval</p>
            <span className="text-4xl font-black tracking-tight tabular-nums text-text-primary">{(endTime / settings.questionCount).toFixed(2)}<span className="text-base font-light text-text-muted ml-0.5">s/q</span></span>
            <p className="text-[10px] text-text-muted mt-2 font-medium">Mean processing time per digit</p>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.44 }}
            className={`p-8 rounded-[2rem] border transition-all duration-300 ${glassCardClass} border-border/70`}
          >
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-4">Digit Dividends</p>
            <div className="flex gap-4 items-baseline">
              <span className="text-4xl font-black text-correct tabular-nums">{correctCount}<span className="text-xs font-bold text-text-muted ml-1">Ok</span></span>
              <span className="text-3xl font-black text-incorrect tabular-nums">{wrongCount}<span className="text-xs font-bold text-text-muted ml-1">Fail</span></span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`p-8 rounded-[2rem] border transition-all duration-300 ${glassCardClass} border-border/70`}
          >
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-4">Session Accuracy</p>
            <span className={`text-4xl md:text-5xl font-black tracking-tight tabular-nums ${accuracy === 100 ? 'text-correct' : 'text-text-primary'}`}>{accuracy.toFixed(0)}<span className="text-base font-light text-text-muted ml-0.5">%</span></span>
            <div className="flex gap-1 mt-4">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className={`h-1.5 flex-1 rounded-full ${i < (accuracy / 20) ? (accuracy === 100 ? 'bg-correct' : 'bg-accent') : 'bg-border/35'}`} />
               ))}
            </div>
          </motion.div>
        </div>

        <div className={`overflow-hidden rounded-[2rem] ${glassCardClass} border-border/70`}>
          <div className="p-6 border-b border-border/55 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted flex justify-between items-center bg-bg/20">
            <span className="flex items-center gap-2"><LayoutGrid size={12} /> Interval Analysis Matrix</span>
            <span className="text-accent underline">{settings.questionCount} Intervals Verified</span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-px bg-border/20">
            {questions.map((q, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + (i * 0.04) }}
                className={`aspect-square flex items-center justify-center relative group transition-all duration-300 ${q.isCorrect ? 'hover:bg-correct/5' : 'hover:bg-incorrect/5'}`}
              >
                <div className="text-[9px] absolute top-2.5 left-2.5 opacity-30 font-mono font-bold">{i + 1}</div>
                {q.isCorrect ? (
                  <div className="bg-correct/10 p-2.5 rounded-xl border border-correct/20 text-correct shadow-inner">
                    <Check size={18} className="stroke-[3.5px]" />
                  </div>
                ) : (
                  <div className="bg-incorrect/10 p-2.5 rounded-xl border border-incorrect/20 text-incorrect shadow-inner">
                    <X size={18} className="stroke-[3.5px]" />
                  </div>
                )}
                {/* Advanced Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-text-primary text-bg text-[10px] px-3 py-2 font-mono font-bold hidden group-hover:block whitespace-nowrap z-20 rounded-xl shadow-2xl mb-2 pointer-events-none border border-bg/10">
                   {q.text} = {q.answer}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-bg text-text-primary overflow-hidden relative">
      {/* Mobile Menu Trigger */}
      <div className="lg:hidden fixed top-6 left-6 z-50">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-3 rounded-2xl border border-border/80 shadow-xl text-accent cursor-pointer ${glassCardClass}`}
        >
          {sidebarOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile Overlay */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-40 w-80 p-10 flex flex-col shrink-0 transition-transform duration-500 ease-in-out
        ${sidebarOpen ? 'translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,0.5)]' : '-translate-x-full lg:translate-x-0'}
        ${glassSidebarClass}
      `}>
        <div className="flex items-center justify-between mb-16 px-2">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 180 }}
              className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center font-black text-xl text-white shadow-2xl shadow-accent/40"
            >
              Σ
            </motion.div>
            <div>
               <h1 className="text-xl font-black tracking-tighter leading-none text-text-primary">MindMath</h1>
               <p className="text-[9px] text-accent font-mono uppercase tracking-[0.25em] font-semibold mt-0.5">Math Training</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(nextTheme);
              localStorage.setItem('mindmath-theme', nextTheme);
            }}
            className="p-2.5 rounded-xl bg-bg/40 hover:bg-bg/65 border border-border/60 hover:border-accent/40 transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        
        <div className="space-y-14 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-2">
                 <Trophy size={12} /> Master Records
               </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {(['addition', 'subtraction', 'multiplication', 'division'] as Operation[]).map((op) => {
                const best = records.filter(r => r.operation === op).sort((a,b) => a.bestTime - b.bestTime)[0];
                return (
                  <div key={op} className="group relative flex justify-between items-center bg-sidebar/40 p-4 rounded-2xl border border-border/60 hover:border-accent/40 transition-all">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-xs text-text-muted group-hover:text-accent transition-colors">
                          {op === 'addition' && '+'}
                          {op === 'subtraction' && '−'}
                          {op === 'multiplication' && '×'}
                          {op === 'division' && '÷'}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-text-secondary capitalize">{op}</span>
                          {best && <span className="text-[9px] text-text-muted uppercase font-mono">{best.difficulty.replace('-', ' ')}</span>}
                       </div>
                    </div>
                    <span className={`font-mono text-sm font-black ${best ? 'text-correct underline decoration-2' : 'text-text-muted'}`}>
                      {best ? `${best.bestTime.toFixed(1)}s` : '--.-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8 px-2">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-2">
                 <TrendingUp size={12} /> Speed History
               </h2>
            </div>
            <div className="bg-bg/40 p-6 rounded-3xl border border-border/60">
              <div className="h-32 flex items-end gap-1.5">
                {[0.4, 0.7, 0.3, 0.9, 0.6, 0.5, 0.8, 0.4, 0.6, 1.0].map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    animate={{ height: `${h * 100}%` }}
                    transition={{ delay: i * 0.05, type: 'spring' }}
                    className={`w-full rounded-t-lg ${i === 9 ? 'bg-accent shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-accent/20 hover:bg-accent/50 transition-colors'}`}
                  />
                ))}
              </div>
              <p className="text-[10px] font-mono font-bold text-text-muted text-center mt-5 uppercase tracking-[0.2em]">Efficiency Tracker</p>
            </div>
          </section>
        </div>

        <div className="mt-auto pt-10">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-accent/10 p-6 rounded-[2rem] border border-accent/20 shadow-inner relative overflow-hidden group"
          >
            <div className="absolute -bottom-4 -right-4 text-accent/10 group-hover:scale-110 transition-transform duration-700">
               <Calculator size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-accent font-black uppercase tracking-widest">Active Streak</p>
                <div className="w-2.5 h-2.5 bg-correct rounded-full animate-ping shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
              </div>
              <p className="text-4xl font-black flex items-baseline gap-2">
                12 <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Days</span>
              </p>
              <div className="mt-4 pt-4 border-t border-accent/10 text-[9px] font-mono text-text-muted font-bold">REACH LEVEL 20 FOR BONUS</div>
            </div>
          </motion.div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05)_0%,transparent_50%)]">
        <div className="max-w-6xl mx-auto p-8 md:p-16">
          <AnimatePresence mode="wait">
            {gameState === 'menu' && renderMenu()}
            {gameState === 'config' && renderConfig()}
            {gameState === 'countdown' && renderCountdown()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'results' && renderResults()}
          </AnimatePresence>
        </div>
      </main>

      {/* Global CSS enhancements */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e222a; border-radius: 20px; transition: all 0.3s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }
        
        button, a, .cursor-pointer { cursor: pointer !important; }
        
        input[type="number"]::-webkit-inner-spin-button, 
        input[type="number"]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-15px); }
          75% { transform: translateX(15px); }
        }
        .animate-shake {
          animation: shake 0.25s cubic-bezier(.36,.07,.19,.97) both;
          transform: translate3d(0, 0, 0);
        }
      `}</style>
    </div>
  );
}
