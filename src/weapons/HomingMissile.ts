import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds } from '../types';
import type { Renderer } from '../renderer/Renderer';
import { distance } from '../utils/math';

interface Missile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  target: Dot | null;
  active: boolean;
}

interface Explosion {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  mainRadius: number;
  subExplosions: { x: number; y: number; radius: number }[];
  hasAppliedDamage: boolean;
  active: boolean;
}

const MISSILE_RADIUS = 6;
const MISSILE_COLOR = '#FF6B00';
const MISSILE_TRAIL_COLOR = 'rgba(255, 107, 0, 0.3)';
const MAX_TURN_RATE = 5 * Math.PI / 180;

const EXPLOSION_MAIN_RADIUS = 45;
const EXPLOSION_SUB_RADIUS = 15;
const EXPLOSION_DURATION_MS = 500;
const EXPLOSION_SUB_DELAY_MS = 250;
const EXPLOSION_COLOR = '#FFD700';

export class HomingMissile extends Weapon {
  readonly type = WeaponType.HOMING_MISSILE;

  private missiles: Missile[] = [];
  private explosions: Explosion[] = [];
  private readonly missileSpeed: number = 800;

  activate(player: Player, dots: Dot[]): void {
    this.start();
    this.dots = dots;
    this.missiles = [];
    this.explosions = [];

    const playerPos = player.getPosition();
    const baseAngle = player.directionAngle;
    const playerVel = player.velocity;

    const playerSpeedInfluence = Math.sqrt(playerVel.x ** 2 + playerVel.y ** 2) * 0.5;
    const effectiveSpeed = this.missileSpeed + playerSpeedInfluence;

    const angles = [baseAngle - Math.PI / 6, baseAngle, baseAngle + Math.PI / 6];

    for (const launchAngle of angles) {
      const missile: Missile = {
        x: playerPos.x,
        y: playerPos.y,
        vx: Math.cos(launchAngle) * effectiveSpeed,
        vy: Math.sin(launchAngle) * effectiveSpeed,
        angle: launchAngle,
        target: null,
        active: true
      };
      this.missiles.push(missile);
    }
  }

  private findBestTarget(missile: Missile, dots: Dot[]): Dot | null {
    if (!dots || dots.length === 0) return null;
    
    let bestTarget: Dot | null = null;
    let bestScore = Infinity;

    for (const dot of dots) {
      if (dot.isDead() || !dot.isLethal()) continue;

      const dotPos = dot.getPosition();
      const dist = distance(missile, dotPos);

      const angleToDot = Math.atan2(dotPos.y - missile.y, dotPos.x - missile.x);
      const angleDiff = Math.abs(this.normalizeAngle(angleToDot - missile.angle));

      const score = dist * (1 + angleDiff);

      if (score < bestScore) {
        bestScore = score;
        bestTarget = dot;
      }
    }

    return bestTarget;
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  private createExplosion(x: number, y: number): void {
    const subExplosions = [];
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * EXPLOSION_MAIN_RADIUS * 0.6;
      subExplosions.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        radius: EXPLOSION_SUB_RADIUS * (0.8 + Math.random() * 0.4)
      });
    }

    const explosion: Explosion = {
      x,
      y,
      startTime: Date.now(),
      duration: EXPLOSION_DURATION_MS,
      mainRadius: EXPLOSION_MAIN_RADIUS,
      subExplosions,
      hasAppliedDamage: false,
      active: true
    };
    this.explosions.push(explosion);
  }

  private applyExplosionDamage(explosion: Explosion, dots: Dot[]): void {
    if (explosion.hasAppliedDamage) return;

    for (const dot of dots) {
      if (dot.isDead() || !dot.isLethal()) continue;

      const dotPos = dot.getPosition();
      const dist = distance({ x: explosion.x, y: explosion.y }, dotPos);

      if (dist < explosion.mainRadius + dot.getRadius()) {
        dot.kill();
        this.addKilledDot();
      }
    }

    explosion.hasAppliedDamage = true;
  }

  update(_dt: number, _player: Player, dots: Dot[], bounds: Bounds): void {
    const now = Date.now();

    this.missiles = this.missiles.filter(m => m.active);
    this.explosions = this.explosions.filter(e => e.active);

    for (const explosion of this.explosions) {
      const elapsed = now - explosion.startTime;
      if (elapsed >= explosion.duration) {
        explosion.active = false;
      }
      if (!explosion.hasAppliedDamage) {
        this.applyExplosionDamage(explosion, dots);
      }
    }

    for (const missile of this.missiles) {
      if (!missile.active) continue;

      if (!missile.target || missile.target.isDead() || !missile.target.isLethal()) {
        missile.target = this.findBestTarget(missile, dots);
      }

      if (missile.target) {
        const targetPos = missile.target.getPosition();
        const angleToTarget = Math.atan2(
          targetPos.y - missile.y,
          targetPos.x - missile.x
        );

        const angleDiff = this.normalizeAngle(angleToTarget - missile.angle);

        const turnAmount = Math.max(-MAX_TURN_RATE, Math.min(MAX_TURN_RATE, angleDiff));
        missile.angle += turnAmount;

        const currentSpeed = Math.sqrt(missile.vx ** 2 + missile.vy ** 2);
        missile.vx = Math.cos(missile.angle) * currentSpeed;
        missile.vy = Math.sin(missile.angle) * currentSpeed;
      }

      missile.x += missile.vx * _dt;
      missile.y += missile.vy * _dt;

      if (
        missile.x < -MISSILE_RADIUS ||
        missile.x > bounds.width + MISSILE_RADIUS ||
        missile.y < -MISSILE_RADIUS ||
        missile.y > bounds.height + MISSILE_RADIUS
      ) {
        missile.active = false;
        continue;
      }

      for (const dot of dots) {
        if (dot.isDead() || !dot.isLethal()) continue;

        const dotPos = dot.getPosition();
        const dist = distance(missile, dotPos);

        if (dist < MISSILE_RADIUS + dot.getRadius()) {
          this.createExplosion(missile.x, missile.y);
          missile.active = false;
          break;
        }
      }
    }
  }

  render(renderer: Renderer): void {
    const ctx = renderer.getContext();
    const now = Date.now();

    for (const missile of this.missiles) {
      if (!missile.active) continue;

      ctx.save();
      ctx.translate(missile.x, missile.y);
      ctx.rotate(missile.angle);

      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-MISSILE_RADIUS, 0);
      ctx.strokeStyle = MISSILE_TRAIL_COLOR;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(MISSILE_RADIUS * 1.5, 0);
      ctx.lineTo(-MISSILE_RADIUS, -MISSILE_RADIUS * 0.6);
      ctx.lineTo(-MISSILE_RADIUS, MISSILE_RADIUS * 0.6);
      ctx.closePath();
      ctx.fillStyle = MISSILE_COLOR;
      ctx.fill();

      ctx.restore();
    }

    for (const explosion of this.explosions) {
      if (!explosion.active) continue;

      const elapsed = now - explosion.startTime;
      const progress = elapsed / explosion.duration;
      const opacity = 1 - progress;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = EXPLOSION_COLOR;

      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.mainRadius, 0, Math.PI * 2);
      ctx.fill();

      if (elapsed >= EXPLOSION_SUB_DELAY_MS) {
        for (const sub of explosion.subExplosions) {
          ctx.beginPath();
          ctx.arc(
            explosion.x + sub.x,
            explosion.y + sub.y,
            sub.radius,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  isComplete(): boolean {
    return this.missiles.every(m => !m.active) && this.explosions.every(e => !e.active);
  }
}
