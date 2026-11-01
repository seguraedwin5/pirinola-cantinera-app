/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PirinolaCanvas } from './components/PirinolaCanvas';
import { DrinkTimer } from './components/DrinkTimer';
import { PlayerManager } from './components/PlayerManager';
import { ResultBanner } from './components/ResultBanner';
import { RulesEditorModal } from './components/RulesEditorModal';
import { GameHistoryModal } from './components/GameHistoryModal';
import {
  PirinolaOption,
  Player,
  SpinResult,
  GameMode,
  DEFAULT_FIESTA_OPTIONS,
} from './types/pirinola';
import { setAudioMuted, getAudioMuted } from './utils/audio';
import {
  Volume2,
  VolumeX,
  Sliders,
  History,
  RotateCw,
  Flame,
  Info,
  Wine,
  Users,
  Timer as TimerIcon,
} from 'lucide-react';

const INITIAL_PLAYERS: Player[] = [
  { id: 'p-1', name: 'Carlos', drinksTaken: 0, avatarColor: '#F59E0B' },
  { id: 'p-2', name: 'Camila', drinksTaken: 0, avatarColor: '#EC4899' },
  { id: 'p-3', name: 'David', drinksTaken: 0, avatarColor: '#3B82F6' },
  { id: 'p-4', name: 'Valentina', drinksTaken: 0, avatarColor: '#10B981' },
];

export default function App() {
  // Game options & mode
  const [options, setOptions] = useState<PirinolaOption[]>(() => {
    const saved = localStorage.getItem('pirinola_options');
    return saved ? JSON.parse(saved) : DEFAULT_FIESTA_OPTIONS;
  });

  const [currentMode, setCurrentMode] = useState<GameMode>(() => {
    return (localStorage.getItem('pirinola_mode') as GameMode) || 'party';
  });

  // Players
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('pirinola_players');
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // Spin & Outcome state
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<PirinolaOption | null>(null);
  const [lastResultTime, setLastResultTime] = useState<number | undefined>(undefined);
  const [history, setHistory] = useState<SpinResult[]>([]);

  // Timer configuration
  const [autoStartTimer, setAutoStartTimer] = useState(true);
  const [timerTriggerSeconds, setTimerTriggerSeconds] = useState(10);

  // Audio & Modals
  const [isMuted, setIsMuted] = useState(getAudioMuted());
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Persist options & players
  useEffect(() => {
    localStorage.setItem('pirinola_options', JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    localStorage.setItem('pirinola_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('pirinola_mode', currentMode);
  }, [currentMode]);

  // Keyboard shortcut: Spacebar spins
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpinning && e.target === document.body) {
        e.preventDefault();
        handleTriggerSpin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setAudioMuted(next);
  };

  const handleTriggerSpin = () => {
    if (isSpinning) return;
    setLastResult(null);
    setIsSpinning(true);
  };

  const handleSpinStart = useCallback(() => {
    setIsSpinning(true);
    setLastResult(null);
  }, []);

  const handleSpinEnd = useCallback(
    (chosen: PirinolaOption) => {
      setIsSpinning(false);
      setLastResult(chosen);
      const now = Date.now();
      setLastResultTime(now);

      // Resolve targets & drink tracking
      const currentPlayer = players[currentPlayerIndex] || null;
      const targetNames: string[] = [];

      if (players.length > 0 && chosen.drinks > 0) {
        setPlayers((prev) =>
          prev.map((player, idx) => {
            let drinksToAdd = 0;

            if (chosen.target === 'all') {
              drinksToAdd = chosen.drinks;
              targetNames.push(player.name);
            } else if (chosen.target === 'current' && idx === currentPlayerIndex) {
              drinksToAdd = chosen.drinks;
              targetNames.push(player.name);
            } else if (chosen.target === 'left') {
              const leftIdx = (currentPlayerIndex + 1) % prev.length;
              if (idx === leftIdx) {
                drinksToAdd = chosen.drinks;
                targetNames.push(player.name);
              }
            } else if (chosen.target === 'right') {
              const rightIdx = (currentPlayerIndex - 1 + prev.length) % prev.length;
              if (idx === rightIdx) {
                drinksToAdd = chosen.drinks;
                targetNames.push(player.name);
              }
            }

            return drinksToAdd > 0
              ? { ...player, drinksTaken: player.drinksTaken + drinksToAdd }
              : player;
          })
        );
      }

      // Add to history
      setHistory((prev) => [
        {
          option: chosen,
          player: currentPlayer,
          targetPlayerNames: targetNames,
          timestamp: now,
        },
        ...prev.slice(0, 49),
      ]);

      // Set recommended countdown seconds based on drink severity
      if (chosen.drinks >= 3) {
        setTimerTriggerSeconds(15);
      } else if (chosen.drinks === 2) {
        setTimerTriggerSeconds(10);
      } else {
        setTimerTriggerSeconds(8);
      }
    },
    [currentPlayerIndex, players]
  );

  const handleNextTurn = () => {
    if (players.length > 0) {
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    }
  };

  // Player handlers
  const handleAddPlayer = (name: string) => {
    const colors = ['#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];
    const newP: Player = {
      id: `p-${Date.now()}`,
      name,
      drinksTaken: 0,
      avatarColor: colors[players.length % colors.length],
    };
    setPlayers((prev) => [...prev, newP]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (currentPlayerIndex >= filtered.length) {
        setCurrentPlayerIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  };

  const handleResetDrinks = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, drinksTaken: 0 })));
  };

  const currentPlayer = players[currentPlayerIndex] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. TOP BAR CONTRACT */}
      {/* Exactly 3 zones separated by gap-8: Brand wordmark — 4 nav links — 1 primary action */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand title wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-black tracking-tight text-white font-['Outfit'] whitespace-nowrap">
            Pirinola Cantinera
          </span>
          <span className="hidden sm:inline-block text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            Toma Todo
          </span>
        </div>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Reglas y Caras</span>
          </button>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span>Historial ({history.length})</span>
          </button>

          <button
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Cómo Jugar</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>Mudo</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Sonido</span>
              </>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleTriggerSpin}
            disabled={isSpinning}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg transition-transform active:scale-95 whitespace-nowrap shrink-0 shadow-md shadow-amber-950 flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>¡Girar Pirinola!</span>
          </button>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80 text-xs text-slate-300">
        <button
          onClick={() => setIsRulesModalOpen(true)}
          className="flex items-center gap-1 hover:text-white"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Reglas</span>
        </button>
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="flex items-center gap-1 hover:text-white"
        >
          <History className="w-3.5 h-3.5 text-blue-400" />
          <span>Tiros ({history.length})</span>
        </button>
        <button
          onClick={() => setShowHowToPlay(!showHowToPlay)}
          className="flex items-center gap-1 hover:text-white"
        >
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reglamento</span>
        </button>
        <button
          onClick={handleToggleMute}
          className="flex items-center gap-1 hover:text-white"
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{isMuted ? 'Mudo' : 'Audio'}</span>
        </button>
      </div>

      {/* Main Content Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* How to play drop-down card */}
        {showHowToPlay && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-col gap-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <span>Reglas Básicas de la Pirinola Cantinera</span>
              </h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-slate-400 hover:text-white text-xs underline"
              >
                Ocultar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-400">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-white block mb-1">1. Todos Toman</span>
                Todos los participantes en la mesa deben brindar y beber 1 trago o shot juntos.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-white block mb-1">2. Izquierda / Derecha</span>
                Bebe el jugador sentado a la izquierda o derecha de quien tiró la pirinola.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-white block mb-1">3. Toma 2 Tragos</span>
                El jugador en turno debe beber 2 tragos de su bebida antes de que el tiempo se acabe.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-white block mb-1">4. Temporizador</span>
                Usa el contador de segundos para tomar el trago rápido o cumplir el reto antes del timbre.
              </div>
            </div>
          </div>
        )}

        {/* Top Arena Split: 3D Pirinola + Quick Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left/Center: 3D Pirinola Interactive Canvas */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <PirinolaCanvas
              options={options}
              isSpinning={isSpinning}
              onSpinStart={handleSpinStart}
              onSpinEnd={handleSpinEnd}
            />
          </div>

          {/* Right: Active Turn & Outcome or Active Options Overview */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* If there's an active result, show celebratory banner */}
            {lastResult ? (
              <ResultBanner
                result={lastResult}
                currentPlayer={currentPlayer}
                players={players}
                currentPlayerIndex={currentPlayerIndex}
                onNextTurn={handleNextTurn}
                onStartTimer={() => {
                  setLastResultTime(Date.now());
                }}
                onClose={() => setLastResult(null)}
              />
            ) : (
              /* Ready to spin prompt */
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white font-['Outfit']">
                      {currentPlayer ? `¡Turno de ${currentPlayer.name}!` : '¡Pirinola Lista!'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Arrastra la pirinola o pulsa Girar para conocer tu suerte
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Modo activo:</span>
                  <button
                    onClick={() => setIsRulesModalOpen(true)}
                    className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>
                      {currentMode === 'party'
                        ? '🎉 Fiesta Cantinera'
                        : currentMode === 'classic'
                        ? '🪵 Clásico Toma Todo'
                        : currentMode === 'extreme'
                        ? '🔥 Desafíos & Shots'
                        : '⚙️ Personalizado'}
                    </span>
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick summary of the faces on this pirinola */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                    Opciones en juego ({options.filter((o) => o.enabled).length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {options
                      .filter((o) => o.enabled)
                      .map((opt) => (
                        <span
                          key={opt.id}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium text-slate-300 bg-slate-950/80 border border-slate-800"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: opt.color }}
                          />
                          <span>{opt.shortText}</span>
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Countdown / Drink Timer */}
            <DrinkTimer
              autoStartOnResult={autoStartTimer}
              onToggleAutoStart={() => setAutoStartTimer(!autoStartTimer)}
              lastResultEventTime={lastResultTime}
              triggerSeconds={timerTriggerSeconds}
            />
          </div>
        </div>

        {/* Lower Arena: Players Table Seating & Game Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
          {/* Seating Circle & Player Turn Manager */}
          <div className="lg:col-span-7">
            <PlayerManager
              players={players}
              currentPlayerIndex={currentPlayerIndex}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onSelectPlayer={(idx) => setCurrentPlayerIndex(idx)}
              onNextTurn={handleNextTurn}
              onResetDrinks={handleResetDrinks}
            />
          </div>

          {/* Quick Party Rules Card & Game Shortcuts */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Wine className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-white">
                      Opciones Especiales de Fiesta
                    </h3>
                    <p className="text-xs text-slate-400">
                      Presiona para configurar o agregar nuevas caras
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsRulesModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
                >
                  Editar Caras
                </button>
              </div>

              {/* Grid of highlight features requested by user */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="font-bold text-rose-400">¡Todos Toman!</span>
                  <span className="text-[11px] text-slate-400">
                    Brindis general con toda la mesa
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="font-bold text-amber-400">Toma 2 Tragos</span>
                  <span className="text-[11px] text-slate-400">
                    Doble dosis para quien tira
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="font-bold text-blue-400">Toma el de Izquierda</span>
                  <span className="text-[11px] text-slate-400">
                    Castiga al vecino de la izquierda
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="font-bold text-purple-400">Toma el de Derecha</span>
                  <span className="text-[11px] text-slate-400">
                    Castiga al vecino de la derecha
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <TimerIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Temporizador activo en cada ronda</span>
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {autoStartTimer ? 'Automático' : 'Manual'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <RulesEditorModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        options={options}
        currentMode={currentMode}
        onSelectMode={(mode, newOpts) => {
          setCurrentMode(mode);
          setOptions(newOpts);
        }}
        onUpdateOptions={(newOpts) => {
          setOptions(newOpts);
          setCurrentMode('custom');
        }}
      />

      <GameHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        players={players}
        onClearHistory={() => setHistory([])}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        Pirinola Cantinera · Juego para fiestas y reuniones · Bebe con responsabilidad
      </footer>
    </div>
  );
}
