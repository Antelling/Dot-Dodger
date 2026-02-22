import { GameState, Bounds, type DeathEvent } from '../types';
import { Renderer } from '../renderer/Renderer';
import { InputManager } from './InputManager';
import { Player } from '../entities/Player';
import { ScoringSystem } from './ScoringSystem';
import { CollisionSystem } from './CollisionSystem';
import { DifficultyManager } from './DifficultyManager';
import { PatternManager } from './PatternManager';
import { WeaponOrbSpawner } from './WeaponOrbSpawner';
import { WeaponRegistry } from '../weapons/WeaponRegistry';
import type { Weapon } from '../weapons/Weapon';
import { NuclearBomb } from '../weapons/NuclearBomb';
import { COLOR_BACKGROUND, FRAME_TIME } from '../utils/constants';
import { getHighscores, addHighscore } from '../utils/storage';
import { toastManager } from './ToastManager';

export class Game {
  private renderer: Renderer;
  private input: InputManager;
  private state: GameState = GameState.MENU;
  private lastFrameTime: number = 0;
  private isPaused: boolean = false;
  private accumulator: number = 0;

  private player: Player | null = null;

  private bounds: Bounds;
  private timeAlive: number = 0;

  private scoringSystem: ScoringSystem = new ScoringSystem();
  private collisionSystem: CollisionSystem;
  private difficultyManager: DifficultyManager = new DifficultyManager();
  private patternManager: PatternManager = new PatternManager();
  private orbSpawner: WeaponOrbSpawner = new WeaponOrbSpawner();
  private activeWeapons: Weapon[] = [];
  private lastDeathEvent: DeathEvent | null = null;
  
  private menuElement: HTMLElement;
  private gameOverElement: HTMLElement;
  private permissionElement: HTMLElement;
  private newGameBtn: HTMLElement;
  private playAgainBtn: HTMLElement;
  private enableMotionBtn: HTMLElement;
  private finalScoreElement: HTMLElement;
  private newHighscoreElement: HTMLElement;
  
  constructor() {
    this.renderer = new Renderer('game');
    this.input = new InputManager();
    this.bounds = this.renderer.getBounds();
    this.collisionSystem = new CollisionSystem(this.bounds);
    
    this.menuElement = document.getElementById('menu')!;
    this.gameOverElement = document.getElementById('game-over')!;
    this.permissionElement = document.getElementById('permission-prompt')!;
    this.newGameBtn = document.getElementById('new-game-btn')!;
    this.playAgainBtn = document.getElementById('play-again-btn')!;
    this.enableMotionBtn = document.getElementById('enable-motion-btn')!;
    this.finalScoreElement = document.getElementById('final-score')!;
    this.newHighscoreElement = document.getElementById('new-highscore')!;
    
    this.setupEventListeners();
    this.checkPlatform();
    this.gameLoop(0);
    this.displayMenuHighscores();
  }
  
  private checkPlatform(): void {
    const isDesktop = !('ontouchstart' in window) && 
                      !('DeviceOrientationEvent' in window);
    if (isDesktop) {
      this.showElement('desktop-warning', true);
      return;
    }
    this.checkOrientation();
    window.addEventListener('orientationchange', () => this.checkOrientation());
    window.addEventListener('resize', () => this.checkOrientation());
  }
  
  private checkOrientation(): void {
    const isLandscape = window.innerWidth > window.innerHeight;
    this.showElement('landscape-warning', isLandscape && this.state === GameState.PLAYING);
  }
  
  private showElement(id: string, show: boolean): void {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  private displayMenuHighscores(): void {
    const menuHighscoreList = document.getElementById('menu-highscores');
    if (menuHighscoreList) {
      const highscores = getHighscores();
      if (highscores.length === 0) {
        menuHighscoreList.innerHTML = '<li style="color: #666;">No scores yet</li>';
      } else {
        menuHighscoreList.innerHTML = highscores
          .slice(0, 10)
          .map((h, i) => `<li>${i + 1}. ${h.score}</li>`)
          .join('');
      }
    }
  }
  
  private setupEventListeners(): void {
    this.newGameBtn.addEventListener('click', () => this.handleNewGameClick());
    this.playAgainBtn.addEventListener('click', () => this.handleNewGameClick());
    this.enableMotionBtn.addEventListener('click', () => this.requestMotionPermission());
    
    window.addEventListener('resize', () => {
      this.bounds = this.renderer.getBounds();
    });
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === GameState.PLAYING) {
        this.pause();
      } else if (!document.hidden && this.state === GameState.PAUSED) {
        this.resume();
      }
    });
  }
  
  private async handleNewGameClick(): Promise<void> {
    if (this.input.needsPermissionRequest()) {
      this.menuElement.classList.add('hidden');
      this.permissionElement.style.display = 'flex';
      return;
    }
    
    this.startGame();
  }
  
  private async requestMotionPermission(): Promise<void> {
    const granted = await this.input.requestPermission();
    
    if (granted) {
      this.permissionElement.style.display = 'none';
      this.startGame();
    } else {
      alert('Motion permission denied. The game requires device motion to play.');
    }
  }
  
  startGame(): void {
    this.state = GameState.PLAYING;
    this.timeAlive = 0;
    this.lastDeathEvent = null;

    this.scoringSystem.start();

    this.collisionSystem.updateBounds(this.bounds);

    const centerX = this.bounds.width / 2;
    const centerY = this.bounds.height / 2;
    this.player = new Player(centerX, centerY);

    this.patternManager.clear();
    this.orbSpawner.initialize(this.bounds, this.player.getPosition());
    this.activeWeapons = [];

    this.input.calibrateTiltBasis();

    this.menuElement.classList.add('hidden');
    this.gameOverElement.classList.add('hidden');
    
    toastManager.clear();
  }
  
  private handleGameOver(): void {
    const finalScore = this.scoringSystem.getScore();
    this.state = GameState.GAME_OVER;

    this.finalScoreElement.textContent = `Score: ${finalScore}`;

    // Save highscore and check if it's a new high score
    const rank = addHighscore(finalScore);
    const isNewHighscore = rank > 0 && rank <= 3;
    
    // Show "New High Score!" message if applicable
    if (isNewHighscore) {
      this.newHighscoreElement.textContent = rank === 1 ? 'New #1 High Score!' : `New #${rank} High Score!`;
      this.newHighscoreElement.style.display = 'block';
    } else {
      this.newHighscoreElement.style.display = 'none';
    }

    // Display highscores on death screen
    const highscoreList = document.getElementById('gameover-highscores');
    if (highscoreList) {
      const highscores = getHighscores();
      highscoreList.innerHTML = highscores
        .slice(0, 10)
        .map((h, i) => {
          const isCurrentScore = rank > 0 && i + 1 === rank;
          const style = isCurrentScore ? ' style="color: #FFD700; font-weight: bold;"' : '';
          return `<li${style}>${i + 1}. ${h.score}</li>`;
        })
        .join('');
    }

    const deathReasonElement = document.getElementById('death-reason');
    if (deathReasonElement) {
      deathReasonElement.textContent = this.lastDeathEvent?.message ?? 'Unknown';
    }

    const recentToastsList = document.getElementById('recent-toasts');
    if (recentToastsList) {
      const allMessages = toastManager.getAllMessages();
      recentToastsList.innerHTML = allMessages.length > 0
        ? allMessages.map(msg => `<li class="toast-${msg.type}">${msg.text}</li>`).join('')
        : '<li class="toast-info">No recent events</li>';
    }

    this.gameOverElement.classList.remove('hidden');
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.lastFrameTime = performance.now();
  }

  private gameLoop = (currentTime: number): void => {
    if (this.state !== GameState.PLAYING || this.isPaused) {
      requestAnimationFrame(this.gameLoop);
      return;
    }
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.accumulator += deltaTime;

    while (this.accumulator >= FRAME_TIME) {
      this.update(FRAME_TIME / 1000);
      this.accumulator -= FRAME_TIME;
    }

    this.render();
    requestAnimationFrame(this.gameLoop);
  };
  
  private update(dt: number): void {
    if (!this.player) return;

    this.timeAlive += dt;

    const velocity = this.input.getVelocity();
    this.player.update(dt, velocity, this.bounds);

    const score = this.scoringSystem.getScore();
    this.difficultyManager.update(score);
    this.patternManager.setScore(score);

    this.patternManager.update(dt, this.player.getPosition(), this.bounds);

    // If no dots and no pattern is actively spawning, throw in a new pattern
    const allDots = this.patternManager.getAllDots();
    if (allDots.length === 0 && !this.patternManager.isAnyPatternActivelySpawning()) {
      const nextType = this.patternManager.selectNextPattern();
      if (nextType) {
        this.patternManager.spawnPattern(nextType, this.player.getPosition(), this.bounds);
      }
    }

    this.orbSpawner.update(this.bounds, this.player.getPosition());

    this.collisionSystem.rebuildGrid(allDots);

    const orbs = this.orbSpawner.getOrbs();

    // Update bounced weapon orb positions
    for (const orb of orbs) {
      orb.updatePosition(dt, this.bounds);
    }

    const collidingOrb = this.collisionSystem.checkPlayerOrbCollision(this.player, orbs);
    if (collidingOrb) {
      // Try to bounce bounced weapons first
      const playerVelocity = this.input.getVelocity();
      const bounced = collidingOrb.bounce(playerVelocity, this.player.getPosition());

      if (!bounced) {
        // Not a bounced weapon or bounce failed - pick it up
        const weaponType = collidingOrb.getWeaponType();
        const weapon = WeaponRegistry.create(weaponType);
        if (weapon) {
          weapon.activate(this.player, allDots);
          this.activeWeapons.push(weapon);
          collidingOrb.pickup();
          this.orbSpawner.removeOrb(collidingOrb);
          toastManager.show(`Picked up ${this.formatWeaponName(weaponType)}`, 'success');
        }
      }
    }

    for (let i = this.activeWeapons.length - 1; i >= 0; i--) {
      const weapon = this.activeWeapons[i];
      weapon.update(dt, this.player, allDots, this.bounds);
      
      // Check for player collision with active weapon (for bounceable weapons like Electric/Nuclear bomb)
      if (weapon.isActive()) {
        const playerPos = this.player.getPosition();
        const weaponPos = weapon.getPosition();
        const weaponRadius = weapon.getRadius();
        const playerRadius = this.player.hitboxRadius;
        
        const dx = weaponPos.x - playerPos.x;
        const dy = weaponPos.y - playerPos.y;
        const distSq = dx * dx + dy * dy;
        const radiiSum = weaponRadius + playerRadius;
        
        if (distSq < radiiSum * radiiSum) {
          const playerVelocity = this.input.getVelocity();
          weapon.handlePlayerCollision(this.player, playerVelocity);
        }
      }
      
      if (weapon instanceof NuclearBomb && weapon.hasKilledPlayer()) {
        this.lastDeathEvent = {
          message: 'Killed by Nuclear Bomb explosion',
          type: 'nuclear_bomb',
          timestamp: Date.now()
        };
        this.handleGameOver();
        return;
      }
      
      if (weapon.isComplete()) {
        this.scoringSystem.addKills(weapon.getKilledDots());
        this.activeWeapons.splice(i, 1);
      }
    }

    const collidingDot = this.collisionSystem.checkPlayerDotCollision(this.player);
    if (collidingDot) {
      if (collidingDot.isLethal()) {
        this.lastDeathEvent = {
          message: 'Hit by a red dot',
          type: 'dot',
          timestamp: Date.now()
        };
        this.handleGameOver();
      } else if (collidingDot.isFrozen()) {
        collidingDot.kill();
        this.scoringSystem.addKills(1);
      }
    }
  }
  
  private render(): void {
    this.renderer.clear(COLOR_BACKGROUND);

    const orbs = this.orbSpawner.getOrbs();
    for (let i = 0; i < orbs.length; i++) {
      orbs[i].render(this.renderer);
    }

    const allDots = this.patternManager.getAllDots();
    for (let i = 0; i < allDots.length; i++) {
      allDots[i].render(this.renderer);
    }

    for (let i = 0; i < this.activeWeapons.length; i++) {
      this.activeWeapons[i].render(this.renderer);
    }

    if (this.player) {
      this.player.render(this.renderer);
    }

    this.renderer.flushBatches();
    this.renderer.endFrame();
  }
  
  getState(): GameState {
    return this.state;
  }
  
  getScore(): number {
    return this.scoringSystem.getScore();
  }

  private formatWeaponName(type: string): string {
    return type
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
