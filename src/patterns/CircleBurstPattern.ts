import { BulletHellBase } from './BulletHellBase';
import { PatternType, Difficulty } from '../types';

export class CircleBurstPattern extends BulletHellBase {
  readonly type = PatternType.CIRCLE_BURST;
  readonly difficulty: Difficulty = Difficulty.HARD;

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

  protected spawnPatternBullets(): void {
    const bulletCount = 16;
    const angleStep = (Math.PI * 2) / bulletCount;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = i * angleStep + this.patternPhase * 0.5;
      this.createBullet(angle);
    }
  }
}
