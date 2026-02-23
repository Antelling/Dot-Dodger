import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';

export class UltraSparseGrid extends Pattern {
  readonly type = PatternType.ULTRA_SPARSE_GRID;
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
    const spacing = 170;
    const cols = Math.floor(bounds.width / spacing);
    const rows = Math.floor(bounds.height / spacing);
    const offsetX = (bounds.width - cols * spacing) / 2;
    const offsetY = (bounds.height - rows * spacing) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * spacing + spacing / 2;
        const y = offsetY + row * spacing + spacing / 2;
        this.spawnDot(x, y, { x: 0, y: 0 });
      }
    }
  }

  isComplete(): boolean {
    return this.getDots().length === 0;
  }
}
