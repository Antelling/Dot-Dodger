import { Dot } from '../entities/Dot';
import { WeaponType, Bounds } from '../types';
import type { Player } from '../entities/Player';
import type { Renderer } from '../renderer/Renderer';

export abstract class Weapon {
  abstract readonly type: WeaponType;

  protected dots: Dot[] = [];
  protected startTime: number = 0;
  protected isStarted: boolean = false;
  protected killedDots: number = 0;

  abstract activate(player: Player, dots: Dot[]): void;
  abstract update(dt: number, player: Player, dots: Dot[], bounds: Bounds): void;
  abstract render(renderer: Renderer): void;

  getDots(): Dot[] {
    return this.dots.filter(d => !d.isDead());
  }

  isComplete(): boolean {
    return false;
  }

  start(): void {
    this.startTime = Date.now();
    this.isStarted = true;
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  clear(): void {
    for (const dot of this.dots) {
      dot.kill();
    }
    this.dots = [];
  }

  getKilledDots(): number {
    return this.killedDots;
  }

  addKilledDot(): void {
    this.killedDots++;
  }
}
