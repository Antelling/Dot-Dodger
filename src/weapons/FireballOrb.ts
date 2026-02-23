import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';
import { WEAPON_ORB_RADIUS } from '../utils/constants';

interface FirePoint {
  x: number;
  y: number;
  createdAt: number;
}

export class FireballOrb extends Weapon {
  readonly type = WeaponType.FIREBALL_ORB;

  private state: 'DRIFTING' | 'FIZZLING' | 'COMPLETE' = 'DRIFTING';
  private orbPosition: Vector2 = { x: 0, y: 0 };
  private orbVelocity: Vector2 = { x: 0, y: 0 };
  private bounds: Bounds | null = null;

  private readonly activeDuration: number = 2500;
  private readonly fireDuration: number = 10000;
  private fizzleStartTime: number = 0;

  private firePoints: FirePoint[] = [];
  private readonly fireTrailWidth: number = 12;
  private readonly orbRadius: number = WEAPON_ORB_RADIUS * 0.6;

  private lastSegmentPosition: Vector2 = { x: 0, y: 0 };
  private readonly minSegmentDistance: number = 15;

  private lastCollisionTime: number = 0;
  private readonly collisionCooldown: number = 100;

  activate(player: Player, _dots: Dot[], initialPosition?: { x: number; y: number }): void {
    this.dots = _dots;
    this.start();

    if (initialPosition) {
      this.orbPosition = { x: initialPosition.x, y: initialPosition.y };
    } else {
      const playerSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
      if (playerSpeed > 10) {
        const dirX = player.velocity.x / playerSpeed;
        const dirY = player.velocity.y / playerSpeed;
        const offset = player.hitboxRadius + this.orbRadius + 5;
        this.orbPosition = {
          x: player.position.x + dirX * offset,
          y: player.position.y + dirY * offset
        };
      } else {
        this.orbPosition = { x: player.position.x, y: player.position.y - player.hitboxRadius - this.orbRadius - 5 };
      }
    }
    this.orbVelocity = { x: 0, y: 0 };
    this.lastSegmentPosition = { ...this.orbPosition };
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

    const velocityMultiplier = 2.2;

    if (directness > 0.7) {
      this.orbVelocity.x = playerVelocity.x * velocityMultiplier;
      this.orbVelocity.y = playerVelocity.y * velocityMultiplier;
    } else {
      const forwardFactor = directness;
      const sidewaysFactor = 1 - directness;

      this.orbVelocity.x = (nx * vDotN * forwardFactor + tx * vDotT * sidewaysFactor) * velocityMultiplier;
      this.orbVelocity.y = (ny * vDotN * forwardFactor + ty * vDotT * sidewaysFactor) * velocityMultiplier;
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
    return this.state === 'DRIFTING';
  }

  update(dt: number, _player: Player, _dots: Dot[], bounds: Bounds): void {
    this.bounds = bounds;
    const now = Date.now();

    const cutoffTime = now - this.fireDuration;
    this.firePoints = this.firePoints.filter(p => p.createdAt > cutoffTime);

    if (this.state === 'DRIFTING') {
      this.orbPosition.x += this.orbVelocity.x * dt;
      this.orbPosition.y += this.orbVelocity.y * dt;

      const minX = this.orbRadius;
      const maxX = bounds.width - this.orbRadius;
      const minY = this.orbRadius;
      const maxY = bounds.height - this.orbRadius;

      if (this.orbPosition.x <= minX) {
        this.orbVelocity.x = Math.abs(this.orbVelocity.x);
        this.orbPosition.x = minX;
      } else if (this.orbPosition.x >= maxX) {
        this.orbVelocity.x = -Math.abs(this.orbVelocity.x);
        this.orbPosition.x = maxX;
      }

      if (this.orbPosition.y <= minY) {
        this.orbVelocity.y = Math.abs(this.orbVelocity.y);
        this.orbPosition.y = minY;
      } else if (this.orbPosition.y >= maxY) {
        this.orbVelocity.y = -Math.abs(this.orbVelocity.y);
        this.orbPosition.y = maxY;
      }

      const speed = Math.sqrt(this.orbVelocity.x ** 2 + this.orbVelocity.y ** 2);
      if (speed > 10) {
        const dx = this.orbPosition.x - this.lastSegmentPosition.x;
        const dy = this.orbPosition.y - this.lastSegmentPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist >= this.minSegmentDistance) {
          this.firePoints.push({
            x: this.orbPosition.x,
            y: this.orbPosition.y,
            createdAt: now
          });
          this.lastSegmentPosition = { ...this.orbPosition };
        }
      }

      this.killDotsInRadius(this.orbPosition.x, this.orbPosition.y, this.orbRadius * 1.5);

      if (this.getElapsedTime() >= this.activeDuration) {
        this.state = 'FIZZLING';
        this.fizzleStartTime = now;
      }
    } else if (this.state === 'FIZZLING') {
      if (now - this.fizzleStartTime > 300) {
        this.state = 'COMPLETE';
      }
    }

    for (const point of this.firePoints) {
      this.killDotsInRadius(point.x, point.y, this.fireTrailWidth);
    }
  }

  private killDotsInRadius(x: number, y: number, radius: number): void {
    for (const dot of this.dots) {
      if (dot.isDead()) continue;

      const pos = dot.getPosition();
      const dx = pos.x - x;
      const dy = pos.y - y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= (radius + 5) * (radius + 5)) {
        dot.kill();
        this.addKilledDot();
      }
    }
  }

  render(renderer: Renderer): void {
    if (!this.bounds) return;

    const ctx = renderer.getContext();
    const now = Date.now();

    if (this.firePoints.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < this.firePoints.length; i++) {
        const point = this.firePoints[i];
        const prevPoint = this.firePoints[i - 1];
        const age = now - point.createdAt;
        const progress = age / this.fireDuration;

        if (progress >= 1) continue;

        const alpha = Math.max(0, 1 - progress);
        const flicker = 0.85 + Math.sin(now * 0.015 + point.x * 0.05) * 0.15;
        const finalAlpha = alpha * flicker;

        const width = this.fireTrailWidth * (1 - progress * 0.3);

        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = `rgba(255, 200, 50, ${finalAlpha * 0.9})`;
        ctx.lineWidth = width * 1.3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = `rgba(255, 100, 0, ${finalAlpha})`;
        ctx.lineWidth = width;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = `rgba(255, 220, 100, ${finalAlpha * 0.7})`;
        ctx.lineWidth = width * 0.4;
        ctx.stroke();
      }
    }

    if (this.state === 'DRIFTING') {
      this.drawFlamingOrb(ctx, this.orbPosition.x, this.orbPosition.y, this.orbRadius);
    } else if (this.state === 'FIZZLING') {
      const fizzleProgress = (now - this.fizzleStartTime) / 300;
      const shrinkRadius = this.orbRadius * (1 - fizzleProgress);
      if (shrinkRadius > 0) {
        this.drawFlamingOrb(ctx, this.orbPosition.x, this.orbPosition.y, shrinkRadius);
      }
    }
  }

  private drawFlamingOrb(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    const now = Date.now();

    const glowRadius = radius * 2.5;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    gradient.addColorStop(0, 'rgba(255, 220, 100, 0.7)');
    gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    const orbGradient = ctx.createRadialGradient(
      x - radius * 0.2, y - radius * 0.2, 0,
      x, y, radius
    );
    orbGradient.addColorStop(0, '#FFEE66');
    orbGradient.addColorStop(0.5, '#FF8800');
    orbGradient.addColorStop(1, '#DD3300');

    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    const numFlames = 5;
    for (let i = 0; i < numFlames; i++) {
      const baseAngle = (i / numFlames) * Math.PI * 2;
      const wobble = Math.sin(now * 0.008 + i * 1.3) * 0.25;
      const angle = baseAngle + wobble;

      const flameLength = radius * (0.35 + Math.sin(now * 0.012 + i * 2.1) * 0.15);
      const flameWidth = radius * 0.25;

      const startX = x + Math.cos(angle) * radius * 0.7;
      const startY = y + Math.sin(angle) * radius * 0.7;
      const endX = x + Math.cos(angle) * (radius + flameLength);
      const endY = y + Math.sin(angle) * (radius + flameLength);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.6)';
      ctx.lineWidth = flameWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 220, 0.5)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  isComplete(): boolean {
    return this.state === 'COMPLETE' && this.firePoints.length === 0;
  }

  hasKilledPlayer(): boolean {
    return false;
  }
}
