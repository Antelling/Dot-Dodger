import { GameEvent, GameEventType } from '../types';

export class GameEventLogger {
  private events: GameEvent[] = [];
  private gameStartTime: number = 0;

  startGame(): void {
    this.events = [];
    this.gameStartTime = Date.now();
  }

  log(event: Omit<GameEvent, 'timestamp'>): void {
    this.events.push({
      ...event,
      timestamp: Date.now()
    });
  }

  logPatternSpawnStart(patternType: string): void {
    this.log({
      type: GameEventType.PATTERN_SPAWN_START,
      message: `Pattern started: ${this.formatPatternName(patternType)}`
    });
  }

  logPatternSpawnComplete(patternType: string, dotsSpawned: number): void {
    this.log({
      type: GameEventType.PATTERN_SPAWN_COMPLETE,
      message: `Pattern finished spawning: ${this.formatPatternName(patternType)} (${dotsSpawned} dots)`,
      details: { patternType, dotsSpawned }
    });
  }

  logWeaponPickup(weaponType: string): void {
    this.log({
      type: GameEventType.WEAPON_PICKUP,
      message: `Picked up: ${this.formatWeaponName(weaponType)}`
    });
  }

  logWeaponActivate(weaponType: string): void {
    this.log({
      type: GameEventType.WEAPON_ACTIVATE,
      message: `Activated: ${this.formatWeaponName(weaponType)}`
    });
  }

  logBouncedOrbDetonate(weaponType: string, kills: number): void {
    this.log({
      type: GameEventType.BOUNCED_ORB_DETONATE,
      message: `${this.formatWeaponName(weaponType)} detonated (${kills} kills)`,
      details: { weaponType, kills }
    });
  }

  logPlayerDeath(cause: string): void {
    this.log({
      type: GameEventType.PLAYER_DEATH,
      message: `Death: ${cause}`
    });
  }

  getEvents(): GameEvent[] {
    return [...this.events];
  }

  getEventsReversed(): GameEvent[] {
    return [...this.events].reverse();
  }

  getFormattedEvents(): { time: string; message: string }[] {
    return this.getEventsReversed().map(event => ({
      time: this.formatTime(event.timestamp),
      message: event.message
    }));
  }

  private formatTime(timestamp: number): string {
    const elapsed = timestamp - this.gameStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private formatPatternName(type: string): string {
    const names: Record<string, string> = {
      'ZOMBIE_SNOW': 'Zombie Snow',
      'SWEEPER_LINE': 'Sweeper Line',
      'SPARSE_GRID': 'Sparse Grid',
      'BOUNCING_BALL': 'Bouncing Ball',
      'GATLING_POINT': 'Gatling Point',
      'BULLET_HELL': 'Bullet Hell',
      'CONTAINMENT_RING': 'Containment Ring',
      'CYCLONE': 'Cyclone',
      'CLOCK_SWEEP': 'Clock Sweep'
    };
    return names[type] || type;
  }

  private formatWeaponName(type: string): string {
    const names: Record<string, string> = {
      'KINETIC_BOMB': 'Kinetic Bomb',
      'BLASTER': 'Blaster',
      'ICE_BOMB': 'Ice Bomb',
      'HOMING_MISSILE': 'Homing Missile',
      'NUCLEAR_BOMB': 'Nuclear Bomb',
      'ELECTRIC_BOMB': 'Electric Bomb',
      'DOT_REPELLENT': 'Dot Repellent',
      'CHAINSAW': 'Chainsaw',
      'FLAME_BURST': 'Flame Burst',
      'TRIPLE_CANNON': 'Triple Cannon',
      'FIREBALL_ORB': 'Fireball Orb',
      'TESLA_CANNON': 'Tesla Cannon'
    };
    return names[type] || type;
  }

  clear(): void {
    this.events = [];
  }
}
