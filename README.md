# Dot Dodger

**[Play the game →](https://antelling.github.io/Dot-Dodger/)**

A mobile arcade-style game. Tilt your phone to control the cursor, avoid the red dots, and collect weapon orbs to fight back.

Built with TypeScript and HTML5 Canvas. No external dependencies—just pure vanilla JavaScript.

---

## How to Play

1. **Tilt to Move**: Use your device's accelerometer to steer the green cursor
2. **Avoid Red Dots**: Touch a dot and it's game over
3. **Collect Weapon Orbs**: Grab colored orbs to unlock powerful weapons
4. **Survive**: The longer you last, the higher your score

---

## Weapons

Weapon orbs spawn randomly on the arena. Each has a unique effect:

| Weapon | Color | Effect |
|--------|-------|--------|
| **Kinetic Bomb** | Orange | Instant explosion around your position—kills dots in a radius |
| **Blaster** | Purple | Fires a horizontal destruction beam in your facing direction |
| **Ice Bomb** | Cyan | Freezes all dots within range for 3 seconds—dots turn cyan and can't move |
| **Homing Missile** | Yellow | Launches 3 guided missiles that seek out and destroy dots |
| **Nuclear Bomb** | Red | Bouncing orb you can kick around—explodes after 4 seconds or 3 wall bounces. **Warning**: The explosion kills you too if you're in range! |
| **Electric Bomb** | Cyan | Bouncing orb that triggers a viral chain lightning explosion. **Warning**: Electrifies dots and can harm you! |
| **Dot Repellent** | Gray | Creates a magnetic repulsion field around you for 8 seconds—pushes dots away |
| **Chainsaw** | Blue | Temporary invincibility with a spinning blade circle for 2.5 seconds—kill dots on contact |
| **Flame Burst** | Orange | Fire breath in a cone in front of you—incinerates dots in your path |

**Orb Visual Cues:**
- **White border**: Pick up immediately
- **Purple border (#9B30FF)**: Bounces on contact (Nuclear Bomb, Electric Bomb)

---

## Enemy Patterns

The game cycles through different enemy spawn patterns every 8 seconds:

- **Zombie Snow**: Dots fall from above and chase you
- **Sweeper Line**: A wall with holes sweeps across the screen
- **Sparse Grid**: Slow-moving grid formation
- **Bouncing Ball**: Dense circle formation that bounces around
- **Gatling Point**: Rapid-fire dots from a fixed position
- **Bullet Hell**: Spiral patterns filling the screen
- **Containment Ring**: A ring of dots forms around you and closes in
- **Cyclone**: Rotating spiral of dots

---

## Scoring

- **Kill a dot**: +10 points
- **Pattern bonus**: +50-200 points when a pattern completes
- **Time bonus**: Points awarded based on survival time

Difficulty scales with your score:
- **Easy**: 0-500 points
- **Medium**: 500-1500 points  
- **Hard**: 1500+ points

---

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Tech Stack

- **TypeScript** (strict mode)
- **HTML5 Canvas API** for rendering
- **Vite** for build tooling
- **No external dependencies**

---

## Project Structure

```
src/
├── entities/          # Player, Dot, WeaponOrb
├── game/             # Game loop, collision, input, spawning
├── patterns/         # Enemy spawn patterns
├── weapons/          # Weapon implementations
├── renderer/         # Canvas rendering utilities
├── types/            # TypeScript definitions
└── utils/            # Constants and math helpers
```

---

## License

ISC
