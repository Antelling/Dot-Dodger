import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';

export class SweeperLine extends Pattern {
  readonly type = PatternType.SWEEPER_LINE;
  difficulty: Difficulty = Difficulty.EASY;

  private readonly duration: number = 20000;
  private readonly dotSpacing: number = 20;
  private readonly holeSize: number = 40; // Size of each hole in pixels

  private isHorizontal: boolean = true;
  private lineVelocity: number = 0;
  private sweepSpeed: number = 150;
  // For horizontal line: this is the Y position (sweeps up/down), offset is X
  // For vertical line: this is the X position (sweeps left/right), offset is Y
  private linePos: number = 0;
  private lineOffset: number = 0;
  private dotOffsets: number[] = []; // Fixed offsets for each dot along the line

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

    // Randomly choose horizontal or vertical orientation
    this.isHorizontal = Math.random() > 0.5;

    // Random offset position for the line (where it sits on the perpendicular axis)
    if (this.isHorizontal) {
      // Horizontal line at random X position, sweeps up/down
      this.lineOffset = Math.random() * (bounds.width - 200) + 100;
    } else {
      // Vertical line at random Y position, sweeps left/right
      this.lineOffset = Math.random() * (bounds.height - 200) + 100;
    }

    // Start at one edge and sweep toward the other
    if (this.isHorizontal) {
      // Start at top or bottom
      this.lineVelocity = Math.random() > 0.5 ? this.sweepSpeed : -this.sweepSpeed;
      this.linePos = this.lineVelocity > 0 ? -50 : bounds.height + 50;
    } else {
      // Start at left or right
      this.lineVelocity = Math.random() > 0.5 ? this.sweepSpeed : -this.sweepSpeed;
      this.linePos = this.lineVelocity > 0 ? -50 : bounds.width + 50;
    }

    // Generate the line with holes
    this.generateLineWithHoles(bounds);
  }

  private generateLineWithHoles(bounds: Bounds): void {
    const numHoles = Math.floor(Math.random() * 2) + 2; // 2-3 holes
    const lineLength = this.isHorizontal ? bounds.height : bounds.width;
    const numDots = Math.floor((lineLength - 100) / this.dotSpacing);

    // Generate hole positions (indices where dots should NOT spawn)
    const holeSet = new Set<number>();
    const holeWidthDots = Math.ceil(this.holeSize / this.dotSpacing);

    for (let h = 0; h < numHoles; h++) {
      // Random position along the line, avoiding edges
      const holeCenter = Math.floor(Math.random() * (numDots - 10)) + 5;
      for (let i = -Math.floor(holeWidthDots / 2); i <= Math.floor(holeWidthDots / 2); i++) {
        holeSet.add(holeCenter + i);
      }
    }

    // Spawn dots at fixed offsets along the line
    const startOffset = (lineLength - (numDots * this.dotSpacing)) / 2;

    for (let i = 0; i < numDots; i++) {
      if (!holeSet.has(i)) {
        const offset = startOffset + (i * this.dotSpacing);
        this.dotOffsets.push(offset);

        // Spawn dot - it will be positioned correctly in the first update
        if (this.isHorizontal) {
          // Horizontal line: dots vary in X (offset), same Y (sweeps)
          this.spawnDot(this.lineOffset + offset - (lineLength / 2), this.linePos, { x: 0, y: 0 });
        } else {
          // Vertical line: dots vary in Y (offset), same X (sweeps)
          this.spawnDot(this.linePos, this.lineOffset + offset - (lineLength / 2), { x: 0, y: 0 });
        }
      }
    }
  }

  update(dt: number, _playerPosition: Vector2, bounds: Bounds): void {
    // Move the line
    this.linePos += this.lineVelocity * dt;

    // Reverse direction when we go off-screen (sweep back and forth forever)
    if (this.isHorizontal) {
      if (this.lineVelocity > 0 && this.linePos > bounds.height + 50) {
        this.lineVelocity = -this.sweepSpeed;
      } else if (this.lineVelocity < 0 && this.linePos < -50) {
        this.lineVelocity = this.sweepSpeed;
      }
    } else {
      if (this.lineVelocity > 0 && this.linePos > bounds.width + 50) {
        this.lineVelocity = -this.sweepSpeed;
      } else if (this.lineVelocity < 0 && this.linePos < -50) {
        this.lineVelocity = this.sweepSpeed;
      }
    }

    // Update all dot positions to maintain formation
    const lineLength = this.isHorizontal ? bounds.height : bounds.width;
    for (let i = 0; i < this.dots.length; i++) {
      const dot = this.dots[i];
      const offset = this.dotOffsets[i];

      // Keep dots in formation - position them along the moving line
      if (this.isHorizontal) {
        // Horizontal line: X varies by offset, Y is the sweeping position
        dot.position.x = this.lineOffset + offset - (lineLength / 2);
        dot.position.y = this.linePos;
      } else {
        // Vertical line: Y varies by offset, X is the sweeping position
        dot.position.x = this.linePos;
        dot.position.y = this.lineOffset + offset - (lineLength / 2);
      }

      // Call update for state management (spawn animations, etc)
      dot.update(dt, bounds, _playerPosition);
    }

    // Clean up dead dots
    for (let i = this.dots.length - 1; i >= 0; i--) {
      if (this.dots[i].isDead()) {
        this.dots.splice(i, 1);
        this.dotOffsets.splice(i, 1);
      }
    }
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration && this.dots.length === 0;
  }
}
