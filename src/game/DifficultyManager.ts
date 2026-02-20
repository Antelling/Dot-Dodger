import { Difficulty } from '../types';

export class DifficultyManager {
  private currentDifficulty: Difficulty = Difficulty.EASY;
  private readonly mediumThreshold: number = 500;
  private readonly hardThreshold: number = 1500;

  update(score: number): void {
    if (score >= this.hardThreshold) {
      this.currentDifficulty = Difficulty.HARD;
    } else if (score >= this.mediumThreshold) {
      this.currentDifficulty = Difficulty.MEDIUM;
    } else {
      this.currentDifficulty = Difficulty.EASY;
    }
  }

  getDifficulty(): Difficulty {
    return this.currentDifficulty;
  }

  getSpawnRateMultiplier(): number {
    const multipliers = {
      [Difficulty.EASY]: 1.0,
      [Difficulty.MEDIUM]: 1.5,
      [Difficulty.HARD]: 2.0
    };
    return multipliers[this.currentDifficulty];
  }

  getMaxDots(): number {
    const maxDots = {
      [Difficulty.EASY]: 150,
      [Difficulty.MEDIUM]: 225,
      [Difficulty.HARD]: 300
    };
    return maxDots[this.currentDifficulty];
  }
}
