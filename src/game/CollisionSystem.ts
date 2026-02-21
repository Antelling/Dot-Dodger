import { Bounds } from '../types';
import { Player } from '../entities/Player';
import { Dot } from '../entities/Dot';
import { WeaponOrb } from '../entities/WeaponOrb';
import { circleCollision } from '../utils/math';

const CELL_SIZE = 100;

// Pre-allocated array for nearby cell offsets - avoids allocation during collision checks
const NEARBY_OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [0, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1]
];

export class CollisionSystem {
  // Use numeric key instead of string to avoid allocations
  private grid: Map<number, Dot[]> = new Map();
  
  // Pre-allocated array for nearby keys - reused each frame
  private nearbyKeys: number[] = new Array(9);

  constructor(_bounds: Bounds) {
  }
  
  // Use numeric key: cellX * 10000 + cellY (assumes grid < 10000 cells wide)
  private getCellKey(x: number, y: number): number {
    const cellX = Math.floor(x / CELL_SIZE);
    const cellY = Math.floor(y / CELL_SIZE);
    return cellX * 10000 + cellY;
  }
  
  private getNearbyKeys(x: number, y: number): number[] {
    const cellX = Math.floor(x / CELL_SIZE);
    const cellY = Math.floor(y / CELL_SIZE);
    
    for (let i = 0; i < 9; i++) {
      const [dx, dy] = NEARBY_OFFSETS[i];
      this.nearbyKeys[i] = (cellX + dx) * 10000 + (cellY + dy);
    }
    return this.nearbyKeys;
  }
  
  rebuildGrid(dots: Dot[]): void {
    // Clear and reuse map instead of creating new one
    this.grid.clear();

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      if (!dot.isLethal() && !dot.isFrozen()) continue;

      const pos = dot.getPosition();
      const key = this.getCellKey(pos.x, pos.y);

      let cell = this.grid.get(key);
      if (!cell) {
        cell = [];
        this.grid.set(key, cell);
      }

      cell.push(dot);
    }
  }
  
  checkPlayerDotCollision(player: Player): Dot | null {
    const playerPos = player.getPosition();
    const playerRadius = player.hitboxRadius;
    
    const nearbyKeys = this.getNearbyKeys(playerPos.x, playerPos.y);
    
    for (let i = 0; i < 9; i++) {
      const cell = this.grid.get(nearbyKeys[i]);
      if (!cell) continue;
      
      for (let j = 0; j < cell.length; j++) {
        const dot = cell[j];
        const dotPos = dot.getPosition();
        const dotRadius = dot.getEffectiveRadius();

        if (circleCollision(playerPos, playerRadius, dotPos, dotRadius)) {
          return dot;
        }
      }
    }
    
    return null;
  }
  
  checkPlayerOrbCollision(player: Player, orbs: WeaponOrb[]): WeaponOrb | null {
    const playerPos = player.getPosition();
    const playerRadius = player.hitboxRadius;
    
    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i];
      if (!orb.isActive()) continue;
      
      const orbPos = orb.getPosition();
      const orbRadius = orb.radius;
      
      if (circleCollision(playerPos, playerRadius, orbPos, orbRadius)) {
        return orb;
      }
    }
    
    return null;
  }

  updateBounds(_bounds: Bounds): void {
  }
}
