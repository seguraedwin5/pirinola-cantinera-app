/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TargetRecipient = 'all' | 'left' | 'right' | 'current' | 'custom' | 'pot' | 'none';

export interface PirinolaOption {
  id: string;
  text: string;
  shortText: string;
  description: string;
  drinks: number;
  target: TargetRecipient;
  color: string;
  secondaryColor?: string;
  iconName: 'Users' | 'Wine' | 'Beer' | 'ArrowLeft' | 'ArrowRight' | 'Flame' | 'Crown' | 'ShieldCheck' | 'HelpCircle' | 'Coins' | 'Sparkles';
  enabled: boolean;
}

export interface Player {
  id: string;
  name: string;
  drinksTaken: number;
  avatarColor: string;
}

export interface SpinResult {
  option: PirinolaOption;
  player: Player | null;
  targetPlayerNames: string[];
  timestamp: number;
}

export type GameMode = 'party' | 'classic' | 'extreme' | 'custom';

export const DEFAULT_FIESTA_OPTIONS: PirinolaOption[] = [
  {
    id: 'todos-toman',
    text: '¡TODOS TOMAN!',
    shortText: 'TODOS TOMAN',
    description: '¡Todos los presentes en la mesa levantan su vaso y beben un trago!',
    drinks: 1,
    target: 'all',
    color: '#E11D48', // Vibrant Rose/Red
    secondaryColor: '#9F1239',
    iconName: 'Users',
    enabled: true,
  },
  {
    id: 'toma-2-tragos',
    text: 'TOMA 2 TRAGOS',
    shortText: 'TOMA 2',
    description: 'Quien giró la pirinola debe tomar 2 tragos o 2 sorbos seguidos.',
    drinks: 2,
    target: 'current',
    color: '#D97706', // Amber/Gold
    secondaryColor: '#92400E',
    iconName: 'Wine',
    enabled: true,
  },
  {
    id: 'toma-el-de-la-izquierda',
    text: 'TOMA EL DE LA IZQUIERDA',
    shortText: 'TOMA IZQ',
    description: 'El jugador sentado inmediatamente a tu izquierda debe beber 1 trago.',
    drinks: 1,
    target: 'left',
    color: '#2563EB', // Blue
    secondaryColor: '#1E40AF',
    iconName: 'ArrowLeft',
    enabled: true,
  },
  {
    id: 'toma-el-de-la-derecha',
    text: 'TOMA EL DE LA DERECHA',
    shortText: 'TOMA DER',
    description: 'El jugador sentado inmediatamente a tu derecha debe beber 1 trago.',
    drinks: 1,
    target: 'right',
    color: '#7C3AED', // Violet
    secondaryColor: '#5B21B6',
    iconName: 'ArrowRight',
    enabled: true,
  },
  {
    id: 'toma-1-trago',
    text: 'TOMA 1 TRAGO',
    shortText: 'TOMA 1',
    description: 'Te tocó tomar un trago a ti solito. ¡Salud!',
    drinks: 1,
    target: 'current',
    color: '#059669', // Emerald
    secondaryColor: '#065F46',
    iconName: 'Beer',
    enabled: true,
  },
  {
    id: 'toma-todo',
    text: '¡TOMA TODO!',
    shortText: 'TOMA TODO',
    description: '¡La peor o mejor suerte! Te toca terminar tu vaso o vaciar el vaso del centro.',
    drinks: 3,
    target: 'current',
    color: '#DC2626', // Deep Red
    secondaryColor: '#7F1D1D',
    iconName: 'Crown',
    enabled: true,
  },
  {
    id: 'eliges-quien-toma',
    text: 'ELIGES QUIÉN TOMA',
    shortText: 'ELIGES',
    description: 'Tienes el poder: apunta con el dedo y elige quién debe tomar 1 trago.',
    drinks: 1,
    target: 'custom',
    color: '#0891B2', // Cyan
    secondaryColor: '#155E75',
    iconName: 'Sparkles',
    enabled: true,
  },
  {
    id: 'se-salva',
    text: 'TE SALVAS',
    shortText: 'TE SALVAS',
    description: '¡Respiro! Nadie toma en esta ronda. Pasa la pirinola al siguiente.',
    drinks: 0,
    target: 'none',
    color: '#4B5563', // Slate
    secondaryColor: '#374151',
    iconName: 'ShieldCheck',
    enabled: true,
  },
];

export const DEFAULT_CLASSIC_OPTIONS: PirinolaOption[] = [
  {
    id: 'pon-1',
    text: 'PON 1',
    shortText: 'PON 1',
    description: 'Pones 1 trago o ficha en el pozo central acumulado.',
    drinks: 1,
    target: 'pot',
    color: '#0284C7',
    iconName: 'Coins',
    enabled: true,
  },
  {
    id: 'pon-2',
    text: 'PON 2',
    shortText: 'PON 2',
    description: 'Pones 2 tragos o fichas en el pozo central acumulado.',
    drinks: 2,
    target: 'pot',
    color: '#2563EB',
    iconName: 'Coins',
    enabled: true,
  },
  {
    id: 'toma-1',
    text: 'TOMA 1',
    shortText: 'TOMA 1',
    description: 'Tomas 1 trago o ficha del pozo central.',
    drinks: 1,
    target: 'current',
    color: '#16A34A',
    iconName: 'Beer',
    enabled: true,
  },
  {
    id: 'toma-2',
    text: 'TOMA 2',
    shortText: 'TOMA 2',
    description: 'Tomas 2 tragos o fichas del pozo central.',
    drinks: 2,
    target: 'current',
    color: '#EAB308',
    iconName: 'Wine',
    enabled: true,
  },
  {
    id: 'todos-ponen',
    text: 'TODOS PONEN',
    shortText: 'TODOS PONEN',
    description: '¡Cada uno de los jugadores debe poner 1 ficha o trago al centro!',
    drinks: 1,
    target: 'all',
    color: '#EA580C',
    iconName: 'Users',
    enabled: true,
  },
  {
    id: 'toma-todo-clasico',
    text: '¡TOMA TODO!',
    shortText: 'TOMA TODO',
    description: '¡Te llevas todo el pozo acumulado o te tomas el vaso del rey!',
    drinks: 3,
    target: 'current',
    color: '#DC2626',
    iconName: 'Crown',
    enabled: true,
  },
];

export const DEFAULT_EXTREME_OPTIONS: PirinolaOption[] = [
  {
    id: 'shot-doble',
    text: 'SHOT DOBLE',
    shortText: 'SHOT x2',
    description: 'Tómate 2 shots seguidos o fondo blanco sin hacer muecas.',
    drinks: 2,
    target: 'current',
    color: '#DC2626',
    iconName: 'Flame',
    enabled: true,
  },
  {
    id: 'cascada-extrema',
    text: 'CASCADA DE TRAGOS',
    shortText: 'CASCADA',
    description: 'Empiezas a tomar y nadie puede parar hasta que el de su izquierda termine.',
    drinks: 2,
    target: 'all',
    color: '#0284C7',
    iconName: 'Users',
    enabled: true,
  },
  {
    id: 'toma-izq-der',
    text: 'IZQUIERDA Y DERECHA',
    shortText: 'IZQ Y DER',
    description: 'Toman ambos vecinos de mesa al mismo tiempo.',
    drinks: 1,
    target: 'all',
    color: '#9333EA',
    iconName: 'Users',
    enabled: true,
  },
  {
    id: 'verdad-o-trago',
    text: 'VERDAD O TRAGO',
    shortText: 'VERDAD / TRAGO',
    description: 'Responde una pregunta incómoda del grupo o tómate 2 tragos.',
    drinks: 2,
    target: 'current',
    color: '#EA580C',
    iconName: 'HelpCircle',
    enabled: true,
  },
  {
    id: 'yo-nunca-nunca',
    text: 'YO NUNCA NUNCA',
    shortText: 'YO NUNCA',
    description: 'Di una frase de Yo Nunca Nunca; todos los que lo hayan hecho beben.',
    drinks: 1,
    target: 'all',
    color: '#0D9488',
    iconName: 'Wine',
    enabled: true,
  },
  {
    id: 'todos-toman-extremo',
    text: '¡TODOS TOMAN!',
    shortText: 'TODOS TOMAN',
    description: '¡Ronda general obligatoria! ¡Todos brindan y beben!',
    drinks: 1,
    target: 'all',
    color: '#E11D48',
    iconName: 'Users',
    enabled: true,
  },
];
