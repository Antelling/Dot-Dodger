import { Pattern } from './Pattern';
import { Dot } from '../entities/Dot';
import { PatternType, Difficulty, Bounds, Vector2, DotState } from '../types';
import { DOT_RADIUS, DOT_SPAWN_ANIMATION_DURATION } from '../utils/constants';
import { Renderer } from '../renderer/Renderer';

export class BulletHell extends Pattern {
  readonly type = PatternType.BULLET_HELL;
  difficulty: Difficulty = Difficulty.HARD;

  private duration: number = 15000;
  private readonly baseDotSpeed: number = 250;
  private readonly warningDuration: number = DOT_SPAWN_ANIMATION_DURATION;
  private readonly spawnInterval: number = 150; // Spawn every 150ms

  private originX: number = 0;
  private originY: number = 0;
  private hasStartedSpawning: boolean = false;
  private spawnAccumulator: number = 0;
  private patternPhase: number = 0;
  private spawnTimeoutId: number | null = null;

  constructor(difficulty: Difficulty = Difficulty.HARD) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.duration = 15000;
        break;
      case Difficulty.MEDIUM:
        this.duration = 12000;
        break;
    }
  }

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();
    this.hasStartedSpawning = false;
    this.spawnAccumulator = 0;
    this.patternPhase = 0;

    // Always spawn from top center for classic bullet hell feel
    this.originX = bounds.width / 2;
    this.originY = -30;

    this.spawnTimeoutId = window.setTimeout(() => {
      this.hasStartedSpawning = true;
    }, this.warningDuration);
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    if (this.hasStartedSpawning && this.elapsedMs <= this.duration + this.warningDuration) {
      this.spawnAccumulator += dt * 1000;
      
      // Spawn bullets based on interval
      while (this.spawnAccumulator >= this.spawnInterval) {
        this.spawnAccumulator -= this.spawnInterval;
        this.spawnBulletWave(playerPosition);
      }
    }

    // Update pattern phase for geometric animations
    this.patternPhase += dt * 0.5;

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      
      // Skip frozen dots - they should not move
      if (dot.isFrozen()) {
        dot.update(dt, bounds, playerPosition);
        continue;
      }
      
      const pos = dot.getPosition();

      if (pos.x < -DOT_RADIUS || pos.x > bounds.width + DOT_RADIUS ||
          pos.y < -DOT_RADIUS || pos.y > bounds.height + DOT_RADIUS) {
        this.dots.splice(i, 1);
        continue;
      }

      dot.position.x += dot.velocity.x * dt;
      dot.position.y += dot.velocity.y * dt;
    }
  }

  render(renderer: Renderer): void {
    super.render?.(renderer);

    if (!this.hasStartedSpawning && this.isStarted) {
      const progress = Math.min(this.elapsedMs / this.warningDuration, 1);
      const scale = 1.5 - 0.5 * progress;
      const alpha = 1 - progress;

      renderer.drawCircle(
        this.originX,
        this.originY,
        DOT_RADIUS * scale * 2,
        `rgba(255, 102, 102, ${alpha.toFixed(2)})`
      );

      renderer.drawCircleOutline(
        this.originX,
        this.originY,
        DOT_RADIUS * scale * 3,
        `rgba(255, 0, 0, ${alpha.toFixed(2)})`
      );
    }
  }

  private spawnBulletWave(playerPosition: Vector2): void {
    const time = this.elapsedMs * 0.001;
    const patternType = Math.floor(time / 3) % 4; // Change pattern every 3 seconds

    switch (patternType) {
      case 0:
        this.spawnSpiral();
        break;
      case 1:
        this.spawnCircleBurst();
        break;
      case 2:
        this.spawnAimedStreams(playerPosition);
        break;
      case 3:
        this.spawnWavePattern();
        break;
    }
  }

  private spawnSpiral(): void {
    // Classic bullet hell spiral
    const arms = 3;
    const bulletsPerArm = 2;
    const spiralSpeed = 2.0;
    
    for (let arm = 0; arm < arms; arm++) {
      const baseAngle = this.patternPhase * spiralSpeed + (arm * Math.PI * 2 / arms);
      
      for (let i = 0; i < bulletsPerArm; i++) {
        const angle = baseAngle + i * 0.1;
        const speed = this.baseDotSpeed * (0.8 + i * 0.1);
        
        const dot = new Dot(this.originX, this.originY, this.type);
        dot.velocity.x = Math.cos(angle) * speed;
        dot.velocity.y = Math.sin(angle) * speed;
        dot.state = DotState.ACTIVE;
        this.dots.push(dot);
      }
    }
  }

  private spawnCircleBurst(): void {
    // Full circle of bullets radiating outward
    const bulletCount = 16;
    const angleStep = (Math.PI * 2) / bulletCount;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = i * angleStep + this.patternPhase * 0.5;
      const dot = new Dot(this.originX, this.originY, this.type);
      dot.velocity.x = Math.cos(angle) * this.baseDotSpeed;
      dot.velocity.y = Math.sin(angle) * this.baseDotSpeed;
      dot.state = DotState.ACTIVE;
      this.dots.push(dot);
    }
  }

  private spawnAimedStreams(playerPosition: Vector2): void {
    // Multiple streams aimed at player position
    const streamCount = 5;
    const baseAngle = Math.atan2(
      playerPosition.y - this.originY,
      playerPosition.x - this.originX
    );
    
    for (let i = 0; i < streamCount; i++) {
      const spread = (i - Math.floor(streamCount / 2)) * 0.15;
      const angle = baseAngle + spread;
      const speed = this.baseDotSpeed * (0.9 + Math.random() * 0.2);
      
      const dot = new Dot(this.originX, this.originY, this.type);
      dot.velocity.x = Math.cos(angle) * speed;
      dot.velocity.y = Math.sin(angle) * speed;
      dot.state = DotState.ACTIVE;
      this.dots.push(dot);
    }
  }

  private spawnWavePattern(): void {
    // Sine wave pattern of bullets
    const waveWidth = Math.PI;
    const bulletsInWave = 7;
    const baseAngle = Math.PI / 2 + Math.sin(this.patternPhase * 2) * 0.3; // Slight sweeping
    
    for (let i = 0; i < bulletsInWave; i++) {
      const waveOffset = (i / (bulletsInWave - 1) - 0.5) * waveWidth;
      const angle = baseAngle + waveOffset;
      const speed = this.baseDotSpeed * (0.7 + Math.abs(waveOffset) * 0.3);
      
      const dot = new Dot(this.originX, this.originY, this.type);
      dot.velocity.x = Math.cos(angle) * speed;
      dot.velocity.y = Math.sin(angle) * speed;
      dot.state = DotState.ACTIVE;
      this.dots.push(dot);
    }
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration + this.warningDuration && this.getDots().length === 0;
  }

  isActivelySpawning(): boolean {
    return this.elapsedMs <= this.duration + this.warningDuration;
  }

  clear(): void {
    if (this.spawnTimeoutId !== null) {
      window.clearTimeout(this.spawnTimeoutId);
      this.spawnTimeoutId = null;
    }
    this.hasStartedSpawning = false;
    super.clear();
  }
}
