import { Vector2 } from '../types';
import { PLAYER_MAX_SPEED } from '../utils/constants';

export type PermissionState = 'unknown' | 'pending' | 'granted' | 'denied';

export class InputManager {
  private velocity: Vector2 = { x: 0, y: 0 };
  private permissionState: PermissionState = 'unknown';
  private betaBasis: number | null = null;

  constructor() {
    this.checkPermissionAvailability();
  }

  setBetaBasis(basis: number): void {
    this.betaBasis = basis;
  }

  getCurrentBeta(): number | null {
    return this.betaBasis;
  }

  private checkPermissionAvailability(): void {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      this.permissionState = 'pending';
    } else if (window.DeviceOrientationEvent) {
      this.permissionState = 'granted';
      this.enableDeviceOrientation();
    } else {
      this.permissionState = 'denied';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (this.permissionState === 'granted') {
      return true;
    }

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionPromise = (DeviceOrientationEvent as any).requestPermission() as Promise<'granted' | 'denied' | 'prompt'>;
        const permission = await permissionPromise;

        if (permission === 'granted') {
          this.permissionState = 'granted';
          this.enableDeviceOrientation();
          return true;
        } else {
          this.permissionState = 'denied';
          return false;
        }
      } catch (error) {
        console.error('Device orientation permission error:', error);
        this.permissionState = 'denied';
        return false;
      }
    }

    return (this.permissionState as PermissionState) === 'granted';
  }

  private enableDeviceOrientation(): void {
    window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
  }

  private lastBeta: number = 45;

  calibrateTiltBasis(): void {
    this.betaBasis = this.lastBeta;
  }

  private handleOrientation(event: DeviceOrientationEvent): void {
    if (event.gamma === null || event.beta === null) {
      return;
    }
    
    const gamma = event.gamma;
    const beta = event.beta;
    this.lastBeta = beta;
    
    const normalizedX = this.clamp(gamma / 22.5, -1, 1);
    const betaReference = this.betaBasis !== null ? this.betaBasis : beta;
    const normalizedY = this.clamp((beta - betaReference) / 22.5, -1, 1);
    
    this.velocity.x = normalizedX * PLAYER_MAX_SPEED;
    this.velocity.y = normalizedY * PLAYER_MAX_SPEED;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  getVelocity(): Vector2 {
    return { x: this.velocity.x, y: this.velocity.y };
  }

  getPermissionState(): PermissionState {
    return this.permissionState;
  }

  needsPermissionRequest(): boolean {
    return this.permissionState === 'pending';
  }

  destroy(): void {
    window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
  }
}
