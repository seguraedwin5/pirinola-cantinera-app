/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player } from '../types/pirinola';
import { Users, Plus, Trash2, ArrowRight, UserCheck, RotateCcw } from 'lucide-react';

interface PlayerManagerProps {
  players: Player[];
  currentPlayerIndex: number;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (id: string) => void;
  onSelectPlayer: (index: number) => void;
  onNextTurn: () => void;
  onResetDrinks: () => void;
}

const AVATAR_COLORS = [
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  currentPlayerIndex,
  onAddPlayer,
  onRemovePlayer,
  onSelectPlayer,
  onNextTurn,
  onResetDrinks,
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
      setIsAdding(false);
    }
  };

  const currentPlayer = players[currentPlayerIndex] || null;
  const numPlayers = players.length;

  // Calculate left and right neighbors in the circle
  // In a circle: Left is (index + 1) % N (clockwise)
  // Right is (index - 1 + N) % N (counter-clockwise)
  const leftNeighborIndex = numPlayers > 1 ? (currentPlayerIndex + 1) % numPlayers : null;
  const rightNeighborIndex =
    numPlayers > 1 ? (currentPlayerIndex - 1 + numPlayers) % numPlayers : null;

  const leftNeighbor = leftNeighborIndex !== null ? players[leftNeighborIndex] : null;
  const rightNeighbor = rightNeighborIndex !== null ? players[rightNeighborIndex] : null;

  const totalDrinksTable = players.reduce((acc, p) => acc + p.drinksTaken, 0);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <span>Jugadores en la Mesa</span>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                {numPlayers} {numPlayers === 1 ? 'jugador' : 'jugadores'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Orden de turno y vecinos para izquierda/derecha
            </p>
          </div>
        </div>

        {totalDrinksTable > 0 && (
          <button
            onClick={onResetDrinks}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
            title="Reiniciar contador de tragos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Tragos</span>
          </button>
        )}
      </div>

      {/* Active Turn Showcase & Neighbors Reference */}
      {numPlayers > 0 ? (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Turno actual:
              </span>
              <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-lg">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: currentPlayer?.avatarColor || '#F59E0B' }}
                />
                <span className="font-bold text-white text-sm">
                  {currentPlayer?.name}
                </span>
                <span className="text-xs text-amber-300 font-mono">
                  ({currentPlayer?.drinksTaken || 0} 🥃)
                </span>
              </div>
            </div>

            <button
              onClick={onNextTurn}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors active:scale-95"
            >
              <span>Siguiente Turno</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table Neighbor Position Indicators */}
          {numPlayers >= 2 && (
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-blue-300 bg-blue-950/40 border border-blue-900/40 p-2 rounded-lg">
                <span className="font-bold">⬅️ Izquierda:</span>
                <span className="truncate font-semibold text-white">
                  {leftNeighbor?.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-purple-300 bg-purple-950/40 border border-purple-900/40 p-2 rounded-lg">
                <span className="font-bold">➡️ Derecha:</span>
                <span className="truncate font-semibold text-white">
                  {rightNeighbor?.name}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 text-center text-xs text-slate-400 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
          Agrega a tus amigos para que la pirinola asigne los tragos con nombres reales.
        </div>
      )}

      {/* Players List with Drink Counters */}
      <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
        {players.map((player, idx) => {
          const isTurn = idx === currentPlayerIndex;
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors border ${
                isTurn
                  ? 'bg-amber-500/10 border-amber-500/40 text-white'
                  : 'bg-slate-950/50 border-slate-800/70 text-slate-300 hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => onSelectPlayer(idx)}
                className="flex items-center gap-2.5 flex-1 text-left min-w-0"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-950 shrink-0"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold truncate">{player.name}</span>
                {isTurn && (
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 shrink-0">
                    <UserCheck className="w-3 h-3" />
                    Turno
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs font-bold text-amber-300/90 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {player.drinksTaken} 🥃
                </span>
                <button
                  onClick={() => onRemovePlayer(player.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  title={`Eliminar a ${player.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Player Input */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Nombre del jugador..."
            maxLength={18}
            autoFocus
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Agregar
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition-colors"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-slate-700/80 hover:border-amber-500/60 text-slate-400 hover:text-amber-300 text-xs font-semibold transition-colors bg-slate-950/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar Jugador</span>
        </button>
      )}
    </div>
  );
};
