import { Vector2 } from '../types';
import { Renderer } from '../renderer/Renderer';
import { WeaponType } from '../types';
import { WEAPON_ORB_RADIUS, WEAPON_COLORS } from '../utils/constants';

export class WeaponOrb {
  position: Vector2;
  weaponType: WeaponType;
  pickedUp: boolean = false;
  readonly radius: number = WEAPON_ORB_RADIUS;

  // Weapons that bounce when collided with
  private static readonly BOUNCED_WEAPONS: WeaponType[] = [
    WeaponType.NUCLEAR_BOMB,
    WeaponType.ELECTRIC_BOMB
  ];

  constructor(x: number, y: number, weaponType: WeaponType) {
    this.position = { x, y };
    this.weaponType = weaponType;
  }

  render(renderer: Renderer): void {
    if (this.pickedUp) return;

    const color = WEAPON_COLORS[this.weaponType] || '#FFFFFF';

    renderer.drawCircleImmediate(
      this.position.x,
      this.position.y,
      this.radius,
      color
    );

    const isBouncedWeapon = WeaponOrb.BOUNCED_WEAPONS.includes(this.weaponType);
    const borderColor = isBouncedWeapon ? '#9B30FF' : '#FFFFFF';

    const ctx = renderer.getContext();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius + 2, 0, Math.PI * 2);
    ctx.stroke();

    this.drawIcon(ctx, this.position.x, this.position.y, this.radius);
  }

  private drawIcon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#FFFFFF';

    const iconScale = radius * 0.5;

    switch (this.weaponType) {
      case WeaponType.KINETIC_BOMB:
        this.drawKineticBombIcon(ctx, x, y, iconScale);
        break;
      case WeaponType.BLASTER:
        this.drawBlasterIcon(ctx, x, y, iconScale);
        break;
      case WeaponType.ICE_BOMB:
        this.drawIceBombIcon(ctx, x, y, iconScale);
        break;
      case WeaponType.HOMING_MISSILE:
        this.drawHomingMissileIcon(ctx, x, y, iconScale);
        break;
      case WeaponType.NUCLEAR_BOMB:
        this.drawNuclearBombIcon(ctx, x, y, iconScale);
        break;
      case WeaponType.ELECTRIC_BOMB:
        this.drawElectricBombIcon(ctx, x, y, iconScale);
        break;
      case WeaponType.DOT_REPELLENT:
        this.drawDotRepellentIcon(ctx, x, y, iconScale);
        break;
      case WeaponType.CHAINSAW:
        this.drawChainsawIcon(ctx, x, y, iconScale);
        break;
      case WeaponType.FLAME_BURST:
        this.drawFlameBurstIcon(ctx, x, y, iconScale);
        break;
    }
  }

  private drawKineticBombIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.arc(x, y, scale * 0.3, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * scale * 0.4, y + Math.sin(angle) * scale * 0.4);
      ctx.lineTo(x + Math.cos(angle) * scale * 0.8, y + Math.sin(angle) * scale * 0.8);
      ctx.stroke();
    }
  }

  private drawBlasterIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.fillRect(x - scale * 0.8, y - scale * 0.15, scale * 1.6, scale * 0.3);
    ctx.fillRect(x - scale * 0.9, y - scale * 0.4, scale * 0.3, scale * 0.8);
    ctx.fillRect(x + scale * 0.6, y - scale * 0.4, scale * 0.3, scale * 0.8);
  }

  private drawIceBombIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * scale * 0.8, y + Math.sin(angle) * scale * 0.8);
      ctx.stroke();
      const branchX = x + Math.cos(angle) * scale * 0.5;
      const branchY = y + Math.sin(angle) * scale * 0.5;
      ctx.beginPath();
      ctx.moveTo(branchX, branchY);
      ctx.lineTo(branchX + Math.cos(angle + Math.PI / 4) * scale * 0.3, branchY + Math.sin(angle + Math.PI / 4) * scale * 0.3);
      ctx.moveTo(branchX, branchY);
      ctx.lineTo(branchX + Math.cos(angle - Math.PI / 4) * scale * 0.3, branchY + Math.sin(angle - Math.PI / 4) * scale * 0.3);
      ctx.stroke();
    }
  }

  private drawHomingMissileIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    const arrowSize = scale * 0.25;
    const spacing = scale * 0.35;

    for (let i = -1; i <= 1; i++) {
      const arrowX = x + i * spacing;
      const arrowY = y;
      this.drawArrowUp(ctx, arrowX, arrowY, arrowSize);
    }
  }

  private drawArrowUp(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size * 0.5, y + size * 0.3);
    ctx.lineTo(x + size * 0.5, y + size * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  private drawNuclearBombIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.arc(x, y, scale * 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(angle) * scale * 0.5,
        y + Math.sin(angle) * scale * 0.5,
        scale * 0.25,
        angle + Math.PI / 3,
        angle + Math.PI * 2 / 3
      );
      ctx.fill();
    }
  }

  private drawElectricBombIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.moveTo(x + scale * 0.2, y - scale * 0.8);
    ctx.lineTo(x - scale * 0.1, y - scale * 0.1);
    ctx.lineTo(x + scale * 0.3, y - scale * 0.1);
    ctx.lineTo(x - scale * 0.2, y + scale * 0.8);
    ctx.lineTo(x, y + scale * 0.1);
    ctx.lineTo(x - scale * 0.3, y + scale * 0.1);
    ctx.closePath();
    ctx.fill();
  }

  private drawDotRepellentIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.arc(x, y, scale * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, scale * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      this.drawOutwardArrow(ctx, x, y, angle, scale);
    }
  }

  private drawOutwardArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number): void {
    const arrowX = x + Math.cos(angle) * scale * 0.45;
    const arrowY = y + Math.sin(angle) * scale * 0.45;
    const size = scale * 0.2;

    ctx.beginPath();
    ctx.moveTo(arrowX + Math.cos(angle) * size, arrowY + Math.sin(angle) * size);
    ctx.lineTo(arrowX + Math.cos(angle + 2.5) * size, arrowY + Math.sin(angle + 2.5) * size);
    ctx.lineTo(arrowX + Math.cos(angle - 2.5) * size, arrowY + Math.sin(angle - 2.5) * size);
    ctx.closePath();
    ctx.fill();
  }

  private drawChainsawIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.arc(x, y, scale * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    const numTeeth = 8;
    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / numTeeth) * Math.PI * 2;
      const innerR = scale * 0.5;
      const outerR = scale * 0.7;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle - 0.15) * innerR, y + Math.sin(angle - 0.15) * innerR);
      ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
      ctx.lineTo(x + Math.cos(angle + 0.15) * innerR, y + Math.sin(angle + 0.15) * innerR);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, scale * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawFlameBurstIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y - scale * 0.8);
    ctx.bezierCurveTo(
      x - scale * 0.4, y - scale * 0.3,
      x - scale * 0.6, y + scale * 0.2,
      x - scale * 0.2, y + scale * 0.6
    );
    ctx.quadraticCurveTo(x, y + scale * 0.8, x + scale * 0.2, y + scale * 0.6);
    ctx.bezierCurveTo(
      x + scale * 0.6, y + scale * 0.2,
      x + scale * 0.4, y - scale * 0.3,
      x, y - scale * 0.8
    );
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x, y - scale * 0.4);
    ctx.bezierCurveTo(
      x - scale * 0.2, y,
      x - scale * 0.3, y + scale * 0.3,
      x, y + scale * 0.5
    );
    ctx.bezierCurveTo(
      x + scale * 0.3, y + scale * 0.3,
      x + scale * 0.2, y,
      x, y - scale * 0.4
    );
    ctx.fill();
  }

  isCollidingWith(playerPosition: Vector2, playerRadius: number): boolean {
    const dx = this.position.x - playerPosition.x;
    const dy = this.position.y - playerPosition.y;
    const distSq = dx * dx + dy * dy;
    const radiiSum = this.radius + playerRadius;
    return distSq < radiiSum * radiiSum;
  }

  getPosition(): Vector2 {
    return this.position;
  }

  getWeaponType(): WeaponType {
    return this.weaponType;
  }

  pickup(): void {
    this.pickedUp = true;
  }

  isActive(): boolean {
    return !this.pickedUp;
  }
}
