import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';

export class DotRepellent extends Weapon {
  readonly type = WeaponType.DOT_REPELLENT;

  private readonly duration: number = 8000;
  private readonly fieldRadius: number = 100;
  private playerPosition: Vector2 = { x: 0, y: 0 };

  activate(player: Player, _dots: Dot[]): void {
    this.start();
    this.dots = [];
    this.playerPosition = player.getPosition();
  }

  update(_dt: number, player: Player, dots: Dot[], _bounds: Bounds): void {
    const elapsed = this.getElapsedTime();
    if (elapsed >= this.duration) return;
    if (!dots || dots.length === 0) return;

    this.playerPosition = player.getPosition();

    for (const dot of dots) {
      if (dot.isDead() || dot.isFrozen()) continue;

      const dotPos = dot.getPosition();
      const dx = dotPos.x - this.playerPosition.x;
      const dy = dotPos.y - this.playerPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.fieldRadius && distance > 0) {
        const push = 5 * (1 - distance / this.fieldRadius);
        dot.position.x += (dx / distance) * push;
        dot.position.y += (dy / distance) * push;
      }
    }
  }

  render(_renderer: Renderer): void {
    const ctx = _renderer.getContext();

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      this.playerPosition.x,
      this.playerPosition.y,
      this.fieldRadius,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  isComplete(): boolean {
    return this.getElapsedTime() >= this.duration;
  }
}
