import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2, DotState } from '../types';
import { randomPosition } from '../utils/math';
import { DOT_RADIUS } from '../utils/constants';
import { Dot } from '../entities/Dot';
import { Renderer } from '../renderer/Renderer';

export class GatlingPoint extends Pattern {
  readonly type = PatternType.GATLING_POINT;
  difficulty: Difficulty = Difficulty.MEDIUM;

  private shootDuration: number;
  private readonly dotSpeed: number = 400;
  private shootInterval: number = 100;
  private elapsedSinceSpawn: number = 0;
  private spawnPoint: Vector2 = { x: 0, y: 0 };
  private spawnPointDot: Dot | null = null;
  private readonly spawnPointRadius: number = DOT_RADIUS;
  private spawnPointDead: boolean = false;
  private cooldownDuration: number = 5000; // 5 seconds between bursts
  private cooldownElapsed: number = 0;
  private isShooting: boolean = false; // Start in spawn animation, then shooting mode
  private shootingElapsed: number = 0;
  private masterSpawnDuration: number = 1500; // 1.5 second spawn animation for master dot
  private masterSpawnElapsed: number = 0;
  private shotsFired: number = 0;
  private readonly slowShotCount: number = 5; // First 5 shots are slower
  private readonly slowShotSpeedMultiplier: number = 0.5; // Half speed for slow shots

  constructor(difficulty: Difficulty = Difficulty.MEDIUM) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.shootDuration = 6000;
        this.shootInterval = 50;
        break;
      case Difficulty.MEDIUM:
        this.shootDuration = 4500;
        this.shootInterval = 80;
        break;
      default:
        this.shootDuration = 3000;
        this.shootInterval = 100;
    }
  }

  spawn(_center: Vector2, _bounds: Bounds): void {
    this.start();
    const margin = 50;
    this.spawnPoint = randomPosition(_bounds, margin);
    
    this.spawnPointDot = new Dot(this.spawnPoint.x, this.spawnPoint.y, this.type);
    // Master dot starts in SPAWNING state - will become ACTIVE after animation
    // Use Object.defineProperty to override the readonly radius for the spawn point
    Object.defineProperty(this.spawnPointDot, 'radius', {
      value: this.spawnPointRadius,
      writable: false,
      configurable: true
    });
    this.dots.push(this.spawnPointDot);
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    if (this.spawnPointDot && !this.spawnPointDead) {
      if (this.spawnPointDot.isDead()) {
        this.spawnPointDead = true;
      } else if (this.spawnPointDot.isFrozen()) {
        // Spawn point frozen - stop spawning
      } else {
        // Update master dot spawn animation first
        this.updateMasterSpawnAnimation(dt);
        this.updateShootingLogic(dt, playerPosition);
      }
    }

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      if (!dot.isLethal()) {
        dot.update(dt, bounds, playerPosition);
        continue;
      }

      const pos = dot.getPosition();
      const vel = dot.velocity;

      if (pos.x < -100 || pos.x > bounds.width + 100 ||
          pos.y < -100 || pos.y > bounds.height + 100) {
        this.dots.splice(i, 1);
        continue;
      }

      const radius = dot.radius;

      // Bounce off walls - only reverse velocity when moving toward the wall
      // and clamp position to prevent getting stuck
      if (pos.x <= radius && vel.x < 0) {
        vel.x = -vel.x * 0.5;
        pos.x = radius + 1;
      } else if (pos.x >= bounds.width - radius && vel.x > 0) {
        vel.x = -vel.x * 0.5;
        pos.x = bounds.width - radius - 1;
      }
      
      if (pos.y <= radius && vel.y < 0) {
        vel.y = -vel.y * 0.5;
        pos.y = radius + 1;
      } else if (pos.y >= bounds.height - radius && vel.y > 0) {
        vel.y = -vel.y * 0.5;
        pos.y = bounds.height - radius - 1;
      }

      dot.update(dt, bounds, playerPosition);
    }
  }

  private updateMasterSpawnAnimation(dt: number): void {
    if (this.spawnPointDot && this.spawnPointDot.state === DotState.SPAWNING) {
      this.masterSpawnElapsed += dt * 1000;
      // Update the dot's internal spawn animation
      this.spawnPointDot.update(dt, { width: 0, height: 0 });
      
      if (this.masterSpawnElapsed >= this.masterSpawnDuration) {
        this.spawnPointDot.state = DotState.ACTIVE;
        this.isShooting = true;
      }
    }
  }

  private updateShootingLogic(dt: number, playerPosition: Vector2): void {
    if (this.isShooting) {
      // Shooting phase
      this.shootingElapsed += dt * 1000;
      this.elapsedSinceSpawn += dt * 1000;
      
      if (this.elapsedSinceSpawn >= this.shootInterval) {
        this.elapsedSinceSpawn = 0;
        this.spawnDotAtPoint(playerPosition);
      }
      
      // Check if shooting phase is done
      if (this.shootingElapsed >= this.shootDuration) {
        this.isShooting = false;
        this.cooldownElapsed = 0;
      }
    } else {
      // Cooldown phase - wait 5 seconds
      this.cooldownElapsed += dt * 1000;
      
      if (this.cooldownElapsed >= this.cooldownDuration) {
        // Start shooting again
        this.isShooting = true;
        this.shootingElapsed = 0;
        this.elapsedSinceSpawn = 0;
      }
    }
  }

  private spawnDotAtPoint(playerPosition: Vector2): void {
    const dx = playerPosition.x - this.spawnPoint.x;
    const dy = playerPosition.y - this.spawnPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      // Calculate speed - first few shots are slower
      let speed = this.dotSpeed;
      if (this.shotsFired < this.slowShotCount) {
        speed = this.dotSpeed * this.slowShotSpeedMultiplier;
      }
      this.shotsFired++;

      const dot = this.spawnDot(this.spawnPoint.x, this.spawnPoint.y, {
        x: (dx / dist) * speed,
        y: (dy / dist) * speed
      });
      // Skip spawn animation - make instantly active and lethal
      dot.skipSpawnAnimation();
    } else {
      this.spawnDot(this.spawnPoint.x, this.spawnPoint.y);
    }
  }

  isComplete(): boolean {
    // Pattern is complete when master point is killed or frozen and all dots are gone
    if (this.spawnPointDead || (this.spawnPointDot && this.spawnPointDot.isFrozen())) {
      return this.getDots().length === 0;
    }
    // Master point is still alive - pattern never completes until killed
    return false;
  }

  isActivelySpawning(): boolean {
    if (this.spawnPointDead || (this.spawnPointDot && this.spawnPointDot.isFrozen())) {
      return false;
    }
    return this.isShooting;
  }

  getSpawnPointDot(): Dot | null {
    return this.spawnPointDot;
  }

  isSpawnPointDead(): boolean {
    return this.spawnPointDead;
  }
  render(renderer: Renderer): void {
    super.render?.(renderer);

    if (this.spawnPointDot && !this.spawnPointDot.isDead() && !this.spawnPointDot.isFrozen()) {
      const pos = this.spawnPointDot.getPosition();
      const pulse = 1 + Math.sin(this.elapsedMs * 0.005) * 0.2;
      
      renderer.drawCircleOutline(
        pos.x,
        pos.y,
        this.spawnPointRadius * pulse,
        '#FFD700',
        3
      );
      
      renderer.drawCircleOutline(
        pos.x,
        pos.y,
        this.spawnPointRadius * pulse * 1.3,
        'rgba(255, 215, 0, 0.3)',
        1
      );
    }
  }
}
