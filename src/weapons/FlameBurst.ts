import { Weapon } from './Weapon';
import type { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponType, Bounds, Vector2 } from '../types';
import type { Renderer } from '../renderer/Renderer';

interface FlameParticle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

interface FireTrail {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export class FlameBurst extends Weapon {
  readonly type = WeaponType.FLAME_BURST;
  
  private readonly FLAME_DURATION_MS = 3000;
  private readonly CONE_ANGLE_RAD = Math.PI / 3;
  private readonly FLAME_REACH_PX = 200;
  private readonly TRAIL_DURATION_MS = 1000;
  private readonly PARTICLE_MAX_AGE_MS = 200;
  private readonly PARTICLE_AGE_VARIANCE_MS = 100;
  private readonly PARTICLES_PER_FRAME = 5;
  private readonly FRAME_TIME_MS = 16;
  
  private playerPosition: Vector2 = { x: 0, y: 0 };
  private playerAngle: number = 0;
  private flames: FlameParticle[] = [];
  private trails: FireTrail[] = [];
  private isActive: boolean = false;
  private complete: boolean = false;
  
  activate(player: Player, _dots: Dot[]): void {
    this.start();
    this.dots = _dots;
    this.playerPosition = player.getPosition();
    this.playerAngle = player.directionAngle;
    this.flames = [];
    this.trails = [];
    this.isActive = true;
    this.complete = false;
  }
  
  update(_dt: number, player: Player, dots: Dot[], _bounds: Bounds): void {
    if (this.complete) return;
    
    const elapsed = this.getElapsedTime();
    
    if (elapsed >= this.FLAME_DURATION_MS) {
      this.isActive = false;
      const now = Date.now();
      this.trails = this.trails.filter(trail => now - trail.startTime < trail.duration);
      if (this.trails.length === 0) {
        this.complete = true;
      }
      return;
    }
    
    this.playerPosition = player.getPosition();
    this.playerAngle = player.directionAngle;
    
    this.spawnFlameParticles();
    
    this.flames = this.flames.filter(flame => {
      flame.age += this.FRAME_TIME_MS;
      return flame.age < flame.maxAge;
    });
    
    if (Math.random() < 0.3) {
      this.spawnFireTrail();
    }
    
    const now = Date.now();
    this.trails = this.trails.filter(trail => now - trail.startTime < trail.duration);
    
    this.killDotsInFlameCone(dots);
  }
  
  private spawnFlameParticles(): void {
    for (let i = 0; i < this.PARTICLES_PER_FRAME; i++) {
      const angleOffset = (Math.random() - 0.5) * this.CONE_ANGLE_RAD;
      const angle = this.playerAngle + angleOffset;
      const distance = Math.random() * this.FLAME_REACH_PX;
      const jitterX = (Math.random() - 0.5) * 20;
      const jitterY = (Math.random() - 0.5) * 20;
      
      this.flames.push({
        x: this.playerPosition.x + Math.cos(angle) * distance + jitterX,
        y: this.playerPosition.y + Math.sin(angle) * distance + jitterY,
        age: 0,
        maxAge: this.PARTICLE_MAX_AGE_MS + Math.random() * this.PARTICLE_AGE_VARIANCE_MS
      });
    }
  }
  
  private spawnFireTrail(): void {
    const angleOffset = (Math.random() - 0.5) * this.CONE_ANGLE_RAD;
    const angle = this.playerAngle + angleOffset;
    const distance = 20 + Math.random() * 60;
    
    this.trails.push({
      x: this.playerPosition.x + Math.cos(angle) * distance,
      y: this.playerPosition.y + Math.sin(angle) * distance,
      startTime: Date.now(),
      duration: this.TRAIL_DURATION_MS
    });
  }
  
  private killDotsInFlameCone(dots: Dot[]): void {
    if (!dots || dots.length === 0) return;
    
    const halfConeAngle = this.CONE_ANGLE_RAD / 2;

    for (const dot of dots) {
      if (dot.isDead()) continue;
      
      const dotPos = dot.getPosition();
      const dx = dotPos.x - this.playerPosition.x;
      const dy = dotPos.y - this.playerPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > this.FLAME_REACH_PX) continue;
      
      const dotAngle = Math.atan2(dy, dx);
      let angleDiff = dotAngle - this.playerAngle;
      
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (Math.abs(angleDiff) <= halfConeAngle) {
        dot.kill();
        this.addKilledDot();
      }
    }
  }
  
  render(renderer: Renderer): void {
    if (this.complete) return;
    
    const ctx = renderer.getContext();
    const now = Date.now();
    
    this.renderTrails(ctx, now);
    
    if (!this.isActive) return;
    
    this.renderFlameCone(ctx);
    this.renderFlameParticles(ctx);
  }
  
  private renderTrails(ctx: CanvasRenderingContext2D, now: number): void {
    for (const trail of this.trails) {
      const age = now - trail.startTime;
      const progress = age / trail.duration;
      const alpha = Math.max(0, 1 - progress);
      const radius = 8 + progress * 5;
      
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.6})`;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.8})`;
      ctx.fill();
    }
  }
  
  private renderFlameCone(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.playerPosition.x, this.playerPosition.y);
    ctx.rotate(this.playerAngle);
    
    const coneGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.FLAME_REACH_PX);
    coneGradient.addColorStop(0, 'rgba(255, 150, 0, 0.3)');
    coneGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.2)');
    coneGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, this.FLAME_REACH_PX, -this.CONE_ANGLE_RAD / 2, this.CONE_ANGLE_RAD / 2);
    ctx.closePath();
    ctx.fillStyle = coneGradient;
    ctx.fill();
    
    ctx.restore();
  }
  
  private renderFlameParticles(ctx: CanvasRenderingContext2D): void {
    for (const flame of this.flames) {
      const progress = flame.age / flame.maxAge;
      const alpha = Math.max(0, 1 - progress);
      const size = 6 + progress * 8;
      
      ctx.beginPath();
      ctx.arc(flame.x, flame.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${Math.floor(100 + progress * 50)}, 0, ${alpha * 0.5})`;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(flame.x, flame.y, size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${Math.floor(200 + progress * 55)}, ${Math.floor(50 + progress * 100)}, ${alpha * 0.8})`;
      ctx.fill();
    }
  }
  
  isComplete(): boolean {
    return this.complete;
  }
}
