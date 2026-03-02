import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';
import { WEAPON_ORB_RADIUS } from '../utils/constants';

interface PortalLine {
  center: Vector2;
  normal: Vector2;
  tangent: Vector2;
  length: number;
  isSpawn: boolean;
}

interface TeleportRecord {
  entityId: number;
  lastTeleportTime: number;
}

export class Wormhole extends Weapon {
  readonly type = WeaponType.WORMHOLE;

  private state: 'DRIFTING' | 'PORTAL_ACTIVE' | 'COMPLETE' = 'DRIFTING';
  private orbPosition: Vector2 = { x: 0, y: 0 };
  private orbVelocity: Vector2 = { x: 0, y: 0 };
  private spawnPosition: Vector2 = { x: 0, y: 0 };
  
  private readonly driftTime: number = 2000;
  private readonly portalDuration: number = 10000;
  private portalStartTime: number = 0;
  
  private portalLines: PortalLine[] = [];
  private readonly portalLineLength: number = 150;
  private readonly portalWidth: number = 20;
  
  private teleportedEntities: Map<number, TeleportRecord> = new Map();
  private readonly teleportCooldown: number = 300;
  
  private bounds: Bounds | null = null;
  private readonly orbRadius: number = WEAPON_ORB_RADIUS;
  
  private lastCollisionTime: number = 0;
  private readonly collisionCooldown: number = 100;

  activate(player: Player, _dots: Dot[], initialPosition?: { x: number; y: number }): void {
    this.dots = _dots;
    this.start();
    
    if (initialPosition) {
      this.orbPosition = { x: initialPosition.x, y: initialPosition.y };
    } else {
      const playerSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
      if (playerSpeed > 10) {
        const dirX = player.velocity.x / playerSpeed;
        const dirY = player.velocity.y / playerSpeed;
        const offset = player.hitboxRadius + this.orbRadius + 5;
        this.orbPosition = {
          x: player.position.x + dirX * offset,
          y: player.position.y + dirY * offset
        };
      } else {
        this.orbPosition = { x: player.position.x, y: player.position.y - player.hitboxRadius - this.orbRadius - 5 };
      }
    }
    
    this.spawnPosition = { x: this.orbPosition.x, y: this.orbPosition.y };
    
    // Give orb initial velocity from player's momentum
    const playerSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
    if (playerSpeed > 50) {
      this.orbVelocity = {
        x: player.velocity.x * 1.5,
        y: player.velocity.y * 1.5
      };
    } else {
      this.orbVelocity = { x: 0, y: 0 };
    }
  }
  handlePlayerCollision(player: Player, playerVelocity: Vector2): boolean {
    if (this.state !== 'DRIFTING') return false;
    
    const now = Date.now();
    if (now - this.lastCollisionTime < this.collisionCooldown) {
      return false;
    }
    this.lastCollisionTime = now;

    const dx = this.orbPosition.x - player.position.x;
    const dy = this.orbPosition.y - player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const minSpeed = 50;
    const playerSpeed = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.y ** 2);

    if (playerSpeed < minSpeed) {
      return false;
    }

    if (distance === 0) {
      this.orbVelocity.x = playerVelocity.x;
      this.orbVelocity.y = playerVelocity.y;
      return true;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const tx = -ny;
    const ty = nx;

    const vDotN = playerVelocity.x * nx + playerVelocity.y * ny;
    const vDotT = playerVelocity.x * tx + playerVelocity.y * ty;

    const directness = vDotN / playerSpeed;

    if (directness < 0.1) {
      return false;
    }

    const velocityMultiplier = 2.0;

    if (directness > 0.7) {
      this.orbVelocity.x = playerVelocity.x * velocityMultiplier;
      this.orbVelocity.y = playerVelocity.y * velocityMultiplier;
    } else {
      const forwardFactor = directness;
      const sidewaysFactor = 1 - directness;

      this.orbVelocity.x = (nx * vDotN * forwardFactor + tx * vDotT * sidewaysFactor) * velocityMultiplier;
      this.orbVelocity.y = (ny * vDotN * forwardFactor + ty * vDotT * sidewaysFactor) * velocityMultiplier;
    }

    return true;
  }

  getPosition(): Vector2 {
    return this.orbPosition;
  }

  getRadius(): number {
    return this.orbRadius;
  }

  isActive(): boolean {
    return this.state === 'DRIFTING';
  }

  update(dt: number, player: Player, dots: Dot[], bounds: Bounds): void {
    this.bounds = bounds;

    switch (this.state) {
      case 'DRIFTING': {
        this.updateDrifting(dt, bounds);
        break;
      }
      case 'PORTAL_ACTIVE': {
        this.updatePortal(player, dots);
        break;
      }
      case 'COMPLETE': {
        break;
      }
    }
  }

  private updateDrifting(dt: number, bounds: Bounds): void {
    const elapsedTime = this.getElapsedTime();

    this.orbPosition.x += this.orbVelocity.x * dt;
    this.orbPosition.y += this.orbVelocity.y * dt;

    const minX = this.orbRadius;
    const maxX = bounds.width - this.orbRadius;
    const minY = this.orbRadius;
    const maxY = bounds.height - this.orbRadius;

    if (this.orbPosition.x <= minX) {
      this.orbVelocity.x = Math.abs(this.orbVelocity.x);
      this.orbPosition.x = minX;
    } else if (this.orbPosition.x >= maxX) {
      this.orbVelocity.x = -Math.abs(this.orbVelocity.x);
      this.orbPosition.x = maxX;
    }

    if (this.orbPosition.y <= minY) {
      this.orbVelocity.y = Math.abs(this.orbVelocity.y);
      this.orbPosition.y = minY;
    } else if (this.orbPosition.y >= maxY) {
      this.orbVelocity.y = -Math.abs(this.orbVelocity.y);
      this.orbPosition.y = maxY;
    }

    if (elapsedTime >= this.driftTime) {
      this.createPortal();
    }
  }

  private createPortal(): void {
    this.state = 'PORTAL_ACTIVE';
    this.portalStartTime = Date.now();
    
    const dx = this.orbPosition.x - this.spawnPosition.x;
    const dy = this.orbPosition.y - this.spawnPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) {
      this.portalLines = [
        {
          center: { x: this.spawnPosition.x - 50, y: this.spawnPosition.y },
          normal: { x: -1, y: 0 },
          tangent: { x: 0, y: 1 },
          length: this.portalLineLength,
          isSpawn: true
        },
        {
          center: { x: this.orbPosition.x + 50, y: this.orbPosition.y },
          normal: { x: 1, y: 0 },
          tangent: { x: 0, y: 1 },
          length: this.portalLineLength,
          isSpawn: false
        }
      ];
      return;
    }
    
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    const tangentX = -dirY;
    const tangentY = dirX;
    
    this.portalLines = [
      {
        center: { x: this.spawnPosition.x, y: this.spawnPosition.y },
        normal: { x: -dirX, y: -dirY },
        tangent: { x: tangentX, y: tangentY },
        length: this.portalLineLength,
        isSpawn: true
      },
      {
        center: { x: this.orbPosition.x, y: this.orbPosition.y },
        normal: { x: dirX, y: dirY },
        tangent: { x: tangentX, y: tangentY },
        length: this.portalLineLength,
        isSpawn: false
      }
    ];
  }

  private updatePortal(player: Player, dots: Dot[]): void {
    const elapsed = Date.now() - this.portalStartTime;
    if (elapsed >= this.portalDuration) {
      this.state = 'COMPLETE';
      return;
    }
    
    const now = Date.now();
    for (const [entityId, record] of this.teleportedEntities) {
      if (now - record.lastTeleportTime > this.teleportCooldown * 2) {
        this.teleportedEntities.delete(entityId);
      }
    }
    
    // Teleport the player through portals
    const playerPos = player.getPosition();
    const playerId = -1; // Special ID for player
    
    for (let i = 0; i < this.portalLines.length; i++) {
      const portal = this.portalLines[i];
      const otherPortal = this.portalLines[1 - i];
      
      const toPlayerX = playerPos.x - portal.center.x;
      const toPlayerY = playerPos.y - portal.center.y;
      
      const tangentDist = toPlayerX * portal.tangent.x + toPlayerY * portal.tangent.y;
      if (Math.abs(tangentDist) > portal.length) continue;
      
      const normalDist = toPlayerX * portal.normal.x + toPlayerY * portal.normal.y;
      
      if (normalDist >= 0 && normalDist <= this.portalWidth) {
        const record = this.teleportedEntities.get(playerId);
        if (record && now - record.lastTeleportTime < this.teleportCooldown) {
          break;
        }
        
        const newPosX = otherPortal.center.x + tangentDist * otherPortal.tangent.x;
        const newPosY = otherPortal.center.y + tangentDist * otherPortal.tangent.y;
        
        player.setPosition(
          newPosX + otherPortal.normal.x * 30,
          newPosY + otherPortal.normal.y * 30
        );
        
        this.teleportedEntities.set(playerId, { entityId: playerId, lastTeleportTime: now });
        break;
      }
    }
    
    // Kill dots that touch the portal
    for (const dot of dots) {
      if (dot.isDead() || dot.isFrozen()) continue;
      
      const dotPos = dot.getPosition();
      
      for (const portal of this.portalLines) {
        const toDotX = dotPos.x - portal.center.x;
        const toDotY = dotPos.y - portal.center.y;
        
        const tangentDist = toDotX * portal.tangent.x + toDotY * portal.tangent.y;
        if (Math.abs(tangentDist) > portal.length) continue;
        
        const normalDist = toDotX * portal.normal.x + toDotY * portal.normal.y;
        
        if (normalDist >= 0 && normalDist <= this.portalWidth) {
          dot.kill();
          this.addKilledDot();
          break;
        }
      }
    }
  }

  render(renderer: Renderer): void {
    if (!this.bounds) return;

    switch (this.state) {
      case 'DRIFTING': {
        this.renderDrifting(renderer);
        break;
      }
      case 'PORTAL_ACTIVE': {
        this.renderPortal(renderer);
        break;
      }
      case 'COMPLETE': {
        break;
      }
    }
  }

  private renderDrifting(renderer: Renderer): void {
    const elapsedTime = this.getElapsedTime();
    
    const pulse = 0.8 + 0.2 * Math.sin(elapsedTime * 0.01);
    const color = `rgba(139, 0, 255, ${pulse})`;
    
    renderer.drawCircleImmediate(
      this.orbPosition.x,
      this.orbPosition.y,
      this.orbRadius,
      color
    );

    const ctx = renderer.getContext();
    ctx.strokeStyle = '#9B30FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.orbPosition.x, this.orbPosition.y, this.orbRadius + 2, 0, Math.PI * 2);
    ctx.stroke();

    this.drawWormholeIcon(ctx, this.orbPosition.x, this.orbPosition.y, this.orbRadius * 0.5);
  }

  private renderPortal(renderer: Renderer): void {
    const elapsed = Date.now() - this.portalStartTime;
    const opacity = 1 - (elapsed / this.portalDuration) * 0.5;
    
    const ctx = renderer.getContext();
    
    if (this.portalLines.length === 2) {
      ctx.strokeStyle = `rgba(139, 0, 255, ${opacity * 0.2})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 10]);
      ctx.beginPath();
      ctx.moveTo(this.portalLines[0].center.x, this.portalLines[0].center.y);
      ctx.lineTo(this.portalLines[1].center.x, this.portalLines[1].center.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    for (const portal of this.portalLines) {
      const startX = portal.center.x - portal.tangent.x * portal.length;
      const startY = portal.center.y - portal.tangent.y * portal.length;
      const endX = portal.center.x + portal.tangent.x * portal.length;
      const endY = portal.center.y + portal.tangent.y * portal.length;
      
      ctx.strokeStyle = `rgba(139, 0, 255, ${opacity * 0.3})`;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      ctx.strokeStyle = `rgba(200, 100, 255, ${opacity})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      this.drawPortalArrow(ctx, portal, opacity);
    }
  }

  private drawPortalArrow(ctx: CanvasRenderingContext2D, portal: PortalLine, opacity: number): void {
    const numArrows = 3;
    const arrowSize = 8;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
    
    for (let i = 0; i < numArrows; i++) {
      const t = (i + 1) / (numArrows + 1) - 0.5;
      const posX = portal.center.x + portal.tangent.x * portal.length * 2 * t;
      const posY = portal.center.y + portal.tangent.y * portal.length * 2 * t;
      
      ctx.beginPath();
      ctx.moveTo(
        posX + portal.normal.x * arrowSize,
        posY + portal.normal.y * arrowSize
      );
      ctx.lineTo(
        posX + portal.normal.x * arrowSize * 0.3 - portal.tangent.x * arrowSize * 0.5,
        posY + portal.normal.y * arrowSize * 0.3 - portal.tangent.y * arrowSize * 0.5
      );
      ctx.lineTo(
        posX + portal.normal.x * arrowSize * 0.3 + portal.tangent.x * arrowSize * 0.5,
        posY + portal.normal.y * arrowSize * 0.3 + portal.tangent.y * arrowSize * 0.5
      );
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawWormholeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    for (let i = 0; i < 720; i++) {
      const angle = (i / 180) * Math.PI;
      const radius = scale * 0.2 + (i / 720) * scale * 0.5;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, scale * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  isComplete(): boolean {
    return this.state === 'COMPLETE';
  }

  hasKilledPlayer(): boolean {
    return false;
  }
}
