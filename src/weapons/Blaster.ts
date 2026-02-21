import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';

export class Blaster extends Weapon {
  readonly type = WeaponType.BLASTER;

  private state: 'AIMING' | 'FIRING' | 'COMPLETE' = 'AIMING';
  private aimTime: number = 1000;
  private aimStartTime: number = 0;
  private beamPosition: number = 0;
  private prevBeamPosition: number = 0;
  private beamAngle: number = 0;
  private playerPosition: Vector2 = { x: 0, y: 0 };
  private playerAngle: number = 0;
  private beamOriginPosition: Vector2 = { x: 0, y: 0 };

  activate(player: Player, dots: Dot[]): void {
    this.start();
    this.dots = dots;
    this.aimStartTime = Date.now();

    this.playerPosition = player.getPosition();
    this.playerAngle = player.directionAngle;
    this.beamAngle = this.playerAngle;

    this.state = 'AIMING';
  }

  update(dt: number, player: Player, dots: Dot[], bounds: Bounds): void {
    if (this.state === 'COMPLETE') return;

    const elapsed = Date.now() - this.aimStartTime;

    if (this.state === 'AIMING') {
      this.playerPosition = player.getPosition();
      this.playerAngle = player.directionAngle;

      if (elapsed >= this.aimTime) {
        this.state = 'FIRING';
        this.beamAngle = this.playerAngle;
        this.beamOriginPosition = { ...this.playerPosition };
      }
    } else if (this.state === 'FIRING') {
      this.prevBeamPosition = this.beamPosition;
      this.beamPosition += 500 * dt;
      this.checkBeamCollision(dots);
      
      if (this.beamPosition > Math.max(bounds.width, bounds.height)) {
        this.state = 'COMPLETE';
      }
    }
  }

  checkBeamCollision(dots: Dot[]): void {
    if (!dots || dots.length === 0) return;

    const cos = Math.cos(this.beamAngle);
    const sin = Math.sin(this.beamAngle);

    for (const dot of dots) {
      if (!dot.isDead()) {
        const dotPos = dot.getPosition();
        const dotRadius = dot.getRadius();

        const dx = dotPos.x - this.beamOriginPosition.x;
        const dy = dotPos.y - this.beamOriginPosition.y;

        const localX = dx * cos + dy * sin;
        const localY = dx * sin - dy * cos;

        const halfWidth = 50 + dotRadius;
        const halfLength = 100 + dotRadius;

        const inWidth = Math.abs(localY) <= halfWidth;

        if (!inWidth) continue;

        const sweepStart = this.prevBeamPosition - halfLength;
        const sweepEnd = this.beamPosition + halfLength;

        const inSweepRange = localX >= sweepStart && localX <= sweepEnd;

        if (inSweepRange) {
          dot.kill();
          this.addKilledDot();
        }
      }
    }
  }

  render(renderer: Renderer): void {
    if (this.state === 'COMPLETE') return;

    const ctx = renderer.getContext();

    if (this.state === 'AIMING') {
      const x = this.playerPosition.x;
      const y = this.playerPosition.y;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.playerAngle);

      ctx.fillStyle = 'rgb(128, 0, 128)';
      ctx.fillRect(0, -6, 20, 12);

      ctx.restore();
    } else if (this.state === 'FIRING') {
      const x = this.beamOriginPosition.x + this.beamPosition * Math.cos(this.beamAngle);
      const y = this.beamOriginPosition.y + this.beamPosition * Math.sin(this.beamAngle);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.beamAngle);

      ctx.fillStyle = 'rgba(128, 0, 255, 0.78)';
      ctx.fillRect(-5, -75, 10, 150);

      ctx.restore();
    }
  }

  isComplete(): boolean {
    return this.state === 'COMPLETE';
  }
}
