import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';
import { WEAPON_COLORS } from '../utils/constants';

export class Chainsaw extends Weapon {
  readonly type = WeaponType.CHAINSAW;

  private readonly duration: number = 5000;
  private readonly chainsawRadius: number = 50;
  private playerPosition: Vector2 = { x: 0, y: 0 };

  private readonly warningStartTime: number = 4200;
  private readonly flashDuration: number = 100;
  private readonly flashGap: number = 300;

  activate(player: Player, _dots: Dot[]): void {
    this.start();
    this.playerPosition = player.getPosition();
  }

  update(_dt: number, player: Player, dots: Dot[], _bounds: Bounds): void {
    if (this.getElapsedTime() >= this.duration) return;
    if (!dots || dots.length === 0) return;
    this.playerPosition = player.getPosition();

    for (const dot of dots) {
      if (dot.isDead()) continue;
      const pos = dot.getPosition();
      const dx = pos.x - this.playerPosition.x;
      const dy = pos.y - this.playerPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.chainsawRadius) {
        dot.kill();
        this.addKilledDot();
      }
    }
  }

  private shouldShowVisual(): boolean {
    const elapsed = this.getElapsedTime();

    if (elapsed < this.warningStartTime) {
      return true;
    }

    const warningElapsed = elapsed - this.warningStartTime;
    const isFirstFlashOff = warningElapsed < this.flashDuration;
    const isSecondFlashOff = warningElapsed >= this.flashGap &&
                              warningElapsed < this.flashGap + this.flashDuration;

    return !isFirstFlashOff && !isSecondFlashOff;
  }

  render(renderer: Renderer): void {
    if (!this.shouldShowVisual()) return;
    
    const elapsed = this.getElapsedTime();
    const rotation = (elapsed / 50) % (Math.PI * 2); // Spinning rotation
    const numTeeth = 8;
    const innerRadius = this.chainsawRadius * 0.7;
    const outerRadius = this.chainsawRadius;
    
    // Draw base circle (semi-transparent)
    renderer.drawCircle(this.playerPosition.x, this.playerPosition.y, this.chainsawRadius, WEAPON_COLORS.CHAINSAW + '66');
    
    // Draw spinning triangular teeth
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.playerPosition.x, this.playerPosition.y);
    ctx.rotate(rotation);
    
    ctx.fillStyle = '#E0E0E0';
    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / numTeeth) * Math.PI * 2;
      const nextAngle = ((i + 1) / numTeeth) * Math.PI * 2;
      
      // Draw triangular tooth
      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
      ctx.lineTo(
        Math.cos(angle + (nextAngle - angle) * 0.5) * outerRadius,
        Math.sin(angle + (nextAngle - angle) * 0.5) * outerRadius
      );
      ctx.lineTo(
        Math.cos(nextAngle) * innerRadius,
        Math.sin(nextAngle) * innerRadius
      );
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw center hub
    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  isComplete(): boolean {
    return this.getElapsedTime() >= this.duration;
  }

  getChainsawRadius(): number {
    return this.chainsawRadius;
  }
}
