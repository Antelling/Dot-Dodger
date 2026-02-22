import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2, DotState } from '../types';
import { randomPosition } from '../utils/math';
import { DOT_RADIUS } from '../utils/constants';
import { Dot } from '../entities/Dot';
import { Renderer } from '../renderer/Renderer';

export class GatlingPoint extends Pattern {
  readonly type = PatternType.GATLING_POINT;
  difficulty: Difficulty = Difficulty.MEDIUM;

  private shootDuration: number;
  private readonly dotSpeed: number = 400;
  private shootInterval: number = 100;
  private elapsedSinceSpawn: number = 0;
  private spawnPoint: Vector2 = { x: 0, y: 0 };
  private spawnPointDot: Dot | null = null;
  private readonly spawnPointRadius: number = DOT_RADIUS * 2.5;
  private spawnPointDead: boolean = false;

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
    
    this.spawnPointDot = new Dot(this.spawnPoint.x, this.spawnPoint.y, this.type);
    this.spawnPointDot.state = DotState.ACTIVE;
    // Use Object.defineProperty to override the readonly radius for the spawn point
    Object.defineProperty(this.spawnPointDot, 'radius', {
      value: this.spawnPointRadius,
      writable: false,
      configurable: true
    });
    this.dots.push(this.spawnPointDot);
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    if (this.spawnPointDot && !this.spawnPointDead) {
      if (this.spawnPointDot.isDead()) {
        this.spawnPointDead = true;
      } else if (this.spawnPointDot.isFrozen()) {
        // Spawn point frozen - stop spawning
      } else if (this.elapsedMs <= this.shootDuration) {
        this.elapsedSinceSpawn += dt * 1000;
        if (this.elapsedSinceSpawn >= this.shootInterval) {
          this.elapsedSinceSpawn = 0;
          this.spawnDotAtPoint(playerPosition);
        }
      }
    }

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      if (!dot.isLethal()) {
        dot.update(dt, bounds, playerPosition);
        continue;
      }

      const pos = dot.getPosition();
      const vel = dot.velocity;

      if (pos.x < -100 || pos.x > bounds.width + 100 ||
          pos.y < -100 || pos.y > bounds.height + 100) {
        this.dots.splice(i, 1);
        continue;
      }

      if (pos.x < DOT_RADIUS || pos.x > bounds.width - DOT_RADIUS) {
        vel.x = -vel.x * 0.5;
      }
      if (pos.y < DOT_RADIUS || pos.y > bounds.height - DOT_RADIUS) {
        vel.y = -vel.y * 0.5;
      }

      dot.update(dt, bounds, playerPosition);
    }
  }

  private spawnDotAtPoint(playerPosition: Vector2): void {
    const dx = playerPosition.x - this.spawnPoint.x;
    const dy = playerPosition.y - this.spawnPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.spawnDot(this.spawnPoint.x, this.spawnPoint.y, {
        x: (dx / dist) * this.dotSpeed,
        y: (dy / dist) * this.dotSpeed
      });
    } else {
      this.spawnDot(this.spawnPoint.x, this.spawnPoint.y);
    }
  }

  isComplete(): boolean {
    if (this.spawnPointDead || (this.spawnPointDot && this.spawnPointDot.isFrozen())) {
      return this.getDots().length === 0;
    }
    return this.elapsedMs > this.shootDuration && this.getDots().length === 0;
  }

  isActivelySpawning(): boolean {
    if (this.spawnPointDead || (this.spawnPointDot && this.spawnPointDot.isFrozen())) {
      return false;
    }
    return this.elapsedMs <= this.shootDuration;
  }

  getSpawnPointDot(): Dot | null {
    return this.spawnPointDot;
  }

  isSpawnPointDead(): boolean {
    return this.spawnPointDead;
  }
  render(renderer: Renderer): void {
    super.render?.(renderer);

    if (this.spawnPointDot && !this.spawnPointDot.isDead() && !this.spawnPointDot.isFrozen()) {
      const pos = this.spawnPointDot.getPosition();
      const pulse = 1 + Math.sin(this.elapsedMs * 0.005) * 0.2;
      
      renderer.drawCircleOutline(
        pos.x,
        pos.y,
        this.spawnPointRadius * pulse,
        '#FFD700',
        3
      );
      
      renderer.drawCircleOutline(
        pos.x,
        pos.y,
        this.spawnPointRadius * pulse * 1.3,
        'rgba(255, 215, 0, 0.3)',
        1
      );
    }
  }
}
