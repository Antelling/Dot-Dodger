import { Vector2, Bounds } from '../types';
import { Renderer } from '../renderer/Renderer';
import { Vec2, wrapInPlace } from '../utils/math';
import { PLAYER_HITBOX_RADIUS, PLAYER_VISUAL_RADIUS, PLAYER_ARROW_LENGTH, COLOR_PLAYER, COLOR_PLAYER_ARROW } from '../utils/constants';

export class Player {
  position: Vec2;
  velocity: Vector2 = { x: 0, y: 0 };
  directionAngle: number = 0;
  readonly hitboxRadius: number = PLAYER_HITBOX_RADIUS;

  constructor(x: number, y: number) {
    this.position = new Vec2(x, y);
  }

  update(dt: number, inputVelocity: Vector2, bounds: Bounds, shouldWrap: boolean = true): void {
    this.velocity.x = inputVelocity.x;
    this.velocity.y = inputVelocity.y;
    
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      this.directionAngle = Math.atan2(this.velocity.y, this.velocity.x);
    }
    
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    if (shouldWrap) {
      wrapInPlace(this.position, bounds);
    } else {
      this.position.x = Math.max(0, Math.min(bounds.width, this.position.x));
      this.position.y = Math.max(0, Math.min(bounds.height, this.position.y));
    }
  }

  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  render(renderer: Renderer): void {
    renderer.drawCircleImmediate(
      this.position.x,
      this.position.y,
      PLAYER_VISUAL_RADIUS,
      COLOR_PLAYER
    );
    
    const arrowStartX = this.position.x + Math.cos(this.directionAngle) * (PLAYER_VISUAL_RADIUS + 2);
    const arrowStartY = this.position.y + Math.sin(this.directionAngle) * (PLAYER_VISUAL_RADIUS + 2);
    
    renderer.drawArrow(
      arrowStartX,
      arrowStartY,
      this.directionAngle,
      PLAYER_ARROW_LENGTH,
      COLOR_PLAYER_ARROW
    );
  }

  getPosition(): Vector2 {
    return this.position;
  }
}
