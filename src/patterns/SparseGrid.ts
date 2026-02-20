import { Pattern } from './Pattern';
import { Dot } from '../entities/Dot';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';

export class SparseGrid extends Pattern {
  readonly type = PatternType.SPARSE_GRID;
  difficulty: Difficulty = Difficulty.EASY;

  private readonly dotSpeed: number = 20;

  constructor(difficulty: Difficulty = Difficulty.EASY) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.dotSpeed = 40;
        break;
      case Difficulty.MEDIUM:
        this.dotSpeed = 30;
        break;
      default:
        this.dotSpeed = 20;
    }
  }

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();
    this.spawnGrid(bounds);
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
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const speed = distance > 50 ? this.dotSpeed : this.dotSpeed * (distance / 50);
        dot.velocity.x = (dx / distance) * speed;
        dot.velocity.y = (dy / distance) * speed;
      }

      dot.update(dt, bounds, playerPosition);
    }
  }

  private spawnGrid(bounds: Bounds): void {
    const margin = 100;
    const spacing = 85;
    const cols = Math.floor((bounds.width - margin * 2) / spacing);
    const rows = Math.floor((bounds.height - margin * 2) / spacing);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = margin + col * spacing + spacing / 2;
        const y = margin + row * spacing + spacing / 2;
        const dot = new Dot(x, y, this.type);
        dot.velocity.x = 0;
        dot.velocity.y = 0;
        this.dots.push(dot);
      }
    }
  }

  isComplete(): boolean {
    return this.getDots().length === 0;
  }
}
