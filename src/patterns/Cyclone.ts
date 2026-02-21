import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';
import { DOT_RADIUS } from '../utils/constants';

export class Cyclone extends Pattern {
  readonly type = PatternType.CYCLONE;
  difficulty: Difficulty = Difficulty.HARD;

  private readonly duration: number = 25000;
  private circleRadius: number = 50;
  private dotSpeed: number = 150;

  constructor(difficulty: Difficulty = Difficulty.HARD) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.dotSpeed = 300;
        this.circleRadius = 80;
        break;
      case Difficulty.MEDIUM:
        this.dotSpeed = 200;
        this.circleRadius = 60;
        break;
      default:
        this.dotSpeed = 150;
        this.circleRadius = 50;
    }
  }

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();
    this.spawnDots(bounds);
  }

  update(dt: number, _playerPosition: Vector2, bounds: Bounds): void {
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      if (!dot.isLethal()) {
        dot.update(dt, bounds, _playerPosition);
        continue;
      }

      const pos = dot.getPosition();
      const vel = dot.velocity;

      if (pos.x < DOT_RADIUS) {
        vel.x = Math.abs(vel.x);
        dot.position.x = DOT_RADIUS;
      } else if (pos.x > bounds.width - DOT_RADIUS) {
        vel.x = -Math.abs(vel.x);
        dot.position.x = bounds.width - DOT_RADIUS;
      }

      if (pos.y < DOT_RADIUS) {
        vel.y = Math.abs(vel.y);
        dot.position.y = DOT_RADIUS;
      } else if (pos.y > bounds.height - DOT_RADIUS) {
        vel.y = -Math.abs(vel.y);
        dot.position.y = bounds.height - DOT_RADIUS;
      }

      dot.update(dt, bounds, _playerPosition);
    }
  }

  private spawnDots(bounds: Bounds): void {
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const dotCount = 150;

    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const offsetAngle = angle + (Math.random() - 0.5) * 0.2;
      const radius = this.circleRadius * (0.8 + Math.random() * 0.4);
      const x = centerX + Math.cos(offsetAngle) * radius;
      const y = centerY + Math.sin(offsetAngle) * radius;

      const velAngle = offsetAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      const speed = this.dotSpeed * (0.5 + Math.random() * 1);
      this.spawnDot(x, y, {
        x: Math.cos(velAngle) * speed,
        y: Math.sin(velAngle) * speed
      });
    }
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration && this.getDots().length === 0;
  }
}
