import { Vector2 } from '../types';
import { PLAYER_MAX_SPEED } from '../utils/constants';

export type PermissionState = 'unknown' | 'pending' | 'granted' | 'denied';

interface TiltBasis {
  gamma: number;
  beta: number;
}

export class InputManager {
  private velocity: Vector2 = { x: 0, y: 0 };
  private permissionState: PermissionState = 'unknown';
  private tiltBasis: TiltBasis | null = null;

  constructor() {
    this.checkPermissionAvailability();
    this.trackScreenOrientation();
  }

  private trackScreenOrientation(): void {
    window.addEventListener('orientationchange', () => {});
  }

  setTiltBasis(basis: TiltBasis): void {
    this.tiltBasis = basis;
  }

  getCurrentTiltBasis(): TiltBasis | null {
    return this.tiltBasis;
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

  private lastTilt: TiltBasis = { gamma: 0, beta: 45 };

  calibrateTiltBasis(): void {
    this.tiltBasis = { ...this.lastTilt };
  }

  private getScreenOrientation(): number {
    if (screen.orientation) {
      return screen.orientation.angle;
    }
    return 0;
  }

  private transformTiltToGameCoords(gamma: number, beta: number, orientation: number): { x: number; y: number } {
    const tiltX = gamma;
    const tiltY = beta - 45;
    
    switch (orientation) {
      case 0:
        return { x: tiltX, y: tiltY };
      case 90:
      case -270:
        return { x: -tiltY, y: tiltX };
      case 180:
      case -180:
        return { x: -tiltX, y: -tiltY };
      case -90:
      case 270:
        return { x: tiltY, y: -tiltX };
      default:
        return { x: tiltX, y: tiltY };
    }
  }

  private handleOrientation(event: DeviceOrientationEvent): void {
    if (event.gamma === null || event.beta === null) {
      return;
    }
    
    const gamma = event.gamma;
    const beta = event.beta;
    this.lastTilt = { gamma, beta };
    
    const orientation = this.getScreenOrientation();
    const reference = this.tiltBasis;
    
    let gammaDelta = gamma;
    let betaDelta = beta - 45;
    
    if (reference !== null) {
      gammaDelta = gamma - reference.gamma;
      betaDelta = (beta - 45) - (reference.beta - 45);
    }
    
    const gameCoords = this.transformTiltToGameCoords(gammaDelta, betaDelta + 45, orientation);
    
    const normalizedX = this.clamp(gameCoords.x / 35, -1, 1);
    const normalizedY = this.clamp(gameCoords.y / 35, -1, 1);
    
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
