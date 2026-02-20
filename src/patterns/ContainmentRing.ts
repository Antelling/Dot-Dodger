import { Pattern } from './Pattern';
import { Dot } from '../entities/Dot';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';

export class ContainmentRing extends Pattern {
  readonly type = PatternType.CONTAINMENT_RING;
  difficulty: Difficulty = Difficulty.EASY;

  private readonly ringRadius: number = 100;
  private readonly dotSpeed: number = 30;
  private readonly dotCount: number = 40;
  private readonly innerRadius: number = 20;

  constructor(difficulty: Difficulty = Difficulty.EASY) {
    super();
    this.difficulty = difficulty;
  }

  spawn(center: Vector2, bounds: Bounds): void {
    this.start();
    this.spawnRing(center, bounds);
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    for (let i = 0; i < this.dots.length; i++) {
      const dot = this.dots[i];
      if (!dot.isLethal()) {
        dot.update(dt, bounds, playerPosition);
        continue;
      }

      const pos = dot.getPosition();
      const dx = playerPosition.x - pos.x;
      const dy = playerPosition.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.innerRadius) {
        dot.kill();
        continue;
      }

      if (dist > 0) {
        dot.velocity.x = (dx / dist) * this.dotSpeed;
        dot.velocity.y = (dy / dist) * this.dotSpeed;
      }

      dot.update(dt, bounds, playerPosition);
    }
  }

  private spawnRing(center: Vector2, _bounds: Bounds): void {
    for (let i = 0; i < this.dotCount; i++) {
      const angle = (2 * Math.PI * i) / this.dotCount;
      const x = center.x + this.ringRadius * Math.cos(angle);
      const y = center.y + this.ringRadius * Math.sin(angle);
      this.dots.push(new Dot(x, y, this.type));
    }
  }

  isComplete(): boolean {
    return this.getDots().length === 0;
  }
}
