import { Dot } from '../entities/Dot';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';

export abstract class Pattern {
  abstract readonly type: PatternType;
  abstract readonly difficulty: Difficulty;

  protected dots: Dot[] = [];
  protected elapsedMs: number = 0;
  protected isStarted: boolean = false;

  abstract spawn(center: Vector2, bounds: Bounds): void;
  abstract update(dt: number, playerPosition: Vector2, bounds: Bounds): void;

  getDots(): Dot[] {
    return this.dots.filter(d => !d.isDead());
  }

  isComplete(): boolean {
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

  clear(): void {
    for (let i = 0; i < this.dots.length; i++) {
      this.dots[i].kill();
    }
    this.dots = [];
  }
}
