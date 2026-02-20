import { Pattern } from './Pattern';
import { Dot } from '../entities/Dot';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';
import { randomPosition } from '../utils/math';
import { DOT_RADIUS } from '../utils/constants';

export class GatlingPoint extends Pattern {
  readonly type = PatternType.GATLING_POINT;
  difficulty: Difficulty = Difficulty.MEDIUM;

  private shootDuration: number;
  private readonly dotSpeed: number = 400;
  private shootInterval: number = 100;
  private elapsedSinceSpawn: number = 0;
  private spawnPoint: Vector2 = { x: 0, y: 0 };

  constructor(difficulty: Difficulty = Difficulty.MEDIUM) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.shootDuration = 6000;
        this.shootInterval = 50;
        break;
      case Difficulty.MEDIUM:
        this.shootDuration = 4500;
        this.shootInterval = 80;
        break;
      default:
        this.shootDuration = 3000;
        this.shootInterval = 100;
    }
  }

  spawn(_center: Vector2, _bounds: Bounds): void {
    this.start();
    const margin = 50;
    this.spawnPoint = randomPosition(_bounds, margin);
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    if (this.elapsedMs <= this.shootDuration) {
      this.elapsedSinceSpawn += dt * 1000;
      if (this.elapsedSinceSpawn >= this.shootInterval) {
        this.elapsedSinceSpawn = 0;
        this.spawnDot(playerPosition, bounds);
      }
    }

    for (let i = 0; i < this.dots.length; i++) {
      const dot = this.dots[i];
      if (!dot.isLethal()) {
        dot.update(dt, bounds, playerPosition);
        continue;
      }

      const pos = dot.getPosition();
      const vel = dot.velocity;

      if (pos.x < DOT_RADIUS || pos.x > bounds.width - DOT_RADIUS) {
        vel.x = -vel.x;
      }
      if (pos.y < DOT_RADIUS || pos.y > bounds.height - DOT_RADIUS) {
        vel.y = -vel.y;
      }

      dot.update(dt, bounds, playerPosition);
    }
  }

  private spawnDot(playerPosition: Vector2, _bounds: Bounds): void {
    const dx = playerPosition.x - this.spawnPoint.x;
    const dy = playerPosition.y - this.spawnPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const dot = new Dot(this.spawnPoint.x, this.spawnPoint.y, this.type);
    if (dist > 0) {
      dot.velocity.x = (dx / dist) * this.dotSpeed;
      dot.velocity.y = (dy / dist) * this.dotSpeed;
    }
    this.dots.push(dot);
  }

  isComplete(): boolean {
    return this.elapsedMs > this.shootDuration && this.getDots().length === 0;
  }
}
