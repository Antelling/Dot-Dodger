import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';
import { toastManager } from '../game/ToastManager';
import { WEAPON_ORB_RADIUS } from '../utils/constants';

export class NuclearBomb extends Weapon {
  readonly type = WeaponType.NUCLEAR_BOMB;

  private state: 'DRIFTING' | 'EXPLODING' | 'COMPLETE' = 'DRIFTING';
  private orbPosition: Vector2 = { x: 0, y: 0 };
  private orbVelocity: Vector2 = { x: 0, y: 0 };
  private readonly fuseTime: number = 4000;
  private collisionCount: number = 0;
  private explosionRadius: number = 0;
  private explosionStartTime: number = 0;
  private killedDotsInExplosion: Set<Dot> = new Set();
  private _hasKilledPlayer: boolean = false;
  private bounds: Bounds | null = null;

  private readonly flashInterval: number = 100;
  private readonly flashGap: number = 400;
  private lastCollisionTime: number = 0;
  private readonly collisionCooldown: number = 100;
  private readonly orbRadius: number = WEAPON_ORB_RADIUS;

  activate(player: Player, _dots: Dot[]): void {
    this.dots = _dots;
    this.start();
    this.orbPosition = { x: player.position.x, y: player.position.y };
    this.orbVelocity = { x: 0, y: 0 };
  }

  handlePlayerCollision(player: Player, playerVelocity: Vector2): boolean {
    const now = Date.now();
    if (now - this.lastCollisionTime < this.collisionCooldown) {
      return false;
    }
    this.lastCollisionTime = now;

    const dx = this.orbPosition.x - player.position.x;
    const dy = this.orbPosition.y - player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const minSpeed = 50;
    const playerSpeed = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.y ** 2);

    if (playerSpeed < minSpeed) {
      return false;
    }

    if (distance === 0) {
      this.orbVelocity.x = playerVelocity.x;
      this.orbVelocity.y = playerVelocity.y;
      return true;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const tx = -ny;
    const ty = nx;

    const vDotN = playerVelocity.x * nx + playerVelocity.y * ny;
    const vDotT = playerVelocity.x * tx + playerVelocity.y * ty;

    const directness = vDotN / playerSpeed;

    if (directness < 0.1) {
      return false;
    }

    if (directness > 0.7) {
      this.orbVelocity.x = playerVelocity.x;
      this.orbVelocity.y = playerVelocity.y;
    } else {
      const forwardFactor = directness;
      const sidewaysFactor = 1 - directness;

      this.orbVelocity.x = (nx * vDotN * forwardFactor + tx * vDotT * sidewaysFactor);
      this.orbVelocity.y = (ny * vDotN * forwardFactor + ty * vDotT * sidewaysFactor);
    }

    return true;
  }

  getPosition(): Vector2 {
    return this.orbPosition;
  }

  getRadius(): number {
    return this.orbRadius;
  }

  isActive(): boolean {
    return this.state !== 'COMPLETE';
  }

  update(dt: number, player: Player, dots: Dot[], bounds: Bounds): void {
    this.bounds = bounds;

    switch (this.state) {
      case 'DRIFTING': {
        const elapsedTime = this.getElapsedTime();

        this.orbPosition.x += this.orbVelocity.x * dt;
        this.orbPosition.y += this.orbVelocity.y * dt;

        const minX = this.orbRadius;
        const maxX = bounds.width - this.orbRadius;
        const minY = this.orbRadius;
        const maxY = bounds.height - this.orbRadius;

        if (this.orbPosition.x <= minX) {
          this.orbVelocity.x = Math.abs(this.orbVelocity.x);
          this.orbPosition.x = minX;
          this.collisionCount++;
        } else if (this.orbPosition.x >= maxX) {
          this.orbVelocity.x = -Math.abs(this.orbVelocity.x);
          this.orbPosition.x = maxX;
          this.collisionCount++;
        }

        if (this.orbPosition.y <= minY) {
          this.orbVelocity.y = Math.abs(this.orbVelocity.y);
          this.orbPosition.y = minY;
          this.collisionCount++;
        } else if (this.orbPosition.y >= maxY) {
          this.orbVelocity.y = -Math.abs(this.orbVelocity.y);
          this.orbPosition.y = maxY;
          this.collisionCount++;
        }

        if (elapsedTime >= this.fuseTime || this.collisionCount >= 3) {
          this.state = 'EXPLODING';
          this.explosionStartTime = Date.now();
          this.explosionRadius = 0.35 * bounds.width;
          toastManager.show('Nuclear Bomb detonated!', 'warning');
          this.killDotsInExplosion(dots);
          this.checkAndKillPlayer(player);
        }
        break;
      }
      case 'EXPLODING': {
        const explosionElapsed = Date.now() - this.explosionStartTime;
        if (explosionElapsed > 500) {
          this.state = 'COMPLETE';
        }
        break;
      }
      case 'COMPLETE': {
        break;
      }
    }
  }

  render(renderer: Renderer): void {
    if (!this.bounds) return;

    switch (this.state) {
      case 'DRIFTING': {
        const elapsedTime = this.getElapsedTime();
        const progress = Math.min(elapsedTime / this.fuseTime, 1);
        const color = this.interpolateColor('#FF6600', '#FF0000', progress);

        const warningExplosionRadius = 0.35 * this.bounds.width;

        const ctx = renderer.getContext();

        const warningStartTime = this.fuseTime - 1500;
        if (elapsedTime >= warningStartTime) {
          const warningElapsed = elapsedTime - warningStartTime;
          const flash1Start = 0;
          const flash2Start = this.flashInterval + this.flashGap;

          let shouldShowFlash = false;

          if (warningElapsed >= flash1Start && warningElapsed < flash1Start + this.flashInterval) {
            shouldShowFlash = true;
          } else if (warningElapsed >= flash2Start && warningElapsed < flash2Start + this.flashInterval) {
            shouldShowFlash = true;
          }

          if (shouldShowFlash) {
            ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(this.orbPosition.x, this.orbPosition.y, warningExplosionRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        renderer.drawCircleImmediate(
          this.orbPosition.x,
          this.orbPosition.y,
          this.orbRadius,
          color
        );

        ctx.strokeStyle = '#9B30FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.orbPosition.x, this.orbPosition.y, this.orbRadius + 2, 0, Math.PI * 2);
        ctx.stroke();

        this.drawNuclearIcon(ctx, this.orbPosition.x, this.orbPosition.y, this.orbRadius * 0.5);
        break;
      }
      case 'EXPLODING': {
        const explosionElapsed = Date.now() - this.explosionStartTime;
        if (explosionElapsed <= 500) {
          const alpha = 0.8 - (explosionElapsed / 500) * 0.8;
          renderer.drawCircle(
            this.orbPosition.x,
            this.orbPosition.y,
            this.explosionRadius,
            `rgba(255, 0, 0, ${alpha})`
          );
        }
        break;
      }
      case 'COMPLETE': {
        break;
      }
    }
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private drawNuclearIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    const skullScale = scale * 0.7;

    ctx.beginPath();
    ctx.arc(x, y - skullScale * 0.1, skullScale * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - skullScale * 0.2, y - skullScale * 0.15, skullScale * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + skullScale * 0.2, y - skullScale * 0.15, skullScale * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y + skullScale * 0.05);
    ctx.lineTo(x - skullScale * 0.08, y + skullScale * 0.2);
    ctx.lineTo(x + skullScale * 0.08, y + skullScale * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.rect(x - skullScale * 0.25, y + skullScale * 0.25, skullScale * 0.5, skullScale * 0.2);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 2; i++) {
      const teethX = x - skullScale * 0.08 * i;
      ctx.beginPath();
      ctx.moveTo(teethX, y + skullScale * 0.25);
      ctx.lineTo(teethX, y + skullScale * 0.45);
      ctx.stroke();

      const teethX2 = x + skullScale * 0.08 * i;
      ctx.beginPath();
      ctx.moveTo(teethX2, y + skullScale * 0.25);
      ctx.lineTo(teethX2, y + skullScale * 0.45);
      ctx.stroke();
    }

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x - skullScale * 0.7, y - skullScale * 0.5);
    ctx.lineTo(x + skullScale * 0.7, y + skullScale * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + skullScale * 0.7, y - skullScale * 0.5);
    ctx.lineTo(x - skullScale * 0.7, y + skullScale * 0.5);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    const boneEndRadius = skullScale * 0.1;
    const boneEnds = [
      { x: x - skullScale * 0.7, y: y - skullScale * 0.5 },
      { x: x + skullScale * 0.7, y: y + skullScale * 0.5 },
      { x: x + skullScale * 0.7, y: y - skullScale * 0.5 },
      { x: x - skullScale * 0.7, y: y + skullScale * 0.5 }
    ];

    for (const end of boneEnds) {
      ctx.beginPath();
      ctx.arc(end.x, end.y, boneEndRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  isComplete(): boolean {
    return this.state === 'COMPLETE';
  }

  hasKilledPlayer(): boolean {
    return this._hasKilledPlayer;
  }

  private killDotsInExplosion(dots: Dot[]): void {
    for (const dot of dots) {
      if (dot.isDead() || this.killedDotsInExplosion.has(dot)) continue;

      const pos = dot.getPosition();
      const dx = pos.x - this.orbPosition.x;
      const dy = pos.y - this.orbPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.explosionRadius) {
        dot.kill();
        this.addKilledDot();
        this.killedDotsInExplosion.add(dot);
      }
    }
  }

  private checkAndKillPlayer(player: Player): void {
    if (this._hasKilledPlayer) return;

    const dx = player.position.x - this.orbPosition.x;
    const dy = player.position.y - this.orbPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.explosionRadius) {
      this._hasKilledPlayer = true;
    }
  }
}
