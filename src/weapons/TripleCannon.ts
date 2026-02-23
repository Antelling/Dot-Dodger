import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';

interface Bullet {
  position: Vector2;
  velocity: Vector2;
  active: boolean;
  exploded: boolean;
  explosionTime: number;
}

export class TripleCannon extends Weapon {
  readonly type = WeaponType.TRIPLE_CANNON;

  private state: 'AIMING' | 'FIRING' | 'COMPLETE' = 'AIMING';
  private aimTime: number = 500;
  private aimStartTime: number = 0;
  private playerPosition: Vector2 = { x: 0, y: 0 };
  private playerAngle: number = 0;
  private bullets: Bullet[] = [];
  private currentBulletIndex: number = 0;
  private lastShotTime: number = 0;
  private shotDelay: number = 250; // quarter second between shots

  // Bullet settings
  private readonly BULLET_RADIUS = 8;
  private readonly BULLET_SPEED = 800;
  private readonly EXPLOSION_RADIUS = 60;
  private readonly EXPLOSION_DURATION = 300;

  activate(player: Player, dots: Dot[]): void {
    this.start();
    this.dots = dots;
    this.aimStartTime = Date.now();

    this.playerPosition = player.getPosition();
    this.playerAngle = player.directionAngle;

    this.state = 'AIMING';
    this.bullets = [];
    this.currentBulletIndex = 0;
    this.lastShotTime = 0;
  }

  update(dt: number, player: Player, dots: Dot[], bounds: Bounds): void {
    if (this.state === 'COMPLETE') return;

    const elapsed = Date.now() - this.aimStartTime;

    if (this.state === 'AIMING') {
      this.playerPosition = player.getPosition();
      this.playerAngle = player.directionAngle;

      if (elapsed >= this.aimTime) {
        this.state = 'FIRING';
        this.fireBullet();
      }
    } else if (this.state === 'FIRING') {
      const now = Date.now();

      // Continue tracking player aim between shots
      this.playerPosition = player.getPosition();
      this.playerAngle = player.directionAngle;

      // Fire next bullet after delay
      if (this.currentBulletIndex < 3 && now - this.lastShotTime >= this.shotDelay) {
        this.fireBullet();
      }
      // Update all bullets
      let allDone = true;
      for (const bullet of this.bullets) {
        if (bullet.exploded) {
          // Handle explosion
          if (now - bullet.explosionTime >= this.EXPLOSION_DURATION) {
            bullet.active = false;
          } else {
            this.checkExplosionCollision(bullet, dots);
            allDone = false;
          }
        } else if (bullet.active) {
          // Move bullet
          bullet.position.x += bullet.velocity.x * dt;
          bullet.position.y += bullet.velocity.y * dt;
          if (
            bullet.position.x < 0 ||
            bullet.position.x > bounds.width ||
            bullet.position.y < 0 ||
            bullet.position.y > bounds.height
          ) {
            this.explodeBullet(bullet);
          }
          // Check dot collision
          if (this.checkBulletCollision(bullet, dots)) {
            this.explodeBullet(bullet);
          }

          allDone = false;
        }
      }
      // Complete when all bullets are done and we've fired all 3
      if (allDone && this.currentBulletIndex >= 3) {
        this.state = 'COMPLETE';
      }
    }
  }

  private fireBullet(): void {
    const cos = Math.cos(this.playerAngle);
    const sin = Math.sin(this.playerAngle);

    const bullet: Bullet = {
      position: { ...this.playerPosition },
      velocity: {
        x: cos * this.BULLET_SPEED,
        y: sin * this.BULLET_SPEED
      },
      active: true,
      exploded: false,
      explosionTime: 0
    };

    this.bullets.push(bullet);
    this.currentBulletIndex++;
    this.lastShotTime = Date.now();
  }

  private explodeBullet(bullet: Bullet): void {
    bullet.exploded = true;
    bullet.explosionTime = Date.now();
    bullet.velocity = { x: 0, y: 0 };
  }

  private checkBulletCollision(bullet: Bullet, dots: Dot[]): boolean {
    if (!dots || dots.length === 0) return false;

    for (const dot of dots) {
      if (!dot.isDead()) {
        const dotPos = dot.getPosition();
        const dotRadius = dot.getRadius();
        const dx = bullet.position.x - dotPos.x;
        const dy = bullet.position.y - dotPos.y;
        const distSq = dx * dx + dy * dy;
        const radiiSum = this.BULLET_RADIUS + dotRadius;

        if (distSq < radiiSum * radiiSum) {
          dot.kill();
          this.addKilledDot();
          return true;
        }
      }
    }
    return false;
  }

  private checkExplosionCollision(bullet: Bullet, dots: Dot[]): void {
    if (!dots || dots.length === 0) return;

    for (const dot of dots) {
      if (!dot.isDead()) {
        const dotPos = dot.getPosition();
        const dotRadius = dot.getRadius();
        const dx = bullet.position.x - dotPos.x;
        const dy = bullet.position.y - dotPos.y;
        const distSq = dx * dx + dy * dy;
        const radiiSum = this.EXPLOSION_RADIUS + dotRadius;

        if (distSq < radiiSum * radiiSum) {
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

      // Draw targeting reticle
      ctx.strokeStyle = 'rgb(255, 0, 255)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(20, 0, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    } else if (this.state === 'FIRING') {
      const now = Date.now();

      for (const bullet of this.bullets) {
        if (!bullet.active) continue;

        if (bullet.exploded) {
          // Draw purple explosion
          const elapsed = now - bullet.explosionTime;
          const progress = elapsed / this.EXPLOSION_DURATION;
          const alpha = 1 - progress;
          const radius = this.EXPLOSION_RADIUS * (0.5 + 0.5 * progress);

          ctx.fillStyle = `rgba(128, 0, 255, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(bullet.position.x, bullet.position.y, radius, 0, Math.PI * 2);
          ctx.fill();

          // Inner bright core
          ctx.fillStyle = `rgba(200, 100, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(bullet.position.x, bullet.position.y, radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw circular bullet
          ctx.fillStyle = 'rgb(255, 0, 255)';
          ctx.beginPath();
          ctx.arc(bullet.position.x, bullet.position.y, this.BULLET_RADIUS, 0, Math.PI * 2);
          ctx.fill();

          // Bullet glow
          ctx.fillStyle = 'rgba(255, 100, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(bullet.position.x, bullet.position.y, this.BULLET_RADIUS * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  isComplete(): boolean {
    return this.state === 'COMPLETE';
  }
}
