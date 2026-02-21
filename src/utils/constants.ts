export const PLAYER_VISUAL_RADIUS = 10;
export const PLAYER_HITBOX_RADIUS = PLAYER_VISUAL_RADIUS * 0.5;
export const PLAYER_MAX_SPEED = 800;
export const PLAYER_ARROW_LENGTH = 15;

export const DOT_RADIUS = 8;
export const DOT_SPAWN_ANIMATION_DURATION = 1000;
export const DOT_SPAWN_SCALE_MAX = 1.5;

export const WEAPON_ORB_RADIUS = 20;
export const WEAPON_ORB_COUNT = 3;
export const WEAPON_ORB_MIN_SPACING = 100;

export const WRAP_ENABLED = true;

export const SCORE_KILL = 10;
export const SCORE_PATTERN_BONUS_MIN = 50;
export const SCORE_PATTERN_BONUS_MAX = 200;
export const SCORE_TIME_DIVISOR = 10;

export const DIFFICULTY_EASY_MAX_SCORE = 500;
export const DIFFICULTY_MEDIUM_MAX_SCORE = 1500;

export const PATTERN_SELECTION_INTERVAL = 8000;

export const COLOR_PLAYER = '#00FF00';
export const COLOR_PLAYER_ARROW = '#00CC00';
export const COLOR_DOT = '#FF0000';
export const COLOR_DOT_SPAWNING = '#FF6666';
export const COLOR_DOT_FROZEN = '#00FFFF';
export const COLOR_BACKGROUND = '#000000';

export const WEAPON_COLORS: Record<string, string> = {
  KINETIC_BOMB: '#FF6600',
  BLASTER: '#9900FF',
  ICE_BOMB: '#00CCFF',
  HOMING_MISSILE: '#FFFF00',
  NUCLEAR_BOMB: '#FF0000',
  ELECTRIC_BOMB: '#00FFFF',
  DOT_REPELLENT: '#808080',
  CHAINSAW: '#0066FF',
  FLAME_BURST: '#FF9900'
};

export const TARGET_FPS = 60;
export const FRAME_TIME = 1000 / TARGET_FPS;
