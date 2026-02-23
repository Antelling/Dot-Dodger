export interface Vector2 {
  x: number;
  y: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED'
}

export enum DotState {
  SPAWNING = 'SPAWNING',
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  DEAD = 'DEAD'
}

export enum PatternType {
  ZOMBIE_SNOW = 'ZOMBIE_SNOW',
  SWEEPER_LINE = 'SWEEPER_LINE',
  SPARSE_GRID = 'SPARSE_GRID',
  ULTRA_SPARSE_GRID = 'ULTRA_SPARSE_GRID',
  BOUNCING_BALL = 'BOUNCING_BALL',
  GATLING_POINT = 'GATLING_POINT',

  SPIRAL = 'SPIRAL',
  CIRCLE_BURST = 'CIRCLE_BURST',
  AIMED_STREAMS = 'AIMED_STREAMS',
  WAVE = 'WAVE',
  CONTAINMENT_RING = 'CONTAINMENT_RING',
  CYCLONE = 'CYCLONE',
  CLOCK_SWEEP = 'CLOCK_SWEEP'
}

export enum WeaponType {
  KINETIC_BOMB = 'KINETIC_BOMB',
  BLASTER = 'BLASTER',
  ICE_BOMB = 'ICE_BOMB',
  HOMING_MISSILE = 'HOMING_MISSILE',
  NUCLEAR_BOMB = 'NUCLEAR_BOMB',
  ELECTRIC_BOMB = 'ELECTRIC_BOMB',
  DOT_REPELLENT = 'DOT_REPELLENT',
  CHAINSAW = 'CHAINSAW',
  FLAME_BURST = 'FLAME_BURST',
  TRIPLE_CANNON = 'TRIPLE_CANNON',
  FIREBALL_ORB = 'FIREBALL_ORB',
  TESLA_CANNON = 'TESLA_CANNON'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Entity {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export interface HighscoreEntry {
  score: number;
  timestamp: number;
}

export interface PlayerConfig {
  hitboxRadius: number;
  maxSpeed: number;
}

export interface DotConfig {
  radius: number;
  spawnAnimationDuration: number;
}

export interface WeaponOrbConfig {
  radius: number;
  alwaysOnArena: number;
}

export interface Bounds {
  width: number;
  height: number;
}

export interface DeathEvent {
  message: string;
  type: 'dot' | 'nuclear_bomb' | 'electric_bomb';
  timestamp: number;
}

export enum GameEventType {
  PATTERN_SPAWN_START = 'PATTERN_SPAWN_START',
  PATTERN_SPAWN_COMPLETE = 'PATTERN_SPAWN_COMPLETE',
  WEAPON_PICKUP = 'WEAPON_PICKUP',
  WEAPON_ACTIVATE = 'WEAPON_ACTIVATE',
  BOUNCED_ORB_DETONATE = 'BOUNCED_ORB_DETONATE',
  PLAYER_DEATH = 'PLAYER_DEATH'
}

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  message: string;
  details?: Record<string, unknown>;
}
