import { GameState, Bounds } from '../types';
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
import { getHighscores } from '../utils/storage';
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
  
  private menuElement: HTMLElement;
  private gameOverElement: HTMLElement;
  private permissionElement: HTMLElement;
  private newGameBtn: HTMLElement;
  private playAgainBtn: HTMLElement;
  private enableMotionBtn: HTMLElement;
  private finalScoreElement: HTMLElement;
  
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
    
    this.setupEventListeners();
    this.checkPlatform();
    this.gameLoop(0);
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

    const highscoreList = document.getElementById('gameover-highscores');
    if (highscoreList) {
      const highscores = getHighscores();
      highscoreList.innerHTML = highscores
        .slice(0, 10)
        .map((h, i) => `<li>${i + 1}. ${h.score}</li>`)
        .join('');
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

    this.orbSpawner.update(this.bounds, this.player.getPosition());

    const allDots = this.patternManager.getAllDots();
    this.collisionSystem.rebuildGrid(allDots);

    const orbs = this.orbSpawner.getOrbs();
    const collidingOrb = this.collisionSystem.checkPlayerOrbCollision(this.player, orbs);
    if (collidingOrb) {
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

    for (let i = this.activeWeapons.length - 1; i >= 0; i--) {
      const weapon = this.activeWeapons[i];
      weapon.update(dt, this.player, allDots, this.bounds);
      
      if (weapon instanceof NuclearBomb && weapon.hasKilledPlayer()) {
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
