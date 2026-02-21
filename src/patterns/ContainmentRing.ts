import { Pattern } from './Pattern';
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

      if (dist > this.innerRadius) {
        dot.velocity.x = (dx / dist) * this.dotSpeed;
        dot.velocity.y = (dy / dist) * this.dotSpeed;
      } else {
        dot.velocity.x = 0;
        dot.velocity.y = 0;
      }

      dot.update(dt, bounds, playerPosition);
    }
  }

  private spawnRing(center: Vector2, _bounds: Bounds): void {
    const gapCount = Math.floor(Math.random() * 5);
    const gapSize = gapCount > 0 ? 2 : 0;
    const gaps: Array<[number, number]> = [];

    for (let g = 0; g < gapCount; g++) {
      const gapCenter = (this.dotCount * g) / gapCount + Math.floor(this.dotCount / (gapCount * 2));
      const gapStart = gapCenter - gapSize;
      const gapEnd = gapCenter + gapSize;
      gaps.push([gapStart, gapEnd]);
    }

    for (let i = 0; i < this.dotCount; i++) {
      const inGap = gaps.some(([start, end]) => i >= start && i <= end);
      if (inGap) continue;

      const angle = (2 * Math.PI * i) / this.dotCount;
      const x = center.x + this.ringRadius * Math.cos(angle);
      const y = center.y + this.ringRadius * Math.sin(angle);
      this.spawnDot(x, y);
    }
  }

  isComplete(): boolean {
    return this.getDots().length === 0;
  }
}
