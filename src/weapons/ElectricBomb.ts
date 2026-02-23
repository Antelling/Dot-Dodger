import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';


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

export class ElectricBomb extends Weapon {
  readonly type = WeaponType.ELECTRIC_BOMB;

  private state: 'ROLLING' | 'CHAINING' | 'COMPLETE' = 'ROLLING';
  private orbPosition: Vector2 = { x: 0, y: 0 };
  private orbVelocity: Vector2 = { x: 0, y: 0 };
  private chainNodes: ChainNode[] = [];
  private lightningArcs: LightningArc[] = [];
  private dotsToProcess: Dot[] = [];
  private readonly initialRadiusFactor: number = 0.25;
  private readonly chainRadiusFactor: number = 0.10;
  private readonly maxChainDepth: number = 1000;

  private orbRadius: number = 12;
  private rollingDuration: number = 1500;
  private chainDelayMs: number = 80;
  private lastChainTime: number = 0;
  private bounds: Bounds | null = null;
  private lastCollisionTime: number = 0;
  private readonly collisionCooldown: number = 100;

  activate(player: Player, dots: Dot[], initialPosition?: { x: number; y: number }): void {
    this.dots = dots;
    this.start();

    // Use provided position (from WeaponOrb) or fallback to player position
    if (initialPosition) {
      this.orbPosition = { x: initialPosition.x, y: initialPosition.y };
    } else {
      this.orbPosition = { ...player.getPosition() };
    }

    // Start with zero velocity like NuclearBomb - inherits momentum from nudging
    this.orbVelocity = { x: 0, y: 0 };

    this.state = 'ROLLING';
  }

  update(_dt: number, player: Player, dots: Dot[], bounds: Bounds): void {
    if (this.bounds === null) {
      this.bounds = bounds;
    }

    switch (this.state) {
      case 'ROLLING':
        this.updateRolling(_dt, bounds);
        break;

      case 'CHAINING':
        this.updateChaining(dots, player, bounds);
        break;

      case 'COMPLETE':
        break;
    }
  }

  getPosition(): Vector2 {
    return this.orbPosition;
  }

  getRadius(): number {
    return this.orbRadius;
  }

  handlePlayerCollision(_player: Player, playerVelocity: Vector2): boolean {
    const now = Date.now();
    if (now - this.lastCollisionTime < this.collisionCooldown) {
      return false;
    }
    this.lastCollisionTime = now;

    const dx = this.orbPosition.x - _player.position.x;
    const dy = this.orbPosition.y - _player.position.y;
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

    const velocityMultiplier = 1.5;

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

  private updateRolling(dt: number, bounds: Bounds): void {
    this.orbPosition.x += this.orbVelocity.x * dt;
    this.orbPosition.y += this.orbVelocity.y * dt;

    if (this.orbPosition.x - this.orbRadius < 0) {
      this.orbPosition.x = this.orbRadius;
      this.orbVelocity.x = Math.abs(this.orbVelocity.x);
    } else if (this.orbPosition.x + this.orbRadius > bounds.width) {
      this.orbPosition.x = bounds.width - this.orbRadius;
      this.orbVelocity.x = -Math.abs(this.orbVelocity.x);
    }

    if (this.orbPosition.y - this.orbRadius < 0) {
      this.orbPosition.y = this.orbRadius;
      this.orbVelocity.y = Math.abs(this.orbVelocity.y);
    } else if (this.orbPosition.y + this.orbRadius > bounds.height) {
      this.orbPosition.y = bounds.height - this.orbRadius;
      this.orbVelocity.y = -Math.abs(this.orbVelocity.y);
    }

    if (this.getElapsedTime() >= this.rollingDuration) {
      this.triggerInitialExplosion();
    }
  }

  private triggerInitialExplosion(): void {
    this.state = 'CHAINING';
    this.lastChainTime = Date.now();


    const radius = (this.bounds?.width ?? 800) * this.initialRadiusFactor;
    
    this.chainNodes.push({
      x: this.orbPosition.x,
      y: this.orbPosition.y,
      radius,
      activatedAt: Date.now(),
      chainDepth: 0
    });

    this.findAndElectrifyDots(this.chainNodes[0]);
  }

  private findAndElectrifyDots(node: ChainNode): void {
    for (const dot of this.dots) {
      if (dot.isDead()) continue;
      
      const pos = dot.getPosition();
      const dx = pos.x - node.x;
      const dy = pos.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= node.radius) {
        dot.kill();
        this.addKilledDot();
        
        this.lightningArcs.push({
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
        
        this.chainNodes.push(newNode);
        this.dotsToProcess.push(dot);
      }
    }
  }

  private updateChaining(dots: Dot[], player: Player, _bounds: Bounds): void {
    if (!dots || dots.length === 0) {
      this.state = 'COMPLETE';
      return;
    }

    const now = Date.now();

    if (now - this.lastChainTime < this.chainDelayMs) {
      return;
    }

    this.lastChainTime = now;

    const pendingNodes = this.chainNodes.filter(n =>
      n.chainDepth > 0 &&
      now - n.activatedAt < 100 &&
      n.chainDepth < this.maxChainDepth
    );

    if (pendingNodes.length === 0) {
      this.checkPlayerHit(player);

      const activeNodes = this.chainNodes.filter(n =>
        now - n.activatedAt < 600
      );

      // Complete if no active nodes OR if only the initial node (depth 0) exists
      // (meaning the chain never started because no dots were in range)
      const hasChainNodes = this.chainNodes.some(n => n.chainDepth > 0);

      if (activeNodes.length === 0 || !hasChainNodes) {
        this.state = 'COMPLETE';
      }
      return;
    }

    for (const node of pendingNodes) {
      this.findAndElectrifyDots(node);
    }

    this.checkPlayerHit(player);
  }

  private checkPlayerHit(_player: Player): void {
  }

  render(renderer: Renderer): void {
    if (this.state === 'ROLLING') {
      renderer.drawCircle(
        this.orbPosition.x,
        this.orbPosition.y,
        this.orbRadius,
        '#00FFFF'
      );

      renderer.drawCircleOutline(
        this.orbPosition.x,
        this.orbPosition.y,
        this.orbRadius + 4,
        'rgba(0, 255, 255, 0.5)',
        2
      );
    } else if (this.state === 'CHAINING' || this.state === 'COMPLETE') {
      this.renderChainNodes(renderer);
      this.renderLightning(renderer);
    }
  }

  private renderChainNodes(renderer: Renderer): void {
    const now = Date.now();
    const fadeTime = 500;

    this.chainNodes = this.chainNodes.filter(node => now - node.activatedAt < fadeTime + 100);

    for (const node of this.chainNodes) {
      const age = now - node.activatedAt;
      const opacity = Math.max(0, 1 - age / fadeTime);

      if (opacity > 0) {
        renderer.drawCircle(
          node.x,
          node.y,
          node.radius,
          `rgba(0, 255, 255, ${opacity * 0.3})`
        );

        renderer.drawCircleOutline(
          node.x,
          node.y,
          node.radius,
          `rgba(0, 255, 255, ${opacity})`,
          3
        );
      }
    }
  }

  private renderLightning(renderer: Renderer): void {
    const now = Date.now();
    const lightningFadeTime = 500;

    this.lightningArcs = this.lightningArcs.filter(arc => now - arc.createdAt < lightningFadeTime);

    for (const arc of this.lightningArcs) {
      const age = now - arc.createdAt;
      const opacity = Math.max(0, 1 - age / lightningFadeTime);

      if (opacity > 0) {
        this.drawJaggedLightning(
          renderer,
          arc.x1,
          arc.y1,
          arc.x2,
          arc.y2,
          opacity,
          arc.chainDepth
        );
      }
    }
  }

  private drawJaggedLightning(
    renderer: Renderer,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opacity: number,
    chainDepth: number
  ): void {
    const segments = 3 + Math.min(chainDepth, 3);
    const jitter = 6 + chainDepth * 2;
    const color = `rgba(0, 200, 255, ${opacity})`;
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

    for (let i = 0; i < points.length - 1; i++) {
      renderer.drawLine(
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y,
        glowColor,
        4
      );
    }

    for (let i = 0; i < points.length - 1; i++) {
      renderer.drawLine(
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y,
        color,
        2
      );
    }
  }

  isActive(): boolean {
    return this.state === 'ROLLING';
  }

  isComplete(): boolean {
    return this.state === 'COMPLETE';
  }

  hasKilledPlayer(): boolean {
    return false;
  }

  getExplosionCount(): number {
    return this.chainNodes.length;
  }
}
