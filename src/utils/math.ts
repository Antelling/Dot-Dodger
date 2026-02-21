import { Vector2, Bounds } from '../types';

export class Vec2 implements Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  static from(v: Vector2): Vec2 {
    return new Vec2(v.x, v.y);
  }

  add(other: Vector2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vec2 {
    if (scalar === 0) throw new Error('Division by zero');
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vec2 {
    const mag = this.magnitude();
    if (mag === 0) return new Vec2(0, 0);
    return this.divide(mag);
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(other: Vector2): number {
    return Math.atan2(other.y - this.y, other.x - this.x);
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  set(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  addInPlace(other: Vector2): void {
    this.x += other.x;
    this.y += other.y;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function wrap(position: Vector2, bounds: Bounds): Vector2 {
  let x = position.x;
  let y = position.y;
  if (bounds.width > 0 && bounds.height > 0) {
    while (x < 0) x += bounds.width;
    while (y < 0) y += bounds.height;
    x = x % bounds.width;
    y = y % bounds.height;
  }
  return { x, y };
}

export function wrapInPlace(position: Vector2, bounds: Bounds): void {
  if (bounds.width > 0 && bounds.height > 0) {
    while (position.x < 0) position.x += bounds.width;
    while (position.y < 0) position.y += bounds.height;
    position.x = position.x % bounds.width;
    position.y = position.y % bounds.height;
  }
}

export function circleCollision(
  a: Vector2,
  radiusA: number,
  b: Vector2,
  radiusB: number
): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distanceSq = dx * dx + dy * dy;
  const radiiSum = radiusA + radiusB;
  return distanceSq < radiiSum * radiiSum;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomPosition(bounds: Bounds, margin: number = 0): Vector2 {
  return {
    x: margin + Math.random() * (bounds.width - margin * 2),
    y: margin + Math.random() * (bounds.height - margin * 2)
  };
}
