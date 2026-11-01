/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SpinResult, Player } from '../types/pirinola';
import { X, History, Trophy, RotateCcw } from 'lucide-react';

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SpinResult[];
  players: Player[];
  onClearHistory: () => void;
}

export const GameHistoryModal: React.FC<GameHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  players,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const totalDrinksTaken = players.reduce((sum, p) => sum + p.drinksTaken, 0);

  // Sorted players by drinks taken
  const sortedPlayers = [...players].sort((a, b) => b.drinksTaken - a.drinksTaken);
  const leader = sortedPlayers[0]?.drinksTaken > 0 ? sortedPlayers[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                Historial y Marcador de Fiesta
              </h2>
              <p className="text-xs text-slate-400">
                Registro de tiros y tragos de la noche
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Tiros Totales</div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                {history.length}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Tragos de la Mesa</div>
              <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                {totalDrinksTaken} 🥃
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Más Tomador(a)</span>
              </div>
              <div className="text-sm font-bold text-white truncate mt-0.5">
                {leader ? `${leader.name} (${leader.drinksTaken})` : 'Aún ninguno'}
              </div>
            </div>
          </div>

          {/* History Log */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Últimos Tiros
              </span>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar Historial</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/80">
                Aún no se ha realizado ningún giro. ¡Haz girar la pirinola!
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.option.color }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-white truncate">
                          {item.option.text}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.player ? `Giro: ${item.player.name}` : 'Giro libre'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.option.drinks > 0 && (
                        <span className="font-mono text-xs text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          +{item.option.drinks} 🥃
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
