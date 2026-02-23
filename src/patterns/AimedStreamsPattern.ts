import { BulletHellBase } from './BulletHellBase';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';

export class AimedStreamsPattern extends BulletHellBase {
  readonly type = PatternType.AIMED_STREAMS;
  readonly difficulty: Difficulty = Difficulty.HARD;
  private playerPosition: Vector2 = { x: 0, y: 0 };

  constructor(difficulty: Difficulty = Difficulty.HARD) {
    super();
    switch (difficulty) {
      case Difficulty.HARD:
        this.duration = 4000;
        break;
      case Difficulty.MEDIUM:
        this.duration = 3000;
        break;
    }
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    this.playerPosition = playerPosition;
    super.update(dt, playerPosition, bounds);
  }

  protected spawnPatternBullets(): void {
    const streamCount = 5;
    const baseAngle = Math.atan2(
      this.playerPosition.y - this.originY,
      this.playerPosition.x - this.originX
    );
    
    for (let i = 0; i < streamCount; i++) {
      const spread = (i - Math.floor(streamCount / 2)) * 0.15;
      const angle = baseAngle + spread;
      const speedMult = 0.9 + Math.random() * 0.2;
      this.createBullet(angle, speedMult);
    }
  }
}
