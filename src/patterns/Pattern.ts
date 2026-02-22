import { Dot } from '../entities/Dot';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';
import { Renderer } from '../renderer/Renderer';

export abstract class Pattern {
  abstract readonly type: PatternType;
  abstract readonly difficulty: Difficulty;

  protected dots: Dot[] = [];
  protected elapsedMs: number = 0;
  protected isStarted: boolean = false;

  abstract spawn(center: Vector2, bounds: Bounds): void;
  abstract update(dt: number, playerPosition: Vector2, bounds: Bounds): void;

  /**
   * Centralized dot spawning method.
   * Creates a dot with a spawn animation and optional initial velocity.
   * The dot will be non-lethal during the spawn animation (500ms),
   * then become active with the provided velocity.
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param velocity - Initial velocity (applied once spawn completes)
   * @returns The created Dot instance
   */
  protected spawnDot(x: number, y: number, velocity: Vector2 = { x: 0, y: 0 }): Dot {
    const dot = new Dot(x, y, this.type);
    dot.velocity.x = velocity.x;
    dot.velocity.y = velocity.y;
    this.dots.push(dot);
    return dot;
  }

  getDots(): Dot[] {
    return this.dots.filter(d => !d.isDead());
  }

  isComplete(): boolean {
    return false;
  }

  /**
   * Returns true if the pattern is still actively spawning dots.
   * Override in subclasses that spawn dots over time.
   */
  isActivelySpawning(): boolean {
    return false;
  }

  start(): void {
    this.elapsedMs = 0;
    this.isStarted = true;
  }

  getElapsedTime(): number {
    return this.elapsedMs;
  }

  tick(dt: number): void {
    this.elapsedMs += dt * 1000;
  }

  render(_renderer: Renderer): void {
    // Override in subclasses to render pattern-specific visuals (e.g., warning indicators)
  }

  clear(): void {
    for (let i = 0; i < this.dots.length; i++) {
      this.dots[i].kill();
    }
    this.dots = [];
  }
}
