import { Pattern } from './Pattern';
import { Dot } from '../entities/Dot';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';

export class SweeperLine extends Pattern {
  readonly type = PatternType.SWEEPER_LINE;
  difficulty: Difficulty = Difficulty.EASY;

  private readonly duration: number = 20000;
  private readonly speed: number = 100;
  private readonly holes: number = 5;
  private lineDirection: number = 0;
  private linePosition: number = 0;
  private lineSpeed: number = 0;

  constructor(difficulty: Difficulty = Difficulty.EASY) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.lineSpeed = 3;
        break;
      case Difficulty.MEDIUM:
        this.lineSpeed = 2;
        break;
      default:
        this.lineSpeed = 1;
    }
  }

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();
    this.lineDirection = Math.random() > 0.5 ? 1 : -1;
    const axis = Math.floor(Math.random() * 4);
    this.linePosition = -100;

    if (axis === 0) {
      this.spawnHorizontalLine(bounds, 'x', 0);
    } else if (axis === 1) {
      this.spawnHorizontalLine(bounds, 'x', bounds.width);
    } else if (axis === 2) {
      this.spawnVerticalLine(bounds, 'y', 0);
    } else {
      this.spawnVerticalLine(bounds, 'y', bounds.height);
    }
  }

  update(dt: number, _playerPosition: Vector2, bounds: Bounds): void {
    if (this.elapsedMs <= this.duration) {
      this.linePosition += this.lineSpeed;
    }

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      const isLethal = dot.isLethal();

      if (!isLethal) {
        dot.update(dt, bounds, _playerPosition);
        continue;
      }

      dot.update(dt, bounds, _playerPosition);
      const pos = dot.getPosition();

      if (this.isOffScreen(pos, bounds) || this.isBeyondLine(pos)) {
        this.dots.splice(i, 1);
      }
    }
  }

  private spawnHorizontalLine(bounds: Bounds, axis: 'x' | 'y', edgeValue: number): void {
    const start = this.lineDirection > 0 ? edgeValue - 100 : edgeValue;
    const end = this.lineDirection > 0 ? bounds.width : 0;
    const direction = this.lineDirection > 0 ? 1 : -1;

    let current = start;
    const step = 5;
    let holeCounter = 0;
    let lastHolePos = -1;

    while ((direction > 0 && current < end) || (direction < 0 && current > end)) {
      const distFromHole = Math.abs(current - lastHolePos);
      const isHole = holeCounter < this.holes && distFromHole > 60;

      if (!isHole) {
        const dot = new Dot(
          axis === 'x' ? current : edgeValue,
          axis === 'y' ? current : edgeValue,
          this.type
        );
        dot.velocity.x = this.speed * direction;
        dot.velocity.y = 0;
        this.dots.push(dot);
      }

      if (isHole) {
        holeCounter++;
        lastHolePos = current;
      }

      current += step;
    }
  }

  private spawnVerticalLine(bounds: Bounds, axis: 'x' | 'y', edgeValue: number): void {
    const start = this.lineDirection > 0 ? edgeValue - 100 : edgeValue;
    const end = this.lineDirection > 0 ? bounds.height : 0;
    const direction = this.lineDirection > 0 ? 1 : -1;

    let current = start;
    const step = 5;
    let holeCounter = 0;
    let lastHolePos = -1;

    while ((direction > 0 && current < end) || (direction < 0 && current > end)) {
      const distFromHole = Math.abs(current - lastHolePos);
      const isHole = holeCounter < this.holes && distFromHole > 60;

      if (!isHole) {
        const dot = new Dot(
          axis === 'x' ? edgeValue : current,
          axis === 'y' ? current : edgeValue,
          this.type
        );
        dot.velocity.x = 0;
        dot.velocity.y = this.speed * direction;
        this.dots.push(dot);
      }

      if (isHole) {
        holeCounter++;
        lastHolePos = current;
      }

      current += step;
    }
  }

  private isOffScreen(pos: Vector2, bounds: Bounds): boolean {
    return pos.x < -100 || pos.x > bounds.width + 100 || pos.y < -100 || pos.y > bounds.height + 100;
  }

  private isBeyondLine(pos: Vector2): boolean {
    const dx = this.lineDirection > 0 ? pos.x - this.linePosition : this.linePosition - pos.x;
    const threshold = 100;
    return this.lineDirection > 0 ? dx > threshold : dx < -threshold;
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration && this.getDots().length === 0;
  }
}
