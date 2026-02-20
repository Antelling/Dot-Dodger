import { PatternType } from '../types';
import type { Pattern } from './Pattern';

type PatternConstructor = new () => Pattern;

class PatternRegistryImpl {
  private patterns: Map<PatternType, PatternConstructor> = new Map();

  register(type: PatternType, patternClass: PatternConstructor): void {
    this.patterns.set(type, patternClass);
  }

  create(type: PatternType): Pattern | null {
    const PatternClass = this.patterns.get(type);
    if (!PatternClass) return null;
    return new PatternClass();
  }

  getAvailableTypes(): PatternType[] {
    return Array.from(this.patterns.keys());
  }
}

export const PatternRegistry = new PatternRegistryImpl();
