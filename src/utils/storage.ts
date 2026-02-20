import { HighscoreEntry } from '../types';

const STORAGE_KEY = 'tilt-to-live-highscores';
const MAX_HIGHSCORES = 10;

/**
 * Get all highscores from localStorage
 * Returns empty array if none exist
 */
export function getHighscores(): HighscoreEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const scores = JSON.parse(data) as HighscoreEntry[];
    // Ensure sorted descending by score
    return scores.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Failed to load highscores:', error);
    return [];
  }
}

/**
 * Add a new highscore
 * Maintains top 10, sorted descending
 * Returns the rank (1-based) or -1 if not in top 10
 */
export function addHighscore(score: number): number {
  const highscores = getHighscores();

  const newEntry: HighscoreEntry = {
    score,
    timestamp: Date.now()
  };

  // Add new score
  highscores.push(newEntry);

  // Sort descending by score
  highscores.sort((a, b) => b.score - a.score);

  // Keep only top 10
  const trimmed = highscores.slice(0, MAX_HIGHSCORES);

  // Find rank of new score
  const rank = trimmed.findIndex(e => e.timestamp === newEntry.timestamp && e.score === score) + 1;

  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save highscores:', error);
  }

  return rank > 0 ? rank : -1;
}

/**
 * Check if a score would make the top 10
 */
export function isHighscore(score: number): boolean {
  const highscores = getHighscores();

  // If we have less than 10, any score qualifies
  if (highscores.length < MAX_HIGHSCORES) return true;

  // Check if score beats the lowest
  return score > highscores[highscores.length - 1].score;
}

/**
 * Clear all highscores
 * Use for testing/reset
 */
export function clearHighscores(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear highscores:', error);
  }
}

/**
 * Format highscore list for display
 * Returns array of formatted strings
 */
export function formatHighscores(entries: HighscoreEntry[]): string[] {
  return entries.map((entry) => {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleDateString();
    return `${entry.score} pts - ${dateStr}`;
  });
}

/**
 * Get the highest score (for display purposes)
 */
export function getTopScore(): number {
  const scores = getHighscores();
  return scores.length > 0 ? scores[0].score : 0;
}
