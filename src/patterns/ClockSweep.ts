import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';
import { Dot } from '../entities/Dot';

interface ClockHand {
  angle: number;
  speed: number;
  length: number;
  dotCount: number;
  gaps: number[];
  dots: Array<{ index: number; distance: number; dot: Dot | null }>;
}

export class ClockSweep extends Pattern {
  readonly type = PatternType.CLOCK_SWEEP;
  difficulty: Difficulty = Difficulty.MEDIUM;

  private readonly duration: number = 25000;
  private center: Vector2 = { x: 0, y: 0 };
  private hands: ClockHand[] = [];
  private spawnProgress: number = 0;
  private readonly spawnDuration: number = 3500;
  private hasFinishedSpawning: boolean = false;

  private readonly secondHandSpeed = 0.5;
  private readonly secondHandLength = 400;
  private readonly secondHandDotCount = 15;

  private readonly minuteHandSpeed = 0.4;
  private readonly minuteHandLength = 350;
  private readonly minuteHandDotCount = 20;

  private readonly hourHandSpeed = 0.15;
  private readonly hourHandLength = 200;
  private readonly hourHandDotCount = 25;

  constructor(difficulty: Difficulty = Difficulty.MEDIUM) {
    super();
    this.difficulty = difficulty;

    switch (difficulty) {
      case Difficulty.HARD:
        this.hands = [
          this.createHand(this.secondHandSpeed * 1.3, this.secondHandLength, this.secondHandDotCount, []),
          this.createHand(this.minuteHandSpeed * 1.2, this.minuteHandLength, this.minuteHandDotCount, [8, 9, 10]),
          this.createHand(this.hourHandSpeed * 1.2, this.hourHandLength, this.hourHandDotCount + 5, []),
        ];
        break;
      case Difficulty.MEDIUM:
        this.hands = [
          this.createHand(this.secondHandSpeed, this.secondHandLength, this.secondHandDotCount, []),
          this.createHand(this.minuteHandSpeed, this.minuteHandLength, this.minuteHandDotCount, [9, 10, 11]),
          this.createHand(this.hourHandSpeed, this.hourHandLength, this.hourHandDotCount, []),
        ];
        break;
      default:
        this.hands = [
          this.createHand(this.secondHandSpeed * 0.8, this.secondHandLength * 0.9, this.secondHandDotCount - 3, []),
          this.createHand(this.minuteHandSpeed * 0.8, this.minuteHandLength * 0.9, this.minuteHandDotCount - 3, [9, 10]),
          this.createHand(this.hourHandSpeed * 0.8, this.hourHandLength * 0.9, this.hourHandDotCount - 5, []),
        ];
    }
  }

  private createHand(speed: number, length: number, dotCount: number, gapIndices: number[]): ClockHand {
    const dots: Array<{ index: number; distance: number; dot: Dot | null }> = [];
    const spacing = length / (dotCount - 1);

    for (let i = 0; i < dotCount; i++) {
      if (gapIndices.includes(i)) continue;
      dots.push({
        index: i,
        distance: i * spacing,
        dot: null,
      });
    }

    return {
      angle: Math.random() * Math.PI * 2,
      speed,
      length,
      dotCount,
      gaps: gapIndices,
      dots,
    };
  }

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();
    this.center = { x: bounds.width / 2, y: bounds.height / 2 };
    this.spawnProgress = 0;
    this.hasFinishedSpawning = false;

    for (const hand of this.hands) {
      for (const dotInfo of hand.dots) {
        const x = this.center.x + Math.cos(hand.angle) * dotInfo.distance;
        const y = this.center.y + Math.sin(hand.angle) * dotInfo.distance;
        const dot = this.spawnDot(x, y, { x: 0, y: 0 });
        dotInfo.dot = dot;
      }
    }
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    if (!this.hasFinishedSpawning) {
      this.spawnProgress += dt * 1000;
      if (this.spawnProgress >= this.spawnDuration) {
        this.hasFinishedSpawning = true;
      }
    }

    for (const hand of this.hands) {
      hand.angle += hand.speed * dt;
    }

    for (const hand of this.hands) {
      for (const dotInfo of hand.dots) {
        const dot = dotInfo.dot;

        if (!dot || dot.isDead()) {
          continue;
        }

        if (dot.isFrozen()) {
          dot.update(dt, bounds, playerPosition);
          continue;
        }

        if (!this.hasFinishedSpawning) {
          dot.update(dt, bounds, playerPosition);
          continue;
        }

        const dx = dot.position.x - this.center.x;
        const dy = dot.position.y - this.center.y;
        
        const tangentialVx = -hand.speed * dy;
        const tangentialVy = hand.speed * dx;

        dot.position.x += tangentialVx * dt;
        dot.position.y += tangentialVy * dt;
        dot.velocity.x = tangentialVx;
        dot.velocity.y = tangentialVy;

        dot.update(dt, bounds, playerPosition);
      }
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
