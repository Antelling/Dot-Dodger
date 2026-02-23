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
  chainNodes: ChainNode[];
  lightningArcs: LightningArc[];
}

interface ChainNode {
  x: number;
  y: number;
  radius: number;
  activatedAt: number;
  chainDepth: number;
  parentX?: number;
  parentY?: number;
}

interface LightningArc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  createdAt: number;
  chainDepth: number;
}

export class TeslaCannon extends Weapon {
  readonly type = WeaponType.TESLA_CANNON;

  private state: 'AIMING' | 'FIRING' | 'COMPLETE' = 'AIMING';
  private aimTime: number = 500;
  private aimStartTime: number = 0;
  private playerPosition: Vector2 = { x: 0, y: 0 };
  private playerAngle: number = 0;
  private bullets: Bullet[] = [];
  private currentBulletIndex: number = 0;
  private lastShotTime: number = 0;
  private shotDelay: number = 250;

  private readonly BULLET_RADIUS = 8;
  private readonly BULLET_SPEED = 800;
  private readonly EXPLOSION_RADIUS = 60;
  private readonly EXPLOSION_DURATION = 400;
  private readonly chainRadiusFactor: number = 0.10;
  private readonly maxChainDepth: number = 5;
  private bounds: Bounds | null = null;

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
    if (this.bounds === null) {
      this.bounds = bounds;
    }

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

      this.playerPosition = player.getPosition();
      this.playerAngle = player.directionAngle;

      if (this.currentBulletIndex < 3 && now - this.lastShotTime >= this.shotDelay) {
        this.fireBullet();
      }

      let allDone = true;
      for (const bullet of this.bullets) {
        if (bullet.exploded) {
          if (now - bullet.explosionTime >= this.EXPLOSION_DURATION) {
            bullet.active = false;
          } else {
            this.processChainLightning(bullet, now);
            allDone = false;
          }
        } else if (bullet.active) {
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
          if (this.checkBulletCollision(bullet, dots)) {
            this.explodeBullet(bullet);
          }
          allDone = false;
        }
      }

      if (allDone && this.currentBulletIndex >= 3) {
        this.state = 'COMPLETE';
      }
    }
  }

  private fireBullet(): void {
    const reversedAngle = this.playerAngle + Math.PI;
    const cos = Math.cos(reversedAngle);
    const sin = Math.sin(reversedAngle);

    const bullet: Bullet = {
      position: { ...this.playerPosition },
      velocity: {
        x: cos * this.BULLET_SPEED,
        y: sin * this.BULLET_SPEED
      },
      active: true,
      exploded: false,
      explosionTime: 0,
      chainNodes: [],
      lightningArcs: []
    };

    this.bullets.push(bullet);
    this.currentBulletIndex++;
    this.lastShotTime = Date.now();
  }

  private explodeBullet(bullet: Bullet): void {
    bullet.exploded = true;
    bullet.explosionTime = Date.now();
    bullet.velocity = { x: 0, y: 0 };

    const radius = (this.bounds?.width ?? 800) * this.chainRadiusFactor * 2.5;
    bullet.chainNodes.push({
      x: bullet.position.x,
      y: bullet.position.y,
      radius,
      activatedAt: Date.now(),
      chainDepth: 0
    });

    this.findAndElectrifyDots(bullet, bullet.chainNodes[0]);
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

  private findAndElectrifyDots(bullet: Bullet, node: ChainNode): void {
    for (const dot of this.dots) {
      if (dot.isDead()) continue;

      const pos = dot.getPosition();
      const dx = pos.x - node.x;
      const dy = pos.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= node.radius) {
        dot.kill();
        this.addKilledDot();

        bullet.lightningArcs.push({
          x1: node.x,
          y1: node.y,
          x2: pos.x,
          y2: pos.y,
          createdAt: Date.now(),
          chainDepth: node.chainDepth
        });

        const newNode: ChainNode = {
          x: pos.x,
          y: pos.y,
          radius: (this.bounds?.width ?? 800) * this.chainRadiusFactor,
          activatedAt: Date.now(),
          chainDepth: node.chainDepth + 1,
          parentX: node.x,
          parentY: node.y
        };

        bullet.chainNodes.push(newNode);
      }
    }
  }

  private processChainLightning(bullet: Bullet, now: number): void {
    const pendingNodes = bullet.chainNodes.filter(n =>
      n.chainDepth > 0 &&
      now - n.activatedAt < 100 &&
      n.chainDepth < this.maxChainDepth
    );

    for (const node of pendingNodes) {
      this.findAndElectrifyDots(bullet, node);
    }
  }

  render(renderer: Renderer): void {
    if (this.state === 'COMPLETE') return;

    const ctx = renderer.getContext();

    if (this.state === 'AIMING') {
      const x = this.playerPosition.x;
      const y = this.playerPosition.y;

      const reversedAngle = this.playerAngle + Math.PI;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(reversedAngle);

      ctx.strokeStyle = '#00CCFF';
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
          this.renderElectricExplosion(ctx, bullet, now);
        } else {
          ctx.fillStyle = '#00CCFF';
          ctx.beginPath();
          ctx.arc(bullet.position.x, bullet.position.y, this.BULLET_RADIUS, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(0, 204, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(bullet.position.x, bullet.position.y, this.BULLET_RADIUS * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private renderElectricExplosion(ctx: CanvasRenderingContext2D, bullet: Bullet, now: number): void {
    const elapsed = now - bullet.explosionTime;
    const progress = elapsed / this.EXPLOSION_DURATION;
    const alpha = Math.max(0, 1 - progress);

    const fadeTime = 400;
    bullet.chainNodes = bullet.chainNodes.filter(node => now - node.activatedAt < fadeTime + 50);
    bullet.lightningArcs = bullet.lightningArcs.filter(arc => now - arc.createdAt < fadeTime);

    for (const node of bullet.chainNodes) {
      const nodeAge = now - node.activatedAt;
      const nodeOpacity = Math.max(0, 1 - nodeAge / fadeTime);

      if (nodeOpacity > 0) {
        ctx.fillStyle = `rgba(0, 204, 255, ${nodeOpacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(0, 230, 255, ${nodeOpacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (const arc of bullet.lightningArcs) {
      const arcAge = now - arc.createdAt;
      const arcOpacity = Math.max(0, 1 - arcAge / fadeTime);

      if (arcOpacity > 0) {
        this.drawJaggedLightning(
          ctx,
          arc.x1,
          arc.y1,
          arc.x2,
          arc.y2,
          arcOpacity,
          arc.chainDepth
        );
      }
    }

    const coreRadius = this.EXPLOSION_RADIUS * (0.3 + 0.5 * progress);
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(bullet.position.x, bullet.position.y, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(200, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(bullet.position.x, bullet.position.y, coreRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawJaggedLightning(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opacity: number,
    chainDepth: number
  ): void {
    const segments = 3 + Math.min(chainDepth, 3);
    const jitter = 6 + chainDepth * 2;
    const color = `rgba(0, 230, 255, ${opacity})`;
    const glowColor = `rgba(100, 230, 255, ${opacity * 0.5})`;

    const points: { x: number; y: number }[] = [];
    points.push({ x: x1, y: y1 });

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = x1 + (x2 - x1) * t;
      const baseY = y1 + (y2 - y1) * t;

      const offsetX = (Math.random() - 0.5) * jitter * 2;
      const offsetY = (Math.random() - 0.5) * jitter * 2;

      points.push({ x: baseX + offsetX, y: baseY + offsetY });
    }

    points.push({ x: x2, y: y2 });

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  isComplete(): boolean {
    return this.state === 'COMPLETE';
  }
}
