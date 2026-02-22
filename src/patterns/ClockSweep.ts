import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';

interface ClockHand {
  angle: number; // Current rotation angle in radians
  speed: number; // Rotation speed in radians per second
  length: number; // Length of the hand in pixels
  dotCount: number; // Number of dots on this hand
  gaps: number[]; // Indices where dots should be skipped (for gaps)
  dots: Array<{ index: number; distance: number; angleOffset: number }>; // Dot info
}

export class ClockSweep extends Pattern {
  readonly type = PatternType.CLOCK_SWEEP;
  difficulty: Difficulty = Difficulty.MEDIUM;

  private readonly duration: number = 25000; // 25 seconds
  private center: Vector2 = { x: 0, y: 0 };
  private hands: ClockHand[] = [];
  private spawnProgress: number = 0;
  private readonly spawnDuration: number = 2000; // 2 seconds to spawn
  private hasFinishedSpawning: boolean = false;

  // Second hand: fast, long, sparse
  private readonly secondHandSpeed = 1.5; // radians/sec (fast)
  private readonly secondHandLength = 400;
  private readonly secondHandDotCount = 15;

  // Minute hand: still pretty long, slower, with gaps
  private readonly minuteHandSpeed = 0.4; // radians/sec
  private readonly minuteHandLength = 350;
  private readonly minuteHandDotCount = 20;


  // Hour hand: short, dense
  private readonly hourHandSpeed = 0.15; // radians/sec (slow)
  private readonly hourHandLength = 200;
  private readonly hourHandDotCount = 25;

  constructor(difficulty: Difficulty = Difficulty.MEDIUM) {
    super();
    this.difficulty = difficulty;

    // Adjust difficulty
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
      default: // EASY
        this.hands = [
          this.createHand(this.secondHandSpeed * 0.8, this.secondHandLength * 0.9, this.secondHandDotCount - 3, []),
          this.createHand(this.minuteHandSpeed * 0.8, this.minuteHandLength * 0.9, this.minuteHandDotCount - 3, [9, 10]),
          this.createHand(this.hourHandSpeed * 0.8, this.hourHandLength * 0.9, this.hourHandDotCount - 5, []),
        ];
    }
  }

  private createHand(speed: number, length: number, dotCount: number, gapIndices: number[]): ClockHand {
    const dots: Array<{ index: number; distance: number; angleOffset: number }> = [];
    const spacing = length / (dotCount - 1);

    for (let i = 0; i < dotCount; i++) {
      if (gapIndices.includes(i)) continue;
      dots.push({
        index: i,
        distance: i * spacing,
        angleOffset: 0,
      });
    }

    return {
      angle: Math.random() * Math.PI * 2, // Random starting angle
      speed,
      length,
      dotCount,
      gaps: gapIndices,
      dots,
    };
  }

  spawn(center: Vector2, _bounds: Bounds): void {
    this.start();
    this.center = center;
    this.spawnProgress = 0;
    this.hasFinishedSpawning = false;

    // Create all dots at the center initially
    for (const hand of this.hands) {
      for (const _dotInfo of hand.dots) {
        // Spawn dot at center - it will grow outward during spawn animation
        this.spawnDot(this.center.x, this.center.y, { x: 0, y: 0 });
      }
    }
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    // Handle spawn animation
    if (!this.hasFinishedSpawning) {
      this.spawnProgress += dt * 1000;
      if (this.spawnProgress >= this.spawnDuration) {
        this.hasFinishedSpawning = true;
        this.spawnProgress = this.spawnDuration;
      }
    }

    const spawnRatio = this.hasFinishedSpawning ? 1 : this.spawnProgress / this.spawnDuration;

    // Update hand angles
    for (const hand of this.hands) {
      hand.angle += hand.speed * dt;
    }

    // Update all dot positions
    let dotIndex = 0;
    for (const hand of this.hands) {
      for (const dotInfo of hand.dots) {
        if (dotIndex >= this.dots.length) break;

        const dot = this.dots[dotIndex];
        dotIndex++;

        // Skip frozen dots - they stay in place
        if (dot.isFrozen()) {
          dot.update(dt, bounds, playerPosition);
          continue;
        }

        // During spawn animation, keep dot at center
        if (!dot.isLethal()) {
          dot.update(dt, bounds, playerPosition);
          continue;
        }

        // Calculate target position based on hand angle and dot distance
        // Apply spawn ratio to grow outward from center
        const currentDistance = dotInfo.distance * spawnRatio;
        const x = this.center.x + Math.cos(hand.angle) * currentDistance;
        const y = this.center.y + Math.sin(hand.angle) * currentDistance;

        dot.position.x = x;
        dot.position.y = y;

        // Clear velocity (we're controlling position directly)
        dot.velocity.x = 0;
        dot.velocity.y = 0;

        // Continue rotation movement after spawn complete
        if (this.hasFinishedSpawning) {
          // The dots will appear to rotate as we update their positions each frame
          // based on the current hand angle
        }

        dot.update(dt, bounds, playerPosition);
      }
    }

    // Clean up dead dots
    for (let i = this.dots.length - 1; i >= 0; i--) {
      if (this.dots[i].isDead()) {
        this.dots.splice(i, 1);
        // Also need to remove from hand.dots - but for simplicity, we just skip dead dots above
      }
    }
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration && this.dots.length === 0;
  }
}
