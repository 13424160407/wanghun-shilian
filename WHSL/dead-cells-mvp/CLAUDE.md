# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dead Cells MVP** is a roguelike action game built with vanilla HTML5 Canvas and JavaScript. It features:
- 10 levels across 3 rounds with difficulty progression
- Boss battles at levels 3, 6, and 10
- 3 weapon types (sword, bow, shield) with per-level upgrades
- 5 enemy types with difficulty scaling
- Round-based checkpoint system for retries

## Running the Game

### Start Development Server
```bash
node server.js
```
This starts an HTTP server on port 5500. Navigate to `http://localhost:5500/game.html` in a browser.

### Alternatively
Use any HTTP server to serve the directory (Python, PHP, VS Code Live Server, etc.). The game is a pure client-side application with no build step.

## Code Architecture

All game logic is in a single file: **[game.html](game.html)**. The file contains:
- **HTML**: UI panel (HP, potions, kills, weapons), overlay (menu/death/win screens)
- **CSS**: Inline styles for canvas, UI panels, animations
- **JavaScript**: Game loop, collision detection, rendering, input handling, all embedded in `<script>` tags

### Game State Object (`G`)
The global variable `G` holds all runtime state:
```javascript
G = {
  phase: 'menu'|'playing'|'dead'|'win',  // Current game state
  room: 0-9,                              // Current level (0-indexed)
  hp: number,                             // Player health
  pot: number,                            // Potion count
  wpn: 0|1|2,                            // Active weapon (sword/bow/shield)
  dir: {x, y},                           // Player direction
  roll: {time, dir},                     // Roll dodge state
  attk: {time, dmg, rng},                // Attack cooldown
  kills: number,                         // Enemies killed in this level
  score: number,                         // Total score
  enemies: [...],                        // Array of enemy objects
  player: {x, y, w, h, ...}              // Player position/size
}
```

### Configuration System
**[game-config.json](game-config.json)** defines all balance values, loaded at game start:
- **weapons**: 10 levels of sword, bow, shield (dmg, cooldown, range, speed)
- **enemies**: Base stats for 5 enemy types (hp, speed, damage, size, attack range, attack interval, score reward)
- **rooms**: 10-level room definitions (spawn interval, enemy composition, difficulty coefficient)
- **boss**: Boss stats for levels 3, 6, 10

This allows balance tuning without touching game.html. Example structure:
```json
{
  "weapons": {
    "sword": [
      {"room": 0, "cd": 8, "rng": 2.2, "dmg": 15, "name": "剑"},
      ...
    ]
  },
  "enemies": {
    "slime": {"hp": 20, "spd": 0.8, "dmg": 8, ...}
  },
  "rooms": [
    {"id": 0, "name": "第1关", "doorScore": 400, "diff": 1.0, ...},
    ...
  ]
}
```

## Game Systems

### Round & Retry System
Documented in [ROUND_SYSTEM.md](ROUND_SYSTEM.md). The game has 3 rounds:
- **Round 1**: Levels 1-3, retry from level 1
- **Round 2**: Levels 4-6, retry from level 4
- **Round 3**: Levels 7-10, retry from level 7

When player dies, `getRoundStartRoom()` calculates the retry point. When player wins the final boss, `startGame(0)` restarts from level 1.

### Difficulty Progression
Documented in [LEVEL_CONFIG.md](LEVEL_CONFIG.md). Each level has a `diff` coefficient:
```
actual_enemy_stat = base_stat * room_difficulty
```
Difficulty ranges from 1.0 (level 1) to 3.0 (level 10). Weapons auto-upgrade each level via config.

### Level Unlocking
Each level requires a minimum score (`doorScore` in config) to open the next door. This gates progression while allowing farming if needed.

## Key Functions

| Function | Purpose |
|----------|---------|
| `startGame(startRoom)` | Initialize game from given level (0-9). Default 0. |
| `goRoom(roomNum)` | Transition to a new level, reset state, load config. |
| `getRoundStartRoom(room)` | Return the retry checkpoint for a given level. |
| `tick()` | Main game loop (60 FPS). Handles input, spawning, collision, rendering. |
| `dmgEnemy(e, dmg)` | Apply damage to enemy, trigger death/knockback. |
| `dmgBoss()` | Handle boss defeat, show victory message, advance to next level. |
| `dmgPlayer(dmg)` | Apply damage to player, check death condition. |

## Common Development Tasks

### Balance Tuning
Edit [game-config.json](game-config.json):
- Weapon stats: modify `weapons[].dmg`, `weapons[].cd`, `weapons[].rng`
- Enemy stats: modify `enemies[type]` properties
- Room difficulty: modify `rooms[].diff` or `rooms[].spawnInt`
- No game.html changes needed; reload the page to see updates

### Adding a New Level
1. Extend arrays in game-config.json (e.g., room 10 → room 11)
2. Add new weapon upgrade entries for each weapon type
3. If new Boss: add boss stats to config and conditionally spawn in `tick()` at `room === X`
4. Prepare sprite assets: `sprites/bg/levelN.png` if adding a background

### Debugging
1. Open browser DevTools (F12) → Console tab
2. Check for JavaScript errors (red messages)
3. Inspect `G` state object: `console.log(G)`
4. Check config loaded: `console.log(GAME_CONFIG)`
5. Game already logs diagnostics on startup: canvas size, device ratio, etc.

### Testing a Full Run
Documented in [TEST_INSTRUCTIONS.md](TEST_INSTRUCTIONS.md). The procedure:
1. Start server and load game
2. Play through a boss battle (e.g., level 3 boss)
3. Verify correct level transition via console logs and UI
4. Clear browser cache (Ctrl+Shift+Delete) if changes don't appear

## Input Handling

### Keyboard
- **WASD** or **Arrow Keys**: Move player
- **Space**: Attack
- **Shift**: Roll (dodge)
- **Q**: Use potion
- **1/2/3**: Switch weapons
- **Click start button** or press any key: Begin/restart game

### Mobile/Touch
Virtual joystick and buttons appear on small screens (gamepad-like layout).

## Rendering

The canvas is 1920×1080 by default, rendered to fit the window via CSS (`image-rendering: pixelated` for retro feel). Sprites are drawn via `ctx.drawImage()` with frame-based animation (sprite sheets). Background images scale to fill the canvas.

## File Structure

```
.
├── game.html                  # Main game file (all code)
├── game-config.json          # Balance/content config
├── LEVEL_CONFIG.md           # Level progression docs
├── ROUND_SYSTEM.md           # Retry/round system docs
├── TEST_INSTRUCTIONS.md      # Testing procedures
├── server.js                 # Dev server (Node.js)
├── sprites/                  # Game assets
│   ├── player/               # Player animations
│   ├── enemy/                # Enemy sprites
│   └── bg/                   # Level backgrounds
├── audio/                    # Game sounds (if any)
└── sounds/                   # Alternative audio folder
```

## Notes

- The game is **not a typical Node.js/React/build-step project**. It's a pure browser game served as static files.
- All JavaScript is **inline in game.html**. There's no separate module system or bundler.
- The game loop uses **requestAnimationFrame** internally (not explicitly shown; canvas rendering via `setInterval` or similar).
- **No tests** are in the codebase. Testing is manual/play-through (see TEST_INSTRUCTIONS.md).
- The game is **playable offline** once the HTML is loaded; game-config.json is fetched at startup.
