import { Game } from './game/Game';
import { PatternRegistry } from './patterns/PatternRegistry';
import { WeaponRegistry } from './weapons/WeaponRegistry';
import { PatternType } from './types';
import { WeaponType } from './types';


import { ZombieSnow } from './patterns/ZombieSnow';
import { SweeperLine } from './patterns/SweeperLine';
import { SparseGrid } from './patterns/SparseGrid';
import { UltraSparseGrid } from './patterns/UltraSparseGrid';
import { BouncingBall } from './patterns/BouncingBall';
import { GatlingPoint } from './patterns/GatlingPoint';
import { SpiralPattern } from './patterns/SpiralPattern';
import { CircleBurstPattern } from './patterns/CircleBurstPattern';
import { AimedStreamsPattern } from './patterns/AimedStreamsPattern';
import { WavePattern } from './patterns/WavePattern';
import { ContainmentRing } from './patterns/ContainmentRing';
import { Cyclone } from './patterns/Cyclone';
import { ClockSweep } from './patterns/ClockSweep';

import { Blaster } from './weapons/Blaster';
import { Chainsaw } from './weapons/Chainsaw';
import { DotRepellent } from './weapons/DotRepellent';
import { ElectricBomb } from './weapons/ElectricBomb';
import { FlameBurst } from './weapons/FlameBurst';
import { HomingMissile } from './weapons/HomingMissile';
import { IceBomb } from './weapons/IceBomb';
import { KineticBomb } from './weapons/KineticBomb';
import { NuclearBomb } from './weapons/NuclearBomb';
import { TripleCannon } from './weapons/TripleCannon';
import { FireballOrb } from './weapons/FireballOrb';
import { TeslaCannon } from './weapons/TeslaCannon';

PatternRegistry.register(PatternType.ZOMBIE_SNOW, ZombieSnow);
PatternRegistry.register(PatternType.SWEEPER_LINE, SweeperLine);
PatternRegistry.register(PatternType.SPARSE_GRID, SparseGrid);
PatternRegistry.register(PatternType.ULTRA_SPARSE_GRID, UltraSparseGrid);
PatternRegistry.register(PatternType.BOUNCING_BALL, BouncingBall);
PatternRegistry.register(PatternType.GATLING_POINT, GatlingPoint);
PatternRegistry.register(PatternType.SPIRAL, SpiralPattern);
PatternRegistry.register(PatternType.CIRCLE_BURST, CircleBurstPattern);
PatternRegistry.register(PatternType.AIMED_STREAMS, AimedStreamsPattern);
PatternRegistry.register(PatternType.WAVE, WavePattern);
PatternRegistry.register(PatternType.CONTAINMENT_RING, ContainmentRing);
PatternRegistry.register(PatternType.CYCLONE, Cyclone);
PatternRegistry.register(PatternType.CLOCK_SWEEP, ClockSweep);

WeaponRegistry.register(WeaponType.BLASTER, Blaster);
WeaponRegistry.register(WeaponType.CHAINSAW, Chainsaw);
WeaponRegistry.register(WeaponType.DOT_REPELLENT, DotRepellent);
WeaponRegistry.register(WeaponType.ELECTRIC_BOMB, ElectricBomb);
WeaponRegistry.register(WeaponType.FLAME_BURST, FlameBurst);
WeaponRegistry.register(WeaponType.HOMING_MISSILE, HomingMissile);
WeaponRegistry.register(WeaponType.ICE_BOMB, IceBomb);
WeaponRegistry.register(WeaponType.KINETIC_BOMB, KineticBomb);
WeaponRegistry.register(WeaponType.NUCLEAR_BOMB, NuclearBomb);
WeaponRegistry.register(WeaponType.TRIPLE_CANNON, TripleCannon);
WeaponRegistry.register(WeaponType.FIREBALL_ORB, FireballOrb);
WeaponRegistry.register(WeaponType.TESLA_CANNON, TeslaCannon);



new Game();