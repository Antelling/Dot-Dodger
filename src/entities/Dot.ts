import { Vector2, Bounds, DotState } from '../types';
import { Renderer } from '../renderer/Renderer';
import { Vec2, wrapInPlace } from '../utils/math';
import { DOT_RADIUS, DOT_SPAWN_ANIMATION_DURATION, DOT_SPAWN_SCALE_MAX, COLOR_DOT, COLOR_DOT_SPAWNING, COLOR_DOT_FROZEN } from '../utils/constants';

const FROZEN_BORDER_MAX_THICKNESS = 8;
const FROZEN_BORDER_COLOR = '#00CCFF';

const SPAWN_INV_DURATION = 1 / DOT_SPAWN_ANIMATION_DURATION;
const SCALE_RANGE = DOT_SPAWN_SCALE_MAX - 1;

export class Dot {
  position: Vec2;
  velocity: Vector2;
  state: DotState;
  patternId: string | null = null;
  
  private spawnElapsed: number = 0;
  private currentScale: number = DOT_SPAWN_SCALE_MAX;
  readonly radius: number = DOT_RADIUS;
  
  // Frozen/thaw properties
  private frozenTime: number = 0;
  private readonly thawDuration: number = 3000; // 3 seconds
  private readonly preThawWarningTime: number = 500; // Start vibrating 500ms before thaw
  private isZombie: boolean = false;
  private readonly zombieSpeed: number = 50;
  private vibrationOffset: Vector2 = { x: 0, y: 0 };
  private frozenBorderThickness: number = FROZEN_BORDER_MAX_THICKNESS;

  constructor(x: number, y: number, patternId: string | null = null) {
    this.position = new Vec2(x, y);
    this.velocity = { x: 0, y: 0 };
    this.state = DotState.SPAWNING;
    this.patternId = patternId;
  }

  update(dt: number, bounds: Bounds, playerPosition?: Vector2): void {
    if (this.state === DotState.SPAWNING) {
      this.spawnElapsed += dt * 1000;
      const progress = this.spawnElapsed * SPAWN_INV_DURATION;
      
      if (progress >= 1) {
        this.state = DotState.ACTIVE;
        this.currentScale = 1;
      } else {
        this.currentScale = DOT_SPAWN_SCALE_MAX - SCALE_RANGE * progress;
      }
      return;
    }
    
    if (this.state === DotState.FROZEN) {
      this.frozenTime += dt * 1000;

      const frozenProgress = Math.min(this.frozenTime / this.thawDuration, 1);
      this.frozenBorderThickness = FROZEN_BORDER_MAX_THICKNESS * (1 - frozenProgress);

      const timeUntilThaw = this.thawDuration - this.frozenTime;
      if (timeUntilThaw <= this.preThawWarningTime && timeUntilThaw > 0) {
        const shakeIntensity = 2 * (1 - timeUntilThaw / this.preThawWarningTime);
        this.vibrationOffset.x = (Math.random() - 0.5) * shakeIntensity;
        this.vibrationOffset.y = (Math.random() - 0.5) * shakeIntensity;
      } else {
        this.vibrationOffset.x = 0;
        this.vibrationOffset.y = 0;
      }

      if (this.frozenTime >= this.thawDuration) {
        this.thaw(playerPosition);
      }
      return;
    }
    
    if (this.state !== DotState.ACTIVE) {
      return;
    }
    
    // If this is a zombie dot (thawed from frozen), chase the player
    if (this.isZombie && playerPosition) {
      const dx = playerPosition.x - this.position.x;
      const dy = playerPosition.y - this.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        this.velocity.x = (dx / dist) * this.zombieSpeed;
        this.velocity.y = (dy / dist) * this.zombieSpeed;
      }
    }
    
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    wrapInPlace(this.position, bounds);
  }

  render(renderer: Renderer): void {
    const currentRadius = this.radius * this.currentScale;

    let color: string;
    switch (this.state) {
      case DotState.SPAWNING:
        color = COLOR_DOT_SPAWNING;
        break;
      case DotState.FROZEN:
        color = COLOR_DOT_FROZEN;
        break;
      default:
        color = COLOR_DOT;
    }

    const renderX = this.position.x + this.vibrationOffset.x;
    const renderY = this.position.y + this.vibrationOffset.y;

    renderer.drawCircle(
      renderX,
      renderY,
      currentRadius,
      color
    );
    
    if (this.state === DotState.SPAWNING) {
      const alpha = 1 - this.currentScale / DOT_SPAWN_SCALE_MAX;
      renderer.drawCircleOutline(
        renderX,
        renderY,
        currentRadius * 1.5,
        `rgba(255,102,102,${alpha.toFixed(2)})`
      );
    }

    if (this.state === DotState.FROZEN) {
      // Draw light blue border as an outline that shrinks as they thaw
      renderer.drawCircleOutline(
        renderX,
        renderY,
        currentRadius + this.frozenBorderThickness,
        FROZEN_BORDER_COLOR
      );
      renderer.drawCircle(
        renderX,
        renderY,
        currentRadius,
        color
      );
    }
  }

  isLethal(): boolean {
    return this.state === DotState.ACTIVE;
  }

  isFrozen(): boolean {
    return this.state === DotState.FROZEN;
  }

  freeze(): void {
    if (this.state === DotState.ACTIVE) {
      this.state = DotState.FROZEN;
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.frozenTime = 0;
      this.frozenBorderThickness = FROZEN_BORDER_MAX_THICKNESS;
    }
  }

  thaw(playerPosition?: Vector2): void {
    if (this.state === DotState.FROZEN) {
      this.state = DotState.ACTIVE;
      this.isZombie = true;
      this.vibrationOffset.x = 0;
      this.vibrationOffset.y = 0;
      if (playerPosition) {
        const dx = playerPosition.x - this.position.x;
        const dy = playerPosition.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          this.velocity.x = (dx / dist) * this.zombieSpeed;
          this.velocity.y = (dy / dist) * this.zombieSpeed;
        }
      }
    }
  }

  kill(): void {
    this.state = DotState.DEAD;
  }

  isDead(): boolean {
    return this.state === DotState.DEAD;
  }

  getPosition(): Vector2 {
    return this.position;
  }

  getRadius(): number {
    return this.radius;
  }

  getEffectiveRadius(): number {
    if (this.state === DotState.FROZEN) {
      return this.radius + this.frozenBorderThickness;
    }
    return this.radius;
  }
}
