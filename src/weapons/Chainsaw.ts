import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';

export class Chainsaw extends Weapon {
  readonly type = WeaponType.CHAINSAW;

  private readonly duration: number = 5000;
  private readonly chainsawRadius: number = 50;
  private playerPosition: Vector2 = { x: 0, y: 0 };

  activate(player: Player, _dots: Dot[]): void {
    this.start();
    this.playerPosition = player.getPosition();
  }

  update(_dt: number, player: Player, dots: Dot[], _bounds: Bounds): void {
    if (this.getElapsedTime() >= this.duration) return;
    if (!dots || dots.length === 0) return;
    this.playerPosition = player.getPosition();

    for (const dot of dots) {
      if (!dot.isLethal()) continue;
      const pos = dot.getPosition();
      const dx = pos.x - this.playerPosition.x;
      const dy = pos.y - this.playerPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.chainsawRadius) {
        dot.kill();
        this.addKilledDot();
      }
    }
  }

  render(renderer: Renderer): void {
    renderer.drawCircle(this.playerPosition.x, this.playerPosition.y, this.chainsawRadius, 'rgba(255, 100, 0, 0.6)');
  }

  isComplete(): boolean {
    return this.getElapsedTime() >= this.duration;
  }

  getChainsawRadius(): number {
    return this.chainsawRadius;
  }
}
