import { WeaponType } from '../types';
import type { Weapon } from './Weapon';

type WeaponConstructor = new () => Weapon;

class WeaponRegistryImpl {
  private weapons: Map<WeaponType, WeaponConstructor> = new Map();

  register(type: WeaponType, weaponClass: WeaponConstructor): void {
    this.weapons.set(type, weaponClass);
  }

  create(type: WeaponType): Weapon | null {
    const WeaponClass = this.weapons.get(type);
    if (!WeaponClass) return null;
    return new WeaponClass();
  }

  getAvailableTypes(): WeaponType[] {
    return Array.from(this.weapons.keys());
  }
}

export const WeaponRegistry = new WeaponRegistryImpl();
