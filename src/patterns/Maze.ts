import { Pattern } from './Pattern';
import { PatternType, Difficulty, Bounds, Vector2 } from '../types';

interface MazeCell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

export class Maze extends Pattern {
  readonly type = PatternType.MAZE;
  difficulty: Difficulty = Difficulty.MEDIUM;

  private readonly cellSize: number = 40;
  private readonly duration: number = 25000;

  constructor(difficulty: Difficulty = Difficulty.MEDIUM) {
    super();
    this.difficulty = difficulty;
    switch (difficulty) {
      case Difficulty.HARD:
        this.cellSize = 35;
        break;
      case Difficulty.MEDIUM:
        this.cellSize = 40;
        break;
      default:
        this.cellSize = 50;
    }
  }

  spawn(_center: Vector2, bounds: Bounds): void {
    this.start();

    const isTop = Math.random() > 0.5;
    const mazeHeight = bounds.height / 3;
    const mazeY = isTop ? 0 : bounds.height - mazeHeight;

    const cols = Math.floor(bounds.width / this.cellSize);
    const rows = Math.floor(mazeHeight / this.cellSize);

    if (cols < 2 || rows < 2) return;

    const maze = this.generateMaze(cols, rows);

    const exitSide = Math.random() > 0.5 ? 'left' : 'right';
    const exitRow = Math.floor(Math.random() * Math.max(1, rows - 3));

    const wallPositions = this.extractWallPositions(
      maze,
      cols,
      rows,
      this.cellSize,
      mazeY,
      bounds.width,
      exitSide,
      exitRow
    );

    for (const pos of wallPositions) {
      this.spawnDot(pos.x, pos.y, { x: 0, y: 0 });
    }
  }

  private generateMaze(cols: number, rows: number): MazeCell[][] {
    const maze: MazeCell[][] = [];

    for (let y = 0; y < rows; y++) {
      maze[y] = [];
      for (let x = 0; x < cols; x++) {
        maze[y][x] = {
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false
        };
      }
    }

    // Randomized DFS to generate perfect maze
    const stack: MazeCell[] = [];
    const startCell = maze[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(maze, current, cols, rows);

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.removeWall(current, next);
        next.visited = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    return maze;
  }

  private getUnvisitedNeighbors(
    maze: MazeCell[][],
    cell: MazeCell,
    cols: number,
    rows: number
  ): MazeCell[] {
    const neighbors: MazeCell[] = [];
    const { x, y } = cell;

    if (y > 0 && !maze[y - 1][x].visited) neighbors.push(maze[y - 1][x]);
    if (y < rows - 1 && !maze[y + 1][x].visited) neighbors.push(maze[y + 1][x]);
    if (x > 0 && !maze[y][x - 1].visited) neighbors.push(maze[y][x - 1]);
    if (x < cols - 1 && !maze[y][x + 1].visited) neighbors.push(maze[y][x + 1]);

    return neighbors;
  }

  private removeWall(current: MazeCell, next: MazeCell): void {
    const dx = next.x - current.x;
    const dy = next.y - current.y;

    if (dx === 1) {
      current.walls.right = false;
      next.walls.left = false;
    } else if (dx === -1) {
      current.walls.left = false;
      next.walls.right = false;
    } else if (dy === 1) {
      current.walls.bottom = false;
      next.walls.top = false;
    } else if (dy === -1) {
      current.walls.top = false;
      next.walls.bottom = false;
    }
  }

  private extractWallPositions(
    maze: MazeCell[][],
    cols: number,
    rows: number,
    cellSize: number,
    offsetY: number,
    screenWidth: number,
    exitSide: 'left' | 'right',
    exitRow: number
  ): Vector2[] {
    const positions: Vector2[] = [];
    const offsetX = (screenWidth - cols * cellSize) / 2;
    const dotSpacing = 16; // Decreased density

    // Extract wall positions from maze cells (no outer border)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = maze[y][x];
        const cellX = offsetX + x * cellSize;
        const cellY = offsetY + y * cellSize;

        // Top wall (skip for top row to avoid outer border)
        if (cell.walls.top && y > 0) {
          const numDots = Math.floor(cellSize / dotSpacing);
          for (let i = 0; i < numDots; i++) {
            positions.push({
              x: cellX + i * dotSpacing + dotSpacing / 2,
              y: cellY
            });
          }
        }

        // Left wall (skip for leftmost column to avoid outer border)
        if (cell.walls.left && x > 0) {
          const numDots = Math.floor(cellSize / dotSpacing);
          for (let i = 0; i < numDots; i++) {
            positions.push({
              x: cellX,
              y: cellY + i * dotSpacing + dotSpacing / 2
            });
          }
        }
      }
    }

    // Create exit gap (8x cell height)
    const exitCellY = offsetY + exitRow * cellSize;

    if (exitSide === 'left') {
      // Remove dots from left edge at exit row
      const toRemove: number[] = [];
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        if (Math.abs(pos.x - offsetX) < 15 && 
            pos.y >= exitCellY && 
            pos.y <= exitCellY + cellSize * 8) {
          toRemove.push(i);
        }
      }
      for (let i = toRemove.length - 1; i >= 0; i--) {
        positions.splice(toRemove[i], 1);
      }
    } else {
      // Remove dots from right edge at exit row
      const rightEdgeX = offsetX + cols * cellSize;
      const toRemove: number[] = [];
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        if (Math.abs(pos.x - rightEdgeX) < 15 && 
            pos.y >= exitCellY && 
            pos.y <= exitCellY + cellSize * 8) {
          toRemove.push(i);
        }
      }
      for (let i = toRemove.length - 1; i >= 0; i--) {
        positions.splice(toRemove[i], 1);
      }
    }

    return positions;
  }

  update(dt: number, _playerPosition: Vector2, bounds: Bounds): void {
    // Update all dots
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      dot.update(dt, bounds, _playerPosition);

      // Remove dots that go off screen
      if (dot.position.y < -100 || dot.position.y > bounds.height + 100 ||
          dot.position.x < -100 || dot.position.x > bounds.width + 100) {
        dot.kill();
      }
    }

    // Clean up dead dots
    for (let i = this.dots.length - 1; i >= 0; i--) {
      if (this.dots[i].isDead()) {
        this.dots.splice(i, 1);
      }
    }
  }

  isComplete(): boolean {
    return this.elapsedMs > this.duration && this.dots.length === 0;
  }
}
