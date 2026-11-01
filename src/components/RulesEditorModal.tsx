/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PirinolaOption,
  GameMode,
  DEFAULT_FIESTA_OPTIONS,
  DEFAULT_CLASSIC_OPTIONS,
  DEFAULT_EXTREME_OPTIONS,
  TargetRecipient,
} from '../types/pirinola';
import { X, Plus, Trash2, Check, RotateCcw, Sliders } from 'lucide-react';

interface RulesEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: PirinolaOption[];
  currentMode: GameMode;
  onSelectMode: (mode: GameMode, newOptions: PirinolaOption[]) => void;
  onUpdateOptions: (newOptions: PirinolaOption[]) => void;
}

const PRESET_COLORS = [
  '#E11D48', // Red
  '#D97706', // Amber
  '#2563EB', // Blue
  '#7C3AED', // Violet
  '#059669', // Emerald
  '#0891B2', // Cyan
  '#DC2626', // Crimson
  '#4B5563', // Slate
];

export const RulesEditorModal: React.FC<RulesEditorModalProps> = ({
  isOpen,
  onClose,
  options,
  currentMode,
  onSelectMode,
  onUpdateOptions,
}) => {
  const [newText, setNewText] = useState('');
  const [newShortText, setNewShortText] = useState('');
  const [newDrinks, setNewDrinks] = useState(1);
  const [newTarget, setNewTarget] = useState<TargetRecipient>('current');
  const [newColor, setNewColor] = useState('#E11D48');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleToggleOption = (id: string) => {
    const updated = options.map((opt) =>
      opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
    );
    // Don't disable all
    if (updated.filter((o) => o.enabled).length < 2) return;
    onUpdateOptions(updated);
  };

  const handleDeleteOption = (id: string) => {
    if (options.length <= 3) return; // Need at least 3 faces for a polygon
    onUpdateOptions(options.filter((o) => o.id !== id));
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const short = newShortText.trim() || newText.trim().substring(0, 10).toUpperCase();
    const newOpt: PirinolaOption = {
      id: `custom-${Date.now()}`,
      text: newText.trim().toUpperCase(),
      shortText: short,
      description: `Regla personalizada: ${newText.trim()}`,
      drinks: Number(newDrinks),
      target: newTarget,
      color: newColor,
      iconName: 'Wine',
      enabled: true,
    };

    onUpdateOptions([...options, newOpt]);
    setNewText('');
    setNewShortText('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                Opciones y Caras de la Pirinola
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona un modo de fiesta o personaliza las opciones a tu gusto
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Game Mode Presets */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Modos de Juego Predefinidos:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => onSelectMode('party', DEFAULT_FIESTA_OPTIONS)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  currentMode === 'party'
                    ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm text-amber-400">🎉 Fiesta Cantinera</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Todos toman, Toma 2, Toma izq, Toma der, Toma Todo
                </div>
              </button>

              <button
                onClick={() => onSelectMode('classic', DEFAULT_CLASSIC_OPTIONS)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  currentMode === 'classic'
                    ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm text-blue-400">🪵 Toma Todo Tradicional</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Pon 1, Pon 2, Toma 1, Toma 2, Todos Ponen, Toma Todo
                </div>
              </button>

              <button
                onClick={() => onSelectMode('extreme', DEFAULT_EXTREME_OPTIONS)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  currentMode === 'extreme'
                    ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm text-rose-400">🔥 Desafíos & Shots</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Shots dobles, Cascada, Verdad o Trago, Yo Nunca Nunca
                </div>
              </button>
            </div>
          </div>

          {/* Current Faces List */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Caras Activas de la Pirinola ({options.filter((o) => o.enabled).length}/{options.length})
              </span>

              <button
                onClick={() => {
                  if (currentMode === 'party') onUpdateOptions(DEFAULT_FIESTA_OPTIONS);
                  else if (currentMode === 'classic') onUpdateOptions(DEFAULT_CLASSIC_OPTIONS);
                  else onUpdateOptions(DEFAULT_EXTREME_OPTIONS);
                }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Modo</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {options.map((opt) => (
                <div
                  key={opt.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    opt.enabled
                      ? 'bg-slate-950/80 border-slate-800 text-white'
                      : 'bg-slate-950/30 border-slate-900 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: opt.color }}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="font-bold text-xs sm:text-sm truncate">
                        {opt.text}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {opt.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {opt.drinks > 0 && (
                      <span className="font-mono text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {opt.drinks} 🥃
                      </span>
                    )}

                    <button
                      onClick={() => handleToggleOption(opt.id)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        opt.enabled
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                      title={opt.enabled ? 'Desactivar cara' : 'Activar cara'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteOption(opt.id)}
                      disabled={options.length <= 3}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-20"
                      title="Eliminar opción"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Face Form */}
          {isAdding ? (
            <form
              onSubmit={handleAddOption}
              className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col gap-3"
            >
              <div className="font-bold text-xs text-amber-400">
                Nueva Opción para la Pirinola
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Texto en la Cara:
                  </label>
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Ej. TOMA EL MÁS ALTO"
                    maxLength={28}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Texto Corto (para 3D):
                  </label>
                  <input
                    type="text"
                    value={newShortText}
                    onChange={(e) => setNewShortText(e.target.value)}
                    placeholder="Ej. EL MÁS ALTO"
                    maxLength={12}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Cantidad de Tragos:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={newDrinks}
                    onChange={(e) => setNewDrinks(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Destinatario:
                  </label>
                  <select
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value as TargetRecipient)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="current">Quien gira</option>
                    <option value="all">Todos toman</option>
                    <option value="left">El de la izquierda</option>
                    <option value="right">El de la derecha</option>
                    <option value="custom">A quien elija</option>
                    <option value="none">Nadie (Se salva)</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Color:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          newColor === c ? 'scale-125 border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Guardar Cara
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/60 text-slate-400 hover:text-amber-300 text-xs font-semibold transition-colors bg-slate-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Cara Personalizada a la Pirinola</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total de caras activas: {options.filter((o) => o.enabled).length}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Listo para Jugar
          </button>
        </div>
      </div>
    </div>
  );
};
