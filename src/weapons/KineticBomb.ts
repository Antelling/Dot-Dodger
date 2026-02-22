import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';

export class KineticBomb extends Weapon {
  readonly type = WeaponType.KINETIC_BOMB;

  private state: 'COLLAPSING' | 'EXPLODING' | 'COMPLETE' = 'COLLAPSING';
  private explosionCenter: Vector2 = { x: 0, y: 0 };
  private explosionRadius: number = 0;
  private bounds: Bounds | null = null;
  private killedDotsInExplosion: Set<Dot> = new Set();

  activate(player: Player, dots: Dot[]): void {
    this.dots = dots;
    this.explosionCenter = { x: player.position.x, y: player.position.y };
    this.start();
  }

  update(_dt: number, _player: Player, dots: Dot[], bounds: Bounds): void {
    if (!this.bounds) this.bounds = bounds;
    const elapsedTime = this.getElapsedTime();

    switch (this.state) {
      case 'COLLAPSING':
        if (elapsedTime >= 100) {
          this.state = 'EXPLODING';
          this.explosionRadius = 0.45 * bounds.width;
        }
        break;

      case 'EXPLODING':
        // Continuously kill dots that enter the explosion
        this.killDotsInExplosion(dots);
        
        // Complete after 1 second total (100ms collapse + 900ms explosion)
        if (elapsedTime >= 1000) {
          this.state = 'COMPLETE';
        }
        break;

      case 'COMPLETE':
        break;
    }
  }

  render(renderer: Renderer): void {
    const elapsedTime = this.getElapsedTime();

    if (this.state === 'COLLAPSING') {
      const collapseRadius = 50 * (1 - elapsedTime / 100);
      if (collapseRadius > 0) {
        renderer.drawCircle(
          this.explosionCenter.x,
          this.explosionCenter.y,
          Math.max(0, collapseRadius),
          '#FF4500'
        );
      }
    } else if (this.state === 'EXPLODING') {
      // Translucent explosion that fades over time
      const explosionElapsed = elapsedTime - 100;
      const explosionDuration = 900;
      const fadeOpacity = 1 - (explosionElapsed / explosionDuration);
      
      if (fadeOpacity > 0) {
        renderer.drawCircle(
          this.explosionCenter.x,
          this.explosionCenter.y,
          this.explosionRadius,
          `rgba(255, 69, 0, ${fadeOpacity * 0.7})`
        );
      }
    }
  }

  isComplete(): boolean {
    return this.state === 'COMPLETE';
  }

  private killDotsInExplosion(dots: Dot[]): void {
    for (const dot of dots) {
      if (dot.isDead() || this.killedDotsInExplosion.has(dot)) continue;

      const pos = dot.getPosition();
      const dx = pos.x - this.explosionCenter.x;
      const dy = pos.y - this.explosionCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.explosionRadius) {
        dot.kill();
        this.addKilledDot();
        this.killedDotsInExplosion.add(dot);
      }
    }
  }
}
