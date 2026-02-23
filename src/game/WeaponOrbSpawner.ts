import { WeaponOrb } from '../entities/WeaponOrb';
import { WeaponType, Bounds, Vector2 } from '../types';
import { WEAPON_ORB_RADIUS } from '../utils/constants';

export class WeaponOrbSpawner {
  private orbs: WeaponOrb[] = [];
  private readonly orbCount: number = 3;
  private readonly minSpacing: number = 100;
  private readonly playerAvoidRadius: number = 150;

  initialize(bounds: Bounds, playerPosition: Vector2): void {
    this.orbs = [];
    for (let i = 0; i < this.orbCount; i++) {
      this.spawnOrb(bounds, playerPosition);
    }
  }

  update(bounds: Bounds, playerPosition: Vector2): void {
    while (this.orbs.length < this.orbCount) {
      this.spawnOrb(bounds, playerPosition);
    }
  }

  getOrbs(): WeaponOrb[] {
    return this.orbs;
  }

  removeOrb(orb: WeaponOrb): void {
    const index = this.orbs.indexOf(orb);
    if (index > -1) {
      this.orbs.splice(index, 1);
    }
  }

  spawnOrb(bounds: Bounds, playerPosition: Vector2): void {
    const pos = this.getRandomPosition(bounds, playerPosition);
    const type = this.getRandomWeaponType();
    this.orbs.push(new WeaponOrb(pos.x, pos.y, type));
  }

  private getRandomPosition(bounds: Bounds, playerPosition: Vector2): Vector2 {
    let attempts = 0;
    while (attempts < 100) {
      const x = WEAPON_ORB_RADIUS + Math.random() * (bounds.width - WEAPON_ORB_RADIUS * 2);
      const y = WEAPON_ORB_RADIUS + Math.random() * (bounds.height - WEAPON_ORB_RADIUS * 2);

      const dx = x - playerPosition.x;
      const dy = y - playerPosition.y;
      const playerDist = Math.sqrt(dx * dx + dy * dy);

      if (playerDist >= this.playerAvoidRadius && this.isPositionValid({ x, y })) {
        return { x, y };
      }
      attempts++;
    }
    return { x: bounds.width / 2, y: bounds.height / 2 };
  }

  private isPositionValid(pos: Vector2): boolean {
    for (const orb of this.orbs) {
      const dx = pos.x - orb.position.x;
      const dy = pos.y - orb.position.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.minSpacing) {
        return false;
      }
    }
    return true;
  }

  private getRandomWeaponType(): WeaponType {
    const types = [
      WeaponType.KINETIC_BOMB,
      WeaponType.BLASTER,
      WeaponType.ICE_BOMB,
      WeaponType.HOMING_MISSILE,
      WeaponType.NUCLEAR_BOMB,
      WeaponType.ELECTRIC_BOMB,
      WeaponType.DOT_REPELLENT,
      WeaponType.CHAINSAW,
      WeaponType.FLAME_BURST,
      WeaponType.TRIPLE_CANNON,
      WeaponType.FIREBALL_ORB,
      WeaponType.TESLA_CANNON
    ];
    return types[Math.floor(Math.random() * types.length)];
  }
}
