import { BulletHellBase } from './BulletHellBase';
import { PatternType, Difficulty } from '../types';

export class WavePattern extends BulletHellBase {
  readonly type = PatternType.WAVE;
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
    const waveWidth = Math.PI;
    const bulletsInWave = 7;
    const baseAngle = Math.PI / 2 + Math.sin(this.patternPhase * 2) * 0.3;
    
    for (let i = 0; i < bulletsInWave; i++) {
      const waveOffset = (i / (bulletsInWave - 1) - 0.5) * waveWidth;
      const angle = baseAngle + waveOffset;
      const speedMult = 0.7 + Math.abs(waveOffset) * 0.3;
      this.createBullet(angle, speedMult);
    }
  }
}
