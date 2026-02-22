# Dot Dodger - AGENTS.md

## Project Overview

Dot Dodger is a mobile arcade-style game inspired by the classic iOS game. The player controls a cursor by tilting their phone, avoiding red dots, and collecting weapon orbs to destroy enemies.

### Tech Stack
- TypeScript (strict mode)
- HTML5 Canvas API for rendering
- Vite for build tooling
- No external dependencies (pure vanilla JS/TS)

### Project Structure

```
tiltToPersist/
├── index.html              # Main HTML entry point
├── package.json            # NPM configuration
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── readme.md              # Game design document
├── src/
│   ├── main.ts            # Entry point, game initialization
│   ├── types/
│   │   └── index.ts       # Type definitions, enums
│   ├── entities/
│   │   ├── Player.ts      # Player cursor entity
│   │   ├── Dot.ts         # Enemy dot entity
│   │   └── WeaponOrb.ts   # Weapon pickup orbs with icons
│   ├── renderer/
│   │   └── Renderer.ts    # Canvas rendering utilities
│   ├── game/
│   │   ├── Game.ts        # Main game loop and logic
│   │   ├── CollisionSystem.ts  # Collision detection
│   │   ├── InputHandler.ts     # Device tilt input
│   │   ├── WeaponOrbSpawner.ts # Orb spawning system
│   │   └── PatternManager.ts   # Dot spawning patterns
│   ├── patterns/
│   │   ├── Pattern.ts     # Base pattern class
│   │   ├── ZombieSnow.ts
│   │   ├── SweeperLine.ts
│   │   ├── SparseGrid.ts
│   │   ├── BouncingBall.ts
│   │   ├── GatlingPoint.ts
│   │   ├── BulletHell.ts
│   │   └── ContainmentRing.ts
│   ├── weapons/
│   │   ├── Weapon.ts           # Base weapon class
│   │   ├── WeaponRegistry.ts   # Weapon factory
│   │   ├── KineticBomb.ts
│   │   ├── Blaster.ts
│   │   ├── IceBomb.ts
│   │   ├── HomingMissile.ts
│   │   ├── NuclearBomb.ts      # Bounces on contact
│   │   ├── ElectricBomb.ts     # Bounces on contact
│   │   ├── DotRepellent.ts
│   │   ├── Chainsaw.ts
│   │   └── FlameBurst.ts
│   └── utils/
│       └── constants.ts   # Game constants
└── docs/                  # Built files (generated) - GitHub Pages serves from here
```

## Key Features

### Weapons (9 total)
1. **Kinetic Bomb** - Instant explosion
2. **Blaster** - Horizontal destruction beam
3. **Ice Bomb** - Freezes dots
4. **Homing Missile** - Three guided missiles
5. **Nuclear Bomb** - Bouncing orb that explodes (purple border)
6. **Electric Bomb** - Bouncing viral explosion (purple border)
7. **Dot Repellent** - Magnetic repulsion field
8. **Chainsaw** - Temporary invincibility circle
9. **Flame Burst** - Fire trail dash

### Weapon Orb Visual Design
- **Solid colored circle** based on weapon type (from WEAPON_COLORS)
- **Border color indicates pickup behavior:**
  - Purple (#9B30FF): Bounces on contact (Nuclear, Electric)
  - White: Picked up immediately (all others)
- **White icon** drawn on top showing weapon type

### Patterns (7 types)
- Zombie Snow - Falling dots that chase player
- Sweeper Line - Wall with holes sweeping across
- Sparse Grid - Slow-moving grid
- Bouncing Ball - Dense circle formation
- Gatling Point - Rapid fire from fixed position
- Bullet Hell - Spiral patterns
- Containment Ring - Ring around player

## Build & Deploy

### Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Deploy

**⚠️ MANDATORY: After ANY code changes to the git repo, you MUST deploy to the nginx server so the user can test the changes.**

The game is served from `/var/www/html/dot-dodger/` via nginx. Built files in `docs/` are NOT automatically served - you must explicitly copy them.

```bash
# 1. Build first
npm run build

# 2. Deploy to nginx serve directory (REQUIRED - do not skip this step)
mkdir -p /var/www/html/dot-dodger
cp -r docs/* /var/www/html/dot-dodger/
```

**Never assume the user can test from `docs/` directly. Always deploy to `/var/www/html/dot-dodger/` after making changes.**

## Game Constants

Key values in `src/utils/constants.ts`:
- Player: 10px radius, max speed 800
- Dots: 8px radius
- Weapon Orbs: 20px radius
- Weapon orb colors defined in WEAPON_COLORS Record

## Adding New Weapons

1. Create class extending `Weapon` in `src/weapons/`
2. Register in `WeaponRegistry` in `main.ts`
3. Add to `WeaponType` enum
4. Add color to `WEAPON_COLORS`
5. Add icon drawing method in `WeaponOrb.ts`
6. If bounces on contact, add to `BOUNCED_WEAPONS` array

## Adding New Patterns

1. Create class extending `Pattern` in `src/patterns/`
2. Implement `update()` and `isComplete()` methods
3. Register in `PatternManager`
4. Add to `PatternType` enum

## Code Style

- Strict TypeScript - no implicit any
- Prefer composition over inheritance
- Batch render calls via Renderer class
- Use enums for type safety
- No external dependencies
