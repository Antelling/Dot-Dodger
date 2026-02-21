import { Pattern } from './Pattern';
import { Dot } from '../entities/Dot';
import { PatternType, Difficulty, Bounds, Vector2, DotState } from '../types';
import { DOT_RADIUS, DOT_SPAWN_ANIMATION_DURATION } from '../utils/constants';
import { Renderer } from '../renderer/Renderer';

export class BulletHell extends Pattern {
  readonly type = PatternType.BULLET_HELL;
  difficulty: Difficulty = Difficulty.HARD;

  private duration: number = 10000;
  private readonly dotSpeed: number = 300;
  private readonly warningDuration: number = DOT_SPAWN_ANIMATION_DURATION;

  private originX: number = 0;
  private originY: number = 0;
  private isFromTop: boolean = false;
  private hasStartedSpawning: boolean = false;
  private hasSpawnedBullets: boolean = false;
  private spawnTimeoutId: number | null = null;

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
    this.hasStartedSpawning = false;
    this.hasSpawnedBullets = false;

    this.isFromTop = Math.random() > 0.5;
    this.originX = bounds.width / 2;
    this.originY = this.isFromTop ? -50 : bounds.height + 50;

    this.spawnTimeoutId = window.setTimeout(() => {
      this.hasStartedSpawning = true;
    }, this.warningDuration);
  }

  update(dt: number, _playerPosition: Vector2, bounds: Bounds): void {
    if (this.hasStartedSpawning && this.elapsedMs <= this.duration + this.warningDuration) {
      this.spawnBullets();
    }

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      const pos = dot.getPosition();

      if (pos.x < -DOT_RADIUS || pos.x > bounds.width + DOT_RADIUS ||
          pos.y < -DOT_RADIUS || pos.y > bounds.height + DOT_RADIUS) {
        this.dots.splice(i, 1);
        continue;
      }

      dot.position.x += dot.velocity.x * dt;
      dot.position.y += dot.velocity.y * dt;
    }
  }

  render(renderer: Renderer): void {
    super.render?.(renderer);

    if (!this.hasStartedSpawning && this.isStarted) {
      const progress = Math.min(this.elapsedMs / this.warningDuration, 1);
      const scale = 1.5 - 0.5 * progress;
      const alpha = 1 - progress;

      renderer.drawCircle(
        this.originX,
        this.originY,
        DOT_RADIUS * scale * 2,
        `rgba(255, 102, 102, ${alpha.toFixed(2)})`
      );

      renderer.drawCircleOutline(
        this.originX,
        this.originY,
        DOT_RADIUS * scale * 3,
        `rgba(255, 0, 0, ${alpha.toFixed(2)})`
      );
    }
  }

  private spawnBullets(): void {
    if (this.hasSpawnedBullets) return;

    this.hasSpawnedBullets = true;
    const numStreams = 6;
    const streamSpacing = (Math.PI * 2) / numStreams;

    for (let stream = 0; stream < numStreams; stream++) {
      const angleOffset = stream * streamSpacing;

      for (let i = 0; i < 4; i++) {
        const timeOffset = i * 200;
        const angle = angleOffset + Math.sin(this.elapsedMs * 0.001 + timeOffset * 0.001) * 0.3;

        const startX = this.originX + Math.cos(angle) * 50;

        const dot = new Dot(startX, this.originY, this.type);
        dot.velocity.x = Math.cos(angle) * this.dotSpeed;
        dot.velocity.y = Math.sin(angle) * this.dotSpeed;
        dot.state = DotState.ACTIVE;
        this.dots.push(dot);
      }
    }
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration + this.warningDuration && this.getDots().length === 0;
  }

  clear(): void {
    if (this.spawnTimeoutId !== null) {
      window.clearTimeout(this.spawnTimeoutId);
      this.spawnTimeoutId = null;
    }
    this.hasStartedSpawning = false;
    this.hasSpawnedBullets = false;
    super.clear();
  }
}
