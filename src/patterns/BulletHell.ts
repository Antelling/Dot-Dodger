import { Pattern } from './Pattern';
import { Dot } from '../entities/Dot';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';
import { DOT_RADIUS } from '../utils/constants';

export class BulletHell extends Pattern {
  readonly type = PatternType.BULLET_HELL;
  difficulty: Difficulty = Difficulty.HARD;

  private duration: number = 10000;
  private readonly dotSpeed: number = 300;

  constructor(difficulty: Difficulty = Difficulty.HARD) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.duration = 15000;
        break;
      case Difficulty.MEDIUM:
        this.duration = 12000;
        break;
    }
  }

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();
    this.spawnBullets(bounds);
  }

  update(dt: number, _playerPosition: Vector2, bounds: Bounds): void {
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      if (!dot.isLethal()) {
        dot.update(dt, bounds, _playerPosition);
        continue;
      }

      dot.update(dt, bounds, _playerPosition);
      const pos = dot.getPosition();

      if (pos.x < -DOT_RADIUS || pos.x > bounds.width + DOT_RADIUS ||
          pos.y < -DOT_RADIUS || pos.y > bounds.height + DOT_RADIUS) {
        this.dots.splice(i, 1);
      }
    }
  }

  private spawnBullets(bounds: Bounds): void {
    const centerX = bounds.width / 2;
    const isTop = Math.random() > 0.5;
    const startY = isTop ? -50 : bounds.height + 50;

    const numStreams = 12;
    const streamSpacing = (Math.PI * 2) / numStreams;

    for (let stream = 0; stream < numStreams; stream++) {
      const angleOffset = stream * streamSpacing;

      for (let i = 0; i < 4; i++) {
        const timeOffset = i * 200;
        const angle = angleOffset + Math.sin(this.elapsedMs * 0.001 + timeOffset * 0.001) * 0.3;

        const startX = centerX + Math.cos(angle) * (isTop ? 50 : bounds.width - 50);

        const dot = new Dot(startX, startY, this.type);
        dot.velocity.x = Math.cos(angle) * this.dotSpeed;
        dot.velocity.y = Math.sin(angle) * this.dotSpeed;
        this.dots.push(dot);
      }
    }
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration && this.getDots().length === 0;
  }
}
