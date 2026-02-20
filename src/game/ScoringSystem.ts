export class ScoringSystem {
  private score: number = 0;
  private kills: number = 0;
  private startTime: number = 0;

  start(): void {
    this.score = 0;
    this.kills = 0;
    this.startTime = Date.now();
  }

  addKill(): void {
    this.kills++;
  }

  addKills(count: number): void {
    this.kills += count;
  }

  addPatternBonus(difficulty: string): void {
    const bonuses = { EASY: 50, MEDIUM: 100, HARD: 200 };
    this.score += bonuses[difficulty as keyof typeof bonuses] || 50;
  }

  getScore(): number {
    const timeBonus = Math.floor((Date.now() - this.startTime) / 10000);
    return this.score + this.kills * 10 + timeBonus;
  }

  getKills(): number {
    return this.kills;
  }

  getTimeAlive(): number {
    return Date.now() - this.startTime;
  }
}
