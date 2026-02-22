import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { DotState } from '../types';
import { WeaponType, Bounds } from '../types';
import type { Renderer } from '../renderer/Renderer';

export interface FrozenDot {
  dot: Dot;
  frozenTime: number;
}

export class IceBomb extends Weapon {
  readonly type = WeaponType.ICE_BOMB;

  private state: 'EXPLODING' | 'FADING' | 'COMPLETE' = 'EXPLODING';
  private bounds: Bounds | null = null;
  private explosionRadius: number = 0;
  private explosionCenter: { x: number; y: number } = { x: 0, y: 0 };
  private explosionStartTime: number = 0;
  private frozenDotsCount: number = 0;

  activate(player: Player, dots: Dot[]): void {
    this.start();
    this.explosionStartTime = Date.now();
    this.explosionCenter = { x: player.position.x, y: player.position.y };
    this.dots = dots;
    
    // Calculate explosion radius based on bounds
    this.explosionRadius = 0.3 * (dots.length > 0 ? 800 : 800); // Default to reasonable size
    
    // Freeze dots in explosion radius
    this.freezeDotsInRadius(dots);
    
    this.state = 'EXPLODING';
  }

  update(_dt: number, _player: Player, dots: Dot[], bounds: Bounds): void {
    if (!this.bounds) {
      this.bounds = bounds;
      this.explosionRadius = 0.3 * bounds.width;
    }

    // Continuously freeze dots that enter the radius while effect is active
    if (this.state === 'EXPLODING' || this.state === 'FADING') {
      this.freezeDotsInRadius(dots);
    }

    if (this.state === 'EXPLODING') {
      const elapsed = Date.now() - this.explosionStartTime;
      if (elapsed >= 500) {
        this.state = 'FADING';
      }
    } else if (this.state === 'FADING') {
      const elapsed = Date.now() - this.explosionStartTime;
      // Effect lasts 3000ms to match dot freeze duration
      if (elapsed >= 3000) {
        this.state = 'COMPLETE';
      }
    }
  }

  render(renderer: Renderer): void {
    if (this.state === 'EXPLODING' || this.state === 'FADING') {
      const elapsed = Date.now() - this.explosionStartTime;
      let alpha = 0.6;
      
      if (this.state === 'FADING') {
        // Fade out over 2500ms (from 500ms to 3000ms)
        alpha = 0.6 * (1 - (elapsed - 500) / 2500);
      }
      
      if (alpha > 0) {
        renderer.drawCircle(
          this.explosionCenter.x,
          this.explosionCenter.y,
          this.explosionRadius,
          `rgba(0, 204, 255, ${alpha})` // Blue explosion
        );
      }
    }
  }

  isComplete(): boolean {
    return this.state === 'COMPLETE';
  }

  private freezeDotsInRadius(dots: Dot[]): void {
    if (!dots || dots.length === 0) return;

    for (const dot of dots) {
      if (dot.isDead() || dot.isFrozen()) {
        continue;
      }

      const pos = dot.getPosition();
      const dx = pos.x - this.explosionCenter.x;
      const dy = pos.y - this.explosionCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.explosionRadius) {
        dot.freeze();
        this.frozenDotsCount++;
      }
    }
  }

  getFrozenDotsCount(): number {
    return this.frozenDotsCount;
  }

  getExplosionRadius(): number {
    return this.explosionRadius;
  }
}
