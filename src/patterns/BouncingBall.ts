import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';
import { DOT_RADIUS } from '../utils/constants';

interface DotOffset {
  x: number;
  y: number;
}

export class BouncingBall extends Pattern {
  readonly type = PatternType.BOUNCING_BALL;
  difficulty: Difficulty = Difficulty.MEDIUM;

  private readonly duration: number = 30000;
  private readonly ballRadius: number = 120;
  private readonly dotCount: number = 200;
  private centerPosition: Vector2 = { x: 0, y: 0 };
  private centerVelocity: Vector2 = { x: 0, y: 0 };
  private dotOffsets: DotOffset[] = [];
  private speed: number = 120;

  constructor(difficulty: Difficulty = Difficulty.MEDIUM) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.speed = 180;
        break;
      case Difficulty.MEDIUM:
        this.speed = 120;
        break;
      default:
        this.speed = 80;
    }
  }

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();
    this.centerPosition = {
      x: bounds.width / 2,
      y: bounds.height / 2
    };

    const angle = Math.random() * Math.PI * 2;
    this.centerVelocity = {
      x: Math.cos(angle) * this.speed,
      y: Math.sin(angle) * this.speed
    };

    this.spawnDots();
  }

  private spawnDots(): void {
    this.dotOffsets = [];

    const dotsPerRing = 20;
    const ringCount = Math.ceil(this.dotCount / dotsPerRing);

    for (let ring = 0; ring < ringCount; ring++) {
      const ringRadius = (this.ballRadius * (ring + 1)) / ringCount;
      const dotsInThisRing = Math.min(dotsPerRing, this.dotCount - this.dotOffsets.length);

      for (let i = 0; i < dotsInThisRing; i++) {
        const angle = (i / dotsInThisRing) * Math.PI * 2;
        this.dotOffsets.push({
          x: Math.cos(angle) * ringRadius,
          y: Math.sin(angle) * ringRadius
        });
      }

      if (this.dotOffsets.length >= this.dotCount) break;
    }

    for (let i = 0; i < this.dotOffsets.length; i++) {
      const offset = this.dotOffsets[i];
      this.spawnDot(
        this.centerPosition.x + offset.x,
        this.centerPosition.y + offset.y,
        { x: this.centerVelocity.x, y: this.centerVelocity.y }
      );
    }
  }

  update(dt: number, _playerPosition: Vector2, bounds: Bounds): void {
    this.centerPosition.x += this.centerVelocity.x * dt;
    this.centerPosition.y += this.centerVelocity.y * dt;

    const minX = this.ballRadius + DOT_RADIUS;
    const maxX = bounds.width - this.ballRadius - DOT_RADIUS;
    const minY = this.ballRadius + DOT_RADIUS;
    const maxY = bounds.height - this.ballRadius - DOT_RADIUS;

    if (this.centerPosition.x <= minX) {
      this.centerPosition.x = minX;
      this.centerVelocity.x = Math.abs(this.centerVelocity.x);
    } else if (this.centerPosition.x >= maxX) {
      this.centerPosition.x = maxX;
      this.centerVelocity.x = -Math.abs(this.centerVelocity.x);
    }

    if (this.centerPosition.y <= minY) {
      this.centerPosition.y = minY;
      this.centerVelocity.y = Math.abs(this.centerVelocity.y);
    } else if (this.centerPosition.y >= maxY) {
      this.centerPosition.y = maxY;
      this.centerVelocity.y = -Math.abs(this.centerVelocity.y);
    }

    for (let i = 0; i < this.dots.length; i++) {
      const dot = this.dots[i];
      
      // Skip frozen dots - they should not move
      if (dot.isFrozen()) {
        dot.update(dt, bounds, _playerPosition);
        continue;
      }
      
      const offset = this.dotOffsets[i];

      if (offset && !dot.isDead()) {
        // Calculate where the dot should be (expected position)
        const expectedX = this.centerPosition.x + offset.x;
        const expectedY = this.centerPosition.y + offset.y;
        
        // Calculate displacement caused by external forces (like DotRepellent)
        const displacementX = dot.position.x - expectedX;
        const displacementY = dot.position.y - expectedY;
        
        // Apply displacement to center position (allows DotRepellent to push the ball)
        this.centerPosition.x += displacementX;
        this.centerPosition.y += displacementY;
        
        // Re-calculate expected position after center displacement
        const newExpectedX = this.centerPosition.x + offset.x;
        const newExpectedY = this.centerPosition.y + offset.y;
        
        // Set dot to its proper relative position in the formation
        dot.position.x = newExpectedX;
        dot.position.y = newExpectedY;
        dot.velocity.x = this.centerVelocity.x;
        dot.velocity.y = this.centerVelocity.y;
      }

      dot.update(dt, bounds, _playerPosition);
    }
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration && this.getDots().length === 0;
  }
}
