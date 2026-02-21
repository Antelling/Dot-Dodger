import { Game } from './game/Game';
import { PatternRegistry } from './patterns/PatternRegistry';
import { WeaponRegistry } from './weapons/WeaponRegistry';
import { PatternType } from './types';
import { WeaponType } from './types';
import { toastManager } from './game/ToastManager';

import { ZombieSnow } from './patterns/ZombieSnow';
import { SweeperLine } from './patterns/SweeperLine';
import { SparseGrid } from './patterns/SparseGrid';
import { BouncingBall } from './patterns/BouncingBall';
import { GatlingPoint } from './patterns/GatlingPoint';
import { BulletHell } from './patterns/BulletHell';
import { ContainmentRing } from './patterns/ContainmentRing';
import { Cyclone } from './patterns/Cyclone';

import { Blaster } from './weapons/Blaster';
import { Chainsaw } from './weapons/Chainsaw';
import { DotRepellent } from './weapons/DotRepellent';
import { ElectricBomb } from './weapons/ElectricBomb';
import { FlameBurst } from './weapons/FlameBurst';
import { HomingMissile } from './weapons/HomingMissile';
import { IceBomb } from './weapons/IceBomb';
import { KineticBomb } from './weapons/KineticBomb';
import { NuclearBomb } from './weapons/NuclearBomb';

PatternRegistry.register(PatternType.ZOMBIE_SNOW, ZombieSnow);
PatternRegistry.register(PatternType.SWEEPER_LINE, SweeperLine);
PatternRegistry.register(PatternType.SPARSE_GRID, SparseGrid);
PatternRegistry.register(PatternType.BOUNCING_BALL, BouncingBall);
PatternRegistry.register(PatternType.GATLING_POINT, GatlingPoint);
PatternRegistry.register(PatternType.BULLET_HELL, BulletHell);
PatternRegistry.register(PatternType.CONTAINMENT_RING, ContainmentRing);
PatternRegistry.register(PatternType.CYCLONE, Cyclone);

WeaponRegistry.register(WeaponType.BLASTER, Blaster);
WeaponRegistry.register(WeaponType.CHAINSAW, Chainsaw);
WeaponRegistry.register(WeaponType.DOT_REPELLENT, DotRepellent);
WeaponRegistry.register(WeaponType.ELECTRIC_BOMB, ElectricBomb);
WeaponRegistry.register(WeaponType.FLAME_BURST, FlameBurst);
WeaponRegistry.register(WeaponType.HOMING_MISSILE, HomingMissile);
WeaponRegistry.register(WeaponType.ICE_BOMB, IceBomb);
WeaponRegistry.register(WeaponType.KINETIC_BOMB, KineticBomb);
WeaponRegistry.register(WeaponType.NUCLEAR_BOMB, NuclearBomb);

toastManager.setupGlobalErrorHandler();

new Game();