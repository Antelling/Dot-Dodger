import { Pattern } from '../patterns/Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';
import { PatternRegistry } from '../patterns/PatternRegistry';
import { Dot } from '../entities/Dot';
import { toastManager } from './ToastManager';

const PATTERN_DIFFICULTY_MAP: Map<PatternType, Difficulty> = new Map([
  [PatternType.ZOMBIE_SNOW, Difficulty.EASY],
  [PatternType.SPARSE_GRID, Difficulty.EASY],
  [PatternType.CONTAINMENT_RING, Difficulty.EASY],
  [PatternType.SWEEPER_LINE, Difficulty.MEDIUM],
  [PatternType.GATLING_POINT, Difficulty.MEDIUM],
  [PatternType.BOUNCING_BALL, Difficulty.MEDIUM],
  [PatternType.BULLET_HELL, Difficulty.HARD],
  [PatternType.CYCLONE, Difficulty.HARD],
]);

const SCORE_THRESHOLDS = {
  EASY_MAX: 500,
  MEDIUM_MAX: 1500,
};

export class PatternManager {
  private activePatterns: Pattern[] = [];
  private patternTimer: number = 0;
  private nextPatternInterval: number = 3000;
  private currentScore: number = 0;
  private allDotsCache: Dot[] = [];

  private readonly minInterval: number = 2000;
  private readonly maxInterval: number = 4000;

  constructor() {
    this.nextPatternInterval = this.getRandomInterval();
  }

  update(dt: number, playerPosition: Vector2, bounds: Bounds): void {
    this.patternTimer += dt * 1000;
    if (this.patternTimer >= this.nextPatternInterval) {
      this.patternTimer = 0;
      this.nextPatternInterval = this.getRandomInterval();
      const nextType = this.selectNextPattern();
      if (nextType) {
        this.spawnPattern(nextType, playerPosition, bounds);
      }
    }

    for (let i = 0; i < this.activePatterns.length; i++) {
      const pattern = this.activePatterns[i];
      pattern.tick(dt);
      pattern.update(dt, playerPosition, bounds);
    }

    this.removeCompletedPatterns();
    this.rebuildDotsCache();
  }

  addPattern(pattern: Pattern): void {
    if (this.isPatternTypeActive(pattern.type)) {
      return;
    }
    this.activePatterns.push(pattern);
  }

  removePattern(pattern: Pattern): void {
    const index = this.activePatterns.indexOf(pattern);
    if (index !== -1) {
      pattern.clear();
      this.activePatterns.splice(index, 1);
    }
  }

  getActivePatterns(): Pattern[] {
    return this.activePatterns;
  }

  getAllDots(): Dot[] {
    return this.allDotsCache;
  }

  private rebuildDotsCache(): void {
    this.allDotsCache.length = 0;
    for (let i = 0; i < this.activePatterns.length; i++) {
      const dots = this.activePatterns[i].getDots();
      for (let j = 0; j < dots.length; j++) {
        this.allDotsCache.push(dots[j]);
      }
    }
  }

  setScore(score: number): void {
    this.currentScore = score;
  }

  getAvailablePatternTypes(): PatternType[] {
    const availableTypes: PatternType[] = [];
    const allTypes = PatternRegistry.getAvailableTypes();

    for (const type of allTypes) {
      const difficulty = PATTERN_DIFFICULTY_MAP.get(type);
      if (!difficulty) continue;

      if (this.isDifficultyAvailable(difficulty)) {
        availableTypes.push(type);
      }
    }

    return availableTypes;
  }

  selectNextPattern(): PatternType | null {
    const availableTypes = this.getAvailablePatternTypes();
    
    const candidateTypes = availableTypes.filter(
      type => !this.isPatternTypeActive(type)
    );

    if (candidateTypes.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * candidateTypes.length);
    return candidateTypes[randomIndex];
  }

  spawnPattern(type: PatternType, playerPosition: Vector2, bounds: Bounds): void {
    if (this.isPatternTypeActive(type)) {
      return;
    }

    const pattern = PatternRegistry.create(type);
    if (!pattern) {
      console.warn(`Failed to create pattern of type: ${type}`);
      return;
    }

    toastManager.show(`Pattern: ${this.formatPatternName(type)}`, 'info');
    pattern.spawn(playerPosition, bounds);
    pattern.start();
    this.activePatterns.push(pattern);
  }

  private isPatternTypeActive(type: PatternType): boolean {
    for (let i = 0; i < this.activePatterns.length; i++) {
      if (this.activePatterns[i].type === type) return true;
    }
    return false;
  }

  private isDifficultyAvailable(difficulty: Difficulty): boolean {
    switch (difficulty) {
      case Difficulty.EASY:
        return this.currentScore < SCORE_THRESHOLDS.EASY_MAX;
      case Difficulty.MEDIUM:
        return this.currentScore >= SCORE_THRESHOLDS.EASY_MAX && 
               this.currentScore < SCORE_THRESHOLDS.MEDIUM_MAX;
      case Difficulty.HARD:
        return this.currentScore >= SCORE_THRESHOLDS.MEDIUM_MAX;
      default:
        return false;
    }
  }

  private removeCompletedPatterns(): void {
    for (let i = this.activePatterns.length - 1; i >= 0; i--) {
      if (this.activePatterns[i].isComplete()) {
        const completedPattern = this.activePatterns[i];
        completedPattern.clear();
        this.activePatterns.splice(i, 1);
        toastManager.show(`Pattern ended: ${this.formatPatternName(completedPattern.type)}`, 'info');
      }
    }
  }

  clear(): void {
    for (let i = 0; i < this.activePatterns.length; i++) {
      this.activePatterns[i].clear();
    }
    this.activePatterns = [];
    this.patternTimer = 0;
    this.allDotsCache.length = 0;
  }

  getPatternTimer(): number {
    return this.patternTimer;
  }

  getPatternInterval(): number {
    return this.nextPatternInterval;
  }

  private getRandomInterval(): number {
    return this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
  }

  private formatPatternName(type: PatternType): string {
    return type
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
