import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';
import { DOT_SPAWN_ANIMATION_DURATION } from '../utils/constants';

export class SweeperLine extends Pattern {
  readonly type = PatternType.SWEEPER_LINE;
  difficulty: Difficulty = Difficulty.EASY;

  private readonly duration: number = 20000;
  private readonly dotSpacing: number = 20;
  private readonly holeSize: number = 40;

  private isHorizontal: boolean = true;
  private sweepSpeed: number = 150;
  private linePos: number = 0;
  private lineVelocity: number = 0;
  private lineOffset: number = 0;
  private pendingSpawns: { offset: number }[] = [];
  private spawnTimer: number = 0;
  private readonly spawnDelay: number = 12;
  private isSpawning: boolean = false;
  private spawnCompleteTime: number = 0;

  constructor(difficulty: Difficulty = Difficulty.EASY) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.sweepSpeed = 220;
        break;
      case Difficulty.MEDIUM:
        this.sweepSpeed = 180;
        break;
      default:
        this.sweepSpeed = 140;
    }
  }

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();
    this.isSpawning = true;
    this.spawnCompleteTime = 0;

    this.isHorizontal = Math.random() > 0.5;

    if (this.isHorizontal) {
      this.lineOffset = Math.random() * (bounds.width - 200) + 100;
    } else {
      this.lineOffset = Math.random() * (bounds.height - 200) + 100;
    }

    if (this.isHorizontal) {
      this.lineVelocity = Math.random() > 0.5 ? this.sweepSpeed : -this.sweepSpeed;

      this.linePos = this.lineVelocity > 0 ? 0 : bounds.height;
    } else {
      this.lineVelocity = Math.random() > 0.5 ? this.sweepSpeed : -this.sweepSpeed;

      this.linePos = this.lineVelocity > 0 ? 0 : bounds.width;
    }

    this.generateLineWithHoles(bounds);
  }

  private generateLineWithHoles(bounds: Bounds): void {
    const numHoles = Math.floor(Math.random() * 2) + 2;
    const lineLength = this.isHorizontal ? bounds.height : bounds.width;
    const numDots = Math.floor((lineLength - 100) / this.dotSpacing);

    const holeSet = new Set<number>();
    const holeWidthDots = Math.ceil(this.holeSize / this.dotSpacing);

    for (let h = 0; h < numHoles; h++) {
      const holeCenter = Math.floor(Math.random() * (numDots - 10)) + 5;
      for (let i = -Math.floor(holeWidthDots / 2); i <= Math.floor(holeWidthDots / 2); i++) {
        holeSet.add(holeCenter + i);
      }
    }

    const startOffset = (lineLength - (numDots * this.dotSpacing)) / 2;

    for (let i = 0; i < numDots; i++) {
      if (!holeSet.has(i)) {
        const offset = startOffset + (i * this.dotSpacing);
        this.pendingSpawns.push({ offset });
      }
    }
  }

  update(dt: number, _playerPosition: Vector2, bounds: Bounds): void {

    if (this.isSpawning) {
      this.spawnCompleteTime += dt * 1000;

      const totalSpawnTime = DOT_SPAWN_ANIMATION_DURATION + (this.pendingSpawns.length * this.spawnDelay);
      if (this.spawnCompleteTime >= totalSpawnTime) {
        this.isSpawning = false;
      }
    }

    if (!this.isSpawning) {
      this.linePos += this.lineVelocity * dt;
      if (this.isHorizontal) {
        if (this.linePos >= bounds.height) {
          this.linePos = bounds.height;
          this.lineVelocity = -this.sweepSpeed;
        } else if (this.linePos <= 0) {
          this.linePos = 0;
          this.lineVelocity = this.sweepSpeed;
        }
      } else {
        if (this.linePos >= bounds.width) {
          this.linePos = bounds.width;
          this.lineVelocity = -this.sweepSpeed;
        } else if (this.linePos <= 0) {
          this.linePos = 0;
          this.lineVelocity = this.sweepSpeed;
        }
      }
    }

    if (this.pendingSpawns.length > 0) {
      this.spawnTimer += dt * 1000;
      const lineLength = this.isHorizontal ? bounds.height : bounds.width;
      while (this.spawnTimer >= this.spawnDelay && this.pendingSpawns.length > 0) {
        this.spawnTimer -= this.spawnDelay;
        const { offset } = this.pendingSpawns.shift()!;

        if (this.isHorizontal) {
          this.spawnDot(
            this.lineOffset + offset - (lineLength / 2),
            this.linePos,
            { x: 0, y: this.lineVelocity }
          );
        } else {
          this.spawnDot(
            this.linePos,
            this.lineOffset + offset - (lineLength / 2),
            { x: this.lineVelocity, y: 0 }
          );
        }
      }
    }

    const velocityX = this.isHorizontal ? 0 : this.lineVelocity;
    const velocityY = this.isHorizontal ? this.lineVelocity : 0;

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];

      if (dot.isFrozen()) {
        dot.update(dt, bounds, _playerPosition);
        continue;
      }


      if (!this.isSpawning) {
        dot.position.x += velocityX * dt;
        dot.position.y += velocityY * dt;
        dot.velocity.x = velocityX;
        dot.velocity.y = velocityY;
        if (this.isHorizontal) {
          dot.position.y = Math.max(0, Math.min(bounds.height, dot.position.y));
        } else {
          dot.position.x = Math.max(0, Math.min(bounds.width, dot.position.x));
        }
      }


      if (this.isHorizontal) {
        if (dot.position.x < -50 || dot.position.x > bounds.width + 50) {
          dot.kill();
        }
      } else {
        if (dot.position.y < -50 || dot.position.y > bounds.height + 50) {
          dot.kill();
        }
      }

      dot.update(dt, bounds, _playerPosition);
    }

    for (let i = this.dots.length - 1; i >= 0; i--) {
      if (this.dots[i].isDead()) {
        this.dots.splice(i, 1);
      }
    }
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration && this.dots.length === 0;
  }
}
