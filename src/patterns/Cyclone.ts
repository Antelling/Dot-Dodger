import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';


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

      // Remove dots that have flown off-screen
      if (pos.x < -50 || pos.x > bounds.width + 50 ||
          pos.y < -50 || pos.y > bounds.height + 50) {
        this.dots.splice(i, 1);
        continue;
      }

      dot.update(dt, bounds, _playerPosition);
    }
  }

  private spawnDots(bounds: Bounds): void {
    // Randomly pick one of the four corners
    const corners = [
      { x: bounds.width * 0.15, y: bounds.height * 0.15 },      // Top-left
      { x: bounds.width * 0.85, y: bounds.height * 0.15 },      // Top-right
      { x: bounds.width * 0.15, y: bounds.height * 0.85 },      // Bottom-left
      { x: bounds.width * 0.85, y: bounds.height * 0.85 },      // Bottom-right
    ];
    const corner = corners[Math.floor(Math.random() * corners.length)];
    const dotCount = 150;

    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const offsetAngle = angle + (Math.random() - 0.5) * 0.2;
      const radius = this.circleRadius * (0.8 + Math.random() * 0.4);
      const x = corner.x + Math.cos(offsetAngle) * radius;
      const y = corner.y + Math.sin(offsetAngle) * radius;

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
