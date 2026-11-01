/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, BellRing, Settings } from 'lucide-react';
import { playTimerTick, playTimerAlarm } from '../utils/audio';

interface DrinkTimerProps {
  autoStartOnResult: boolean;
  onToggleAutoStart: () => void;
  lastResultEventTime?: number;
  triggerSeconds?: number;
}

export const DrinkTimer: React.FC<DrinkTimerProps> = ({
  autoStartOnResult,
  onToggleAutoStart,
  lastResultEventTime,
  triggerSeconds = 10,
}) => {
  const [initialSeconds, setInitialSeconds] = useState(10);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [bombMode, setBombMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const prevEventTimeRef = useRef<number | undefined>(lastResultEventTime);

  // Trigger automatically when a spin result occurs if auto-start is enabled
  useEffect(() => {
    if (
      lastResultEventTime &&
      lastResultEventTime !== prevEventTimeRef.current &&
      autoStartOnResult
    ) {
      prevEventTimeRef.current = lastResultEventTime;
      setSecondsLeft(triggerSeconds || initialSeconds);
      setIsRunning(true);
      setIsFinished(false);
    }
  }, [lastResultEventTime, autoStartOnResult, triggerSeconds, initialSeconds]);

  // Timer Tick Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            playTimerAlarm();
            return 0;
          }
          const next = prev - 1;
          playTimerTick(next <= 3);
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const handleStart = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(initialSeconds);
    }
    setIsRunning(true);
    setIsFinished(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = (newSec?: number) => {
    const s = newSec !== undefined ? newSec : initialSeconds;
    setIsRunning(false);
    setSecondsLeft(s);
    setIsFinished(false);
  };

  const selectPreset = (sec: number) => {
    setInitialSeconds(sec);
    handleReset(sec);
  };

  // SVG circular progress calculation
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = secondsLeft / (initialSeconds || 1);
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Temporizador de Tragos</span>
              {bombMode && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Modo Bomba
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Tiempo para tomar el trago o cumplir el reto
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded-lg border text-slate-400 hover:text-white transition-colors ${
            showSettings
              ? 'bg-slate-800 border-amber-500/50 text-amber-400'
              : 'border-slate-800 hover:bg-slate-800/60'
          }`}
          title="Ajustes del temporizador"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Timer Display & Circular Ring */}
      <div className="flex items-center justify-center gap-6 py-1">
        {/* Progress Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgba(51, 65, 85, 0.4)"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Dynamic progress ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={
                isFinished
                  ? '#EF4444'
                  : secondsLeft <= 3
                  ? '#F43F5E'
                  : secondsLeft <= 5
                  ? '#F59E0B'
                  : '#10B981'
              }
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300"
            />
          </svg>

          {/* Large tabular time number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className={`font-mono text-3xl font-extrabold tabular-nums tracking-tighter ${
                isFinished
                  ? 'text-rose-500 animate-bounce'
                  : secondsLeft <= 3
                  ? 'text-rose-400 animate-pulse'
                  : 'text-white'
              }`}
            >
              {secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              segundos
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-emerald-950 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{secondsLeft === 0 ? 'Repetir' : 'Iniciar'}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs tracking-wide transition-all shadow-md active:scale-95"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </button>
            )}

            <button
              onClick={() => handleReset()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title="Reiniciar contador"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1">
            {[5, 10, 15, 30].map((sec) => (
              <button
                key={sec}
                onClick={() => selectPreset(sec)}
                className={`px-2 py-1 text-xs font-mono rounded-lg transition-colors border ${
                  initialSeconds === sec
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : 'bg-slate-800/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Finished State Alert */}
      {isFinished && (
        <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 flex items-center justify-between gap-2 text-xs animate-shake">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-rose-400 animate-spin" />
            <span className="font-bold">
              {bombMode
                ? '¡BOMBA EXPLOTÓ! 💥 Quien tenga el turno toma DOBLE'
                : '¡TIEMPO CUMPLIDO! 🚨 Si no terminaste, ¡castigo!'}
            </span>
          </div>
          <button
            onClick={() => handleReset()}
            className="text-[11px] underline font-semibold text-rose-200 hover:text-white"
          >
            Listo
          </button>
        </div>
      )}

      {/* Expandable settings */}
      {showSettings && (
        <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span>Inicio automático al girar:</span>
            <button
              onClick={onToggleAutoStart}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                autoStartOnResult ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  autoStartOnResult ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span>Modo Bomba / Papa Caliente:</span>
            <button
              onClick={() => setBombMode(!bombMode)}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                bombMode ? 'bg-rose-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  bombMode ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            En modo automático, cada vez que la pirinola cae en un resultado (como "Toma 2 tragos" o "Todos toman"), la cuenta regresiva comienza de inmediato.
          </p>
        </div>
      )}
    </div>
  );
};
