import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';
import { randomPosition } from '../utils/math';
import { DOT_RADIUS } from '../utils/constants';

export class ZombieSnow extends Pattern {
  readonly type = PatternType.ZOMBIE_SNOW;
  difficulty: Difficulty = Difficulty.EASY;

  private spawnInterval: number;
  private elapsedSinceSpawn: number = 0;
  private readonly duration: number = 15000;
  private readonly dotSpeed: number = 50;

  constructor(difficulty: Difficulty = Difficulty.EASY) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.spawnInterval = 150;
        break;
      case Difficulty.MEDIUM:
        this.spawnInterval = 300;
        break;
      default:
        this.spawnInterval = 500;
    }
  }

  spawn(_center: Vector2, _bounds: Bounds): void {
    this.start();
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    if (this.elapsedMs <= this.duration) {
      this.elapsedSinceSpawn += dt * 1000;
      if (this.elapsedSinceSpawn >= this.spawnInterval) {
        this.elapsedSinceSpawn = 0;
        this.spawnDotAtRandomPosition(bounds);
      }
    }

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      if (!dot.isLethal()) {
        dot.update(dt, bounds, playerPosition);
        continue;
      }

      const pos = dot.getPosition();

      if (pos.x < -100 || pos.x > bounds.width + 100 ||
          pos.y < -100 || pos.y > bounds.height + 100) {
        this.dots.splice(i, 1);
        continue;
      }

      const dx = playerPosition.x - pos.x;
      const dy = playerPosition.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        dot.velocity.x = (dx / dist) * this.dotSpeed;
        dot.velocity.y = (dy / dist) * this.dotSpeed;
      }

      dot.update(dt, bounds, playerPosition);
    }
  }

  private spawnDotAtRandomPosition(bounds: Bounds): void {
    const margin = DOT_RADIUS * 2;
    const pos = randomPosition(bounds, margin);
    this.spawnDot(pos.x, pos.y);
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration && this.getDots().length === 0;
  }

  isActivelySpawning(): boolean {
    return this.elapsedMs <= this.duration;
  }
}
