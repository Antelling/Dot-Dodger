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

  // Bounce physics state for bounced weapons
  private velocity: Vector2 = { x: 0, y: 0 };
  private lastBounceTime: number = 0;
  private readonly bounceCooldown: number = 100;

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
    const skullScale = scale * 0.7;

    // Skull head (circle)
    ctx.beginPath();
    ctx.arc(x, y - skullScale * 0.1, skullScale * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye sockets (two black circles)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - skullScale * 0.2, y - skullScale * 0.15, skullScale * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + skullScale * 0.2, y - skullScale * 0.15, skullScale * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Nose (inverted triangle)
    ctx.beginPath();
    ctx.moveTo(x, y + skullScale * 0.05);
    ctx.lineTo(x - skullScale * 0.08, y + skullScale * 0.2);
    ctx.lineTo(x + skullScale * 0.08, y + skullScale * 0.2);
    ctx.closePath();
    ctx.fill();

    // Jaw / teeth area
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.rect(x - skullScale * 0.25, y + skullScale * 0.25, skullScale * 0.5, skullScale * 0.2);
    ctx.fill();

    // Teeth lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 2; i++) {
      const teethX = x - skullScale * 0.08 * i;
      ctx.beginPath();
      ctx.moveTo(teethX, y + skullScale * 0.25);
      ctx.lineTo(teethX, y + skullScale * 0.45);
      ctx.stroke();

      const teethX2 = x + skullScale * 0.08 * i;
      ctx.beginPath();
      ctx.moveTo(teethX2, y + skullScale * 0.25);
      ctx.lineTo(teethX2, y + skullScale * 0.45);
      ctx.stroke();
    }

    // Crossbones (X shape behind skull)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Bone 1 (backslash)
    ctx.beginPath();
    ctx.moveTo(x - skullScale * 0.7, y - skullScale * 0.5);
    ctx.lineTo(x + skullScale * 0.7, y + skullScale * 0.5);
    ctx.stroke();

    // Bone 2 (forward slash)
    ctx.beginPath();
    ctx.moveTo(x + skullScale * 0.7, y - skullScale * 0.5);
    ctx.lineTo(x - skullScale * 0.7, y + skullScale * 0.5);
    ctx.stroke();

    // Bone ends (small circles at ends of bones)
    ctx.fillStyle = '#FFFFFF';
    const boneEndRadius = skullScale * 0.1;
    const boneEnds = [
      { x: x - skullScale * 0.7, y: y - skullScale * 0.5 },
      { x: x + skullScale * 0.7, y: y + skullScale * 0.5 },
      { x: x + skullScale * 0.7, y: y - skullScale * 0.5 },
      { x: x - skullScale * 0.7, y: y + skullScale * 0.5 }
    ];

    for (const end of boneEnds) {
      ctx.beginPath();
      ctx.arc(end.x, end.y, boneEndRadius, 0, Math.PI * 2);
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


  bounce(playerVelocity: Vector2, playerPosition: Vector2): boolean {
    const now = Date.now();
    if (now - this.lastBounceTime < this.bounceCooldown) {
      return false;
    }
    this.lastBounceTime = now;

    // Check if this is a bounced weapon
    if (!WeaponOrb.BOUNCED_WEAPONS.includes(this.weaponType)) {
      return false;
    }

    const dx = this.position.x - playerPosition.x;
    const dy = this.position.y - playerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      this.velocity.x = playerVelocity.x;
      this.velocity.y = playerVelocity.y;
      return true;
    }

    // Collision normal (from player to orb center)
    const nx = dx / distance;
    const ny = dy / distance;

    // Tangent vector (perpendicular to normal)
    const tx = -ny;
    const ty = nx;

    // Decompose player velocity into normal and tangent components
    const vDotN = playerVelocity.x * nx + playerVelocity.y * ny;
    const vDotT = playerVelocity.x * tx + playerVelocity.y * ty;

    // Transfer momentum: orb moves away based on collision angle
    // - Normal component pushes orb away from player
    // - Tangent component pushes orb sideways (creates the "nudge" effect)
    const restitution = 0.8; // Energy transfer factor
    const friction = 0.6;    // Tangential transfer factor

    this.velocity.x = (nx * vDotN * restitution + tx * vDotT * friction);
    this.velocity.y = (ny * vDotN * restitution + ty * vDotT * friction);

    return true;
  }

  getVelocity(): Vector2 {
    return this.velocity;
  }

  updatePosition(dt: number, bounds: { width: number; height: number }): void {
    if (!WeaponOrb.BOUNCED_WEAPONS.includes(this.weaponType)) return;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    const minX = this.radius;
    const maxX = bounds.width - this.radius;
    const minY = this.radius;
    const maxY = bounds.height - this.radius;

    if (this.position.x <= minX) {
      this.velocity.x = Math.abs(this.velocity.x);
      this.position.x = minX;
    } else if (this.position.x >= maxX) {
      this.velocity.x = -Math.abs(this.velocity.x);
      this.position.x = maxX;
    }

    if (this.position.y <= minY) {
      this.velocity.y = Math.abs(this.velocity.y);
      this.position.y = minY;
    } else if (this.position.y >= maxY) {
      this.velocity.y = -Math.abs(this.velocity.y);
      this.position.y = maxY;
    }
  }
}
