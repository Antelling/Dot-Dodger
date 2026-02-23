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

  // Beam dimensions - must match visual rendering exactly
  private readonly BEAM_WIDTH = 10;  // Visual width, perpendicular to beam direction
  private readonly BEAM_LENGTH = 150;
  private readonly BEAM_SPEED = 600;

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
      this.beamPosition += this.BEAM_SPEED * dt;
      this.checkBeamCollision(dots);
      // Continue beam well past screen edge for better visibility
      const maxDistance = Math.max(bounds.width, bounds.height) * 1.5;
      if (this.beamPosition > maxDistance) {
        this.state = 'COMPLETE';
      }
    }
  }

  checkBeamCollision(dots: Dot[]): void {
    if (!dots || dots.length === 0) return;
    const cos = Math.cos(this.beamAngle);
    const sin = Math.sin(this.beamAngle);
    // Beam dimensions match visual exactly, small tolerance for dot radius
    const halfWidth = this.BEAM_WIDTH / 2 + 2;  // 7px half-width
    const halfLength = this.BEAM_LENGTH / 2 + 2;  // 77px half-length
    for (const dot of dots) {
      if (!dot.isDead()) {
        const dotPos = dot.getPosition();
        const dotRadius = dot.getRadius();
        // Transform dot position to beam-local coordinates
        // In rotated frame where beam is drawn:
        //   localX = distance along beam sweep direction (beam is 10px long in this axis)
        //   localY = distance perpendicular to beam (beam is 150px wide in this axis)
        const dx = dotPos.x - this.beamOriginPosition.x;
        const dy = dotPos.y - this.beamOriginPosition.y;
        const localX = dx * cos + dy * sin;  // along beam sweep direction
        const localY = -dx * sin + dy * cos; // perpendicular to beam (width)

        // Check if dot is within beam width (perpendicular) - 150px wide
        if (Math.abs(localY) > halfLength + dotRadius) continue;

        // The beam sweeps along localX, centered at beamPosition, extending ±halfWidth (5px)
        const beamFront = this.beamPosition + halfWidth;
        const beamBack = this.beamPosition - halfWidth;
        const prevBeamFront = this.prevBeamPosition + halfWidth;
        const prevBeamBack = this.prevBeamPosition - halfWidth;

        // Dot is hit if it overlaps with the beam's swept area
        const sweepStart = Math.min(beamBack, prevBeamBack);
        const sweepEnd = Math.max(beamFront, prevBeamFront);

        if (localX >= sweepStart && localX <= sweepEnd) {
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
