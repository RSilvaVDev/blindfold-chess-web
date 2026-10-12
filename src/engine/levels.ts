import type { EngineLevel } from '../game-session/types';

export interface LevelSettings {
  // Stockfish "Skill Level", 0 (weakest) to 20 (full strength).
  skill: number;
  // The search stops at whichever limit it reaches first.
  depth: number;
  moveTimeMs: number;
}

export const LEVEL_SETTINGS: Record<EngineLevel, LevelSettings> = {
  easy: { skill: 0, depth: 1, moveTimeMs: 300 },
  medium: { skill: 6, depth: 6, moveTimeMs: 700 },
  hard: { skill: 15, depth: 12, moveTimeMs: 1200 },
};
