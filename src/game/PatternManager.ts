import { Pattern } from '../patterns/Pattern';
import { PatternType, Bounds, Vector2 } from '../types';
import { PatternRegistry } from '../patterns/PatternRegistry';
import { Dot } from '../entities/Dot';
import type { GameEventLogger } from './GameEventLogger';
// Score-based interval scaling
// Base interval (ms) at score 0
const BASE_INTERVAL = 4000;
// Minimum interval (ms) at high scores
const MIN_INTERVAL = 1500;
// Score at which minimum interval is reached
const MAX_SCORE_SCALING = 5000;

export class PatternManager {
  private activePatterns: Pattern[] = [];
  private patternTimer: number = 0;
  private nextPatternInterval: number = 3000;
  private currentScore: number = 0;
  private allDotsCache: Dot[] = [];
  private eventLogger: GameEventLogger | null = null;
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

  setEventLogger(logger: GameEventLogger): void {
    this.eventLogger = logger;
  }
  isAnyPatternActivelySpawning(): boolean {
    for (let i = 0; i < this.activePatterns.length; i++) {
      if (this.activePatterns[i].isActivelySpawning()) {
        return true;
      }
    }
    return false;
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

  selectNextPattern(): PatternType | null {
    const allTypes = PatternRegistry.getAvailableTypes();
    
    const candidateTypes = allTypes.filter(
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

    pattern.spawn(playerPosition, bounds);
    pattern.start();
    this.activePatterns.push(pattern);
    if (this.eventLogger) {
      this.eventLogger.logPatternSpawnStart(type);
    }
  }

  private isPatternTypeActive(type: PatternType): boolean {
    for (let i = 0; i < this.activePatterns.length; i++) {
      if (this.activePatterns[i].type === type) return true;
    }
    return false;
  }

  private removeCompletedPatterns(): void {
    for (let i = this.activePatterns.length - 1; i >= 0; i--) {
      if (this.activePatterns[i].isComplete()) {
        const completedPattern = this.activePatterns[i];
        if (this.eventLogger) {
          this.eventLogger.logPatternSpawnComplete(completedPattern.type, completedPattern.getDots().length);
        }
        completedPattern.clear();
        this.activePatterns.splice(i, 1);

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
    // Scale interval based on score - higher score = shorter interval
    const scoreRatio = Math.min(this.currentScore / MAX_SCORE_SCALING, 1);
    const interval = BASE_INTERVAL - scoreRatio * (BASE_INTERVAL - MIN_INTERVAL);
    // Add small random variance (+/- 500ms)
    return interval + (Math.random() - 0.5) * 1000;
  }

}
