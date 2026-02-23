import { Pattern } from './Pattern';
import { Dot } from '../entities/Dot';
import { Bounds, Vector2, DotState } from '../types';
import { DOT_RADIUS } from '../utils/constants';
import { Renderer } from '../renderer/Renderer';

type SpawnLocation = 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

const SPAWN_LOCATIONS: SpawnLocation[] = ['top', 'bottom', 'left', 'right', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

export abstract class BulletHellBase extends Pattern {
  protected duration: number = 4000;
  protected readonly baseDotSpeed: number = 250;
  protected readonly spawnInterval: number = 150;
  protected readonly masterRadius: number = DOT_RADIUS * 2;

  protected originX: number = 0;
  protected originY: number = 0;
  protected spawnAccumulator: number = 0;
  protected patternPhase: number = 0;
  protected isShooting: boolean = false;
  
  private masterDot: Dot | null = null;
  private masterDead: boolean = false;
  private masterSpawnDuration: number = 1500;
  private masterSpawnElapsed: number = 0;

  protected abstract spawnPatternBullets(): void;

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();
    this.spawnAccumulator = 0;
    this.patternPhase = 0;
    this.masterSpawnElapsed = 0;
    this.masterDead = false;

    const location = SPAWN_LOCATIONS[Math.floor(Math.random() * SPAWN_LOCATIONS.length)];
    const pos = this.getSpawnPosition(bounds, location);
    this.originX = pos.x;
    this.originY = pos.y;

    this.masterDot = new Dot(this.originX, this.originY, this.type);
    Object.defineProperty(this.masterDot, 'radius', {
      value: this.masterRadius,
      writable: false,
      configurable: true
    });
    this.dots.push(this.masterDot);
  }

  private getSpawnPosition(bounds: Bounds, location: SpawnLocation): Vector2 {
    const margin = this.masterRadius + 5;
    const w = bounds.width;
    const h = bounds.height;

    switch (location) {
      case 'top':
        return { x: w / 2, y: margin };
      case 'bottom':
        return { x: w / 2, y: h - margin };
      case 'left':
        return { x: margin, y: h / 2 };
      case 'right':
        return { x: w - margin, y: h / 2 };
      case 'topLeft':
        return { x: margin, y: margin };
      case 'topRight':
        return { x: w - margin, y: margin };
      case 'bottomLeft':
        return { x: margin, y: h - margin };
      case 'bottomRight':
        return { x: w - margin, y: h - margin };
    }
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    if (this.masterDot && !this.masterDead) {
      if (this.masterDot.isDead()) {
        this.masterDead = true;
      } else if (!this.masterDot.isFrozen()) {
        this.updateMasterSpawnAnimation(dt);
        
        if (this.isShooting && this.elapsedMs <= this.duration + this.masterSpawnDuration) {
          this.spawnAccumulator += dt * 1000;
          
          while (this.spawnAccumulator >= this.spawnInterval) {
            this.spawnAccumulator -= this.spawnInterval;
            this.spawnPatternBullets();
          }
        }

        this.patternPhase += dt * 0.5;
      }
    }

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      
      if (dot === this.masterDot) {
        dot.update(dt, bounds, playerPosition);
        continue;
      }
      
      if (dot.isFrozen()) {
        dot.update(dt, bounds, playerPosition);
        continue;
      }
      
      const pos = dot.getPosition();

      if (pos.x < -DOT_RADIUS || pos.x > bounds.width + DOT_RADIUS ||
          pos.y < -DOT_RADIUS || pos.y > bounds.height + DOT_RADIUS) {
        this.dots.splice(i, 1);
        continue;
      }

      dot.position.x += dot.velocity.x * dt;
      dot.position.y += dot.velocity.y * dt;
    }
  }

  private updateMasterSpawnAnimation(dt: number): void {
    if (this.masterDot && this.masterDot.state === DotState.SPAWNING) {
      this.masterSpawnElapsed += dt * 1000;
      this.masterDot.update(dt, { width: 0, height: 0 });
      
      if (this.masterSpawnElapsed >= this.masterSpawnDuration) {
        this.masterDot.state = DotState.ACTIVE;
        this.isShooting = true;
      }
    }
  }

  protected createBullet(angle: number, speedMultiplier: number = 1): Dot {
    const speed = this.baseDotSpeed * speedMultiplier;
    const dot = new Dot(this.originX, this.originY, this.type);
    dot.velocity.x = Math.cos(angle) * speed;
    dot.velocity.y = Math.sin(angle) * speed;
    dot.state = DotState.ACTIVE;
    dot.skipSpawnAnimation();
    this.dots.push(dot);
    return dot;
  }

  render(renderer: Renderer): void {
    super.render?.(renderer);

    if (this.masterDot && !this.masterDot.isDead() && !this.masterDot.isFrozen()) {
      const pos = this.masterDot.getPosition();
      const pulse = 1 + Math.sin(this.elapsedMs * 0.005) * 0.2;
      
      renderer.drawCircleOutline(
        pos.x,
        pos.y,
        this.masterRadius * pulse,
        '#FFD700',
        3
      );
      
      renderer.drawCircleOutline(
        pos.x,
        pos.y,
        this.masterRadius * pulse * 1.3,
        'rgba(255, 215, 0, 0.3)',
        1
      );
    }
  }

  isComplete(): boolean {
    if (this.masterDead || (this.masterDot && this.masterDot.isFrozen())) {
      const remainingDots = this.dots.filter(d => d !== this.masterDot && !d.isDead());
      return remainingDots.length === 0;
    }
    return false;
  }

  isActivelySpawning(): boolean {
    if (this.masterDead || (this.masterDot && this.masterDot.isFrozen())) {
      return false;
    }
    return this.isShooting;
  }

  getSpawnPointDot(): Dot | null {
    return this.masterDot;
  }

  isSpawnPointDead(): boolean {
    return this.masterDead;
  }
}
