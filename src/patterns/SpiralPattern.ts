import { BulletHellBase } from './BulletHellBase';
import { PatternType, Difficulty } from '../types';

export class SpiralPattern extends BulletHellBase {
  readonly type = PatternType.SPIRAL;
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
    const arms = 3;
    const bulletsPerArm = 2;
    const spiralSpeed = 2.0;
    
    for (let arm = 0; arm < arms; arm++) {
      const baseAngle = this.patternPhase * spiralSpeed + (arm * Math.PI * 2 / arms);
      
      for (let i = 0; i < bulletsPerArm; i++) {
        const angle = baseAngle + i * 0.1;
        const speedMult = 0.8 + i * 0.1;
        this.createBullet(angle, speedMult);
      }
    }
  }
}
