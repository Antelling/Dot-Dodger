import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';
import { toastManager } from '../game/ToastManager';

export class NuclearBomb extends Weapon {
  readonly type = WeaponType.NUCLEAR_BOMB;

  private state: 'ROLLING' | 'EXPLODING' | 'COMPLETE' = 'ROLLING';
  private orbPosition: Vector2 = { x: 0, y: 0 };
  private orbVelocity: Vector2 = { x: 0, y: 0 };
  private readonly fuseTime: number = 3000; // 3 seconds
  private collisionCount: number = 0;
  private explosionRadius: number = 0;
  private explosionStartTime: number = 0;
  private killedDotsInExplosion: Set<Dot> = new Set();
  private _hasKilledPlayer: boolean = false;

  activate(player: Player, _dots: Dot[]): void {
    this.dots = _dots;
    this.start();
    // Start with orb at player's position
    this.orbPosition = { x: player.position.x, y: player.position.y };
    this.orbVelocity = { x: player.velocity.x, y: player.velocity.y };
  }

  update(dt: number, player: Player, dots: Dot[], bounds: Bounds): void {
    switch (this.state) {
      case 'ROLLING': {
        const elapsedTime = this.getElapsedTime();
        const dx = this.orbVelocity.x * dt;
        const dy = this.orbVelocity.y * dt;
        this.orbPosition.x += dx;
        this.orbPosition.y += dy;

        // Check collision with edges
        if (this.orbPosition.x <= 0 || this.orbPosition.x >= bounds.width) {
          this.orbVelocity.x = -this.orbVelocity.x;
          this.orbPosition.x = Math.max(0, Math.min(this.orbPosition.x, bounds.width));
          this.collisionCount++;
        }
        if (this.orbPosition.y <= 0 || this.orbPosition.y >= bounds.height) {
          this.orbVelocity.y = -this.orbVelocity.y;
          this.orbPosition.y = Math.max(0, Math.min(this.orbPosition.y, bounds.height));
          this.collisionCount++;
        }

        // Check for early explosion (second collision or fuse time)
        if (this.collisionCount >= 2 || elapsedTime >= this.fuseTime) {
          this.state = 'EXPLODING';
          this.explosionRadius = 0.35 * bounds.width; // Slightly bigger than kinetic bomb
          this.explosionStartTime = Date.now();
          toastManager.show('Nuclear Bomb detonated!', 'warning');
        }
        break;
      }
      case 'EXPLODING': {
        const explosionElapsed = Date.now() - this.explosionStartTime;
        
        // Continuously kill dots and check player death during explosion
        this.killDotsInExplosion(dots);
        this.checkAndKillPlayer(player);
        
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
    if (this.state === 'ROLLING') {
      // Draw the rolling orb
      renderer.drawCircle(this.orbPosition.x, this.orbPosition.y, 10, '#FF6600');
    } else if (this.state === 'EXPLODING') {
      // Draw dark red explosion
      const explosionElapsed = Date.now() - this.explosionStartTime;
      const fadeOpacity = 1 - (explosionElapsed / 500);
      
      if (fadeOpacity > 0) {
        renderer.drawCircle(
          this.orbPosition.x,
          this.orbPosition.y,
          this.explosionRadius,
          `rgba(139, 0, 0, ${fadeOpacity * 0.8})` // Dark red with transparency
        );
      }
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
