/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PirinolaOption, Player } from '../types/pirinola';
import { playFanfare, playGlassClink } from '../utils/audio';
import { Beer, Wine, Users, ArrowLeft, ArrowRight, Crown, Sparkles, Timer, ArrowRightCircle } from 'lucide-react';

interface ResultBannerProps {
  result: PirinolaOption | null;
  currentPlayer: Player | null;
  players: Player[];
  currentPlayerIndex: number;
  onNextTurn: () => void;
  onStartTimer: () => void;
  onClose: () => void;
}

export const ResultBanner: React.FC<ResultBannerProps> = ({
  result,
  currentPlayer,
  players,
  currentPlayerIndex,
  onNextTurn,
  onStartTimer,
  onClose,
}) => {
  useEffect(() => {
    if (!result) return;

    if (result.target === 'all' || result.id === 'toma-todo' || result.drinks >= 2) {
      playFanfare();
      // Fire confetti
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#E11D48', '#3B82F6', '#10B981', '#EC4899'],
        });
      } catch {
        // Ignore
      }
    } else {
      playGlassClink();
    }
  }, [result]);

  if (!result) return null;

  // Resolve target player message
  const numPlayers = players.length;
  let targetDetails = result.description;

  if (numPlayers > 1 && currentPlayer) {
    if (result.target === 'left') {
      const leftIndex = (currentPlayerIndex + 1) % numPlayers;
      const leftPlayer = players[leftIndex];
      targetDetails = `👉 ¡${leftPlayer.name} debe beber ${result.drinks} trago(s)! (Sentado a la izquierda de ${currentPlayer.name})`;
    } else if (result.target === 'right') {
      const rightIndex = (currentPlayerIndex - 1 + numPlayers) % numPlayers;
      const rightPlayer = players[rightIndex];
      targetDetails = `👉 ¡${rightPlayer.name} debe beber ${result.drinks} trago(s)! (Sentado a la derecha de ${currentPlayer.name})`;
    } else if (result.target === 'current') {
      targetDetails = `👉 ¡${currentPlayer.name} debe beber ${result.drinks} trago(s)!`;
    } else if (result.target === 'all') {
      targetDetails = `👉 ¡TODOS los jugadores (${players.map((p) => p.name).join(', ')}) beben un trago juntos! ¡Salud!`;
    }
  }

  const renderIcon = () => {
    switch (result.iconName) {
      case 'Users':
        return <Users className="w-8 h-8 text-rose-300" />;
      case 'ArrowLeft':
        return <ArrowLeft className="w-8 h-8 text-blue-300" />;
      case 'ArrowRight':
        return <ArrowRight className="w-8 h-8 text-purple-300" />;
      case 'Crown':
        return <Crown className="w-8 h-8 text-amber-300" />;
      case 'Wine':
        return <Wine className="w-8 h-8 text-amber-300" />;
      case 'Sparkles':
        return <Sparkles className="w-8 h-8 text-cyan-300" />;
      default:
        return <Beer className="w-8 h-8 text-emerald-300" />;
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-2 rounded-2xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95"
      style={{ borderColor: result.color }}
    >
      {/* Background Decorative Color Glow */}
      <div
        className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: result.color }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/20"
            style={{ backgroundColor: result.color }}
          >
            {renderIcon()}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Resultado de la Pirinola
              </span>
              {result.drinks > 0 && (
                <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {result.drinks} {result.drinks === 1 ? 'trago' : 'tragos'} 🥃
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Outfit']">
              {result.text}
            </h2>

            <p className="text-sm font-medium text-slate-200 mt-0.5 max-w-xl">
              {targetDetails}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <button
            onClick={onStartTimer}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-amber-500/30 transition-colors shadow-sm"
          >
            <Timer className="w-4 h-4" />
            <span>Poner Tiempo</span>
          </button>

          <button
            onClick={() => {
              onNextTurn();
              onClose();
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-amber-950"
          >
            <span>Siguiente</span>
            <ArrowRightCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
