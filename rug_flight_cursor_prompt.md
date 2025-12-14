
# Cursor Prompt — Rug Flight Trials (Production-ready scaffold)

> Purpose: Generate a lightweight, Three.js-based, deterministic flying-rug mini-game that uses on-chain NFT metadata (the NFT image as the rug texture plus cleanliness/aging/frame traits) to control in-game stats. The generated project must be modular, testable, and easy to integrate into an existing site. Keep implementation repository-agnostic: place code under a new folder chosen by Cursor (e.g., `src/games/rug-flight/` or `packages/games/rug-flight/`). Use Vite as default bundler; if the repo is Next.js, place compatible code under a page route and produce a Vite-compatible demo.

---

## High-level requirements (do not assume repo layout)
- Lightweight, production-ready Three.js scene with deterministic, pseudo-physics flight controller optimized for browser.
- Rug texture uses the NFT image URL (passed into the scene as a texture). Provide clear interface: `initGame({ tokenId, nftImageUrl, onChainState })`.
- Deterministic ghost replay format (input events) and seeding for reproducible races.
- Minimal, secure betting hooks left as placeholders (do not implement on-chain betting logic in generated code — provide interfaces for oracle signed result integration).
- Cleanliness / aging / frame traits must be accepted from an external on-chain source via a single data object; the game uses this canonical source to compute stats.
- Target performance: 60 fps on mid-range laptop, 30 fps on mobile. Keep draw calls and shader complexity low.
- Provide a build/dev script and a small demo UI to load an NFT image (local URL or IPFS) and run a short race.
- Add tests & QA checklist: reproducibility, performance, input determinism, and oracle integration points.

---

## Project goals for Cursor
1. Create a runnable Vite project with the game scaffold and a demo page.
2. Include a Three.js scene, the rug controller (movement, boost, turn), and a minimal arena generator (segments).
3. Add a `game/api.js` interface that accepts `onChainState` and computes `gameStats`.
4. Implement a compact ghost/replay writer and reader (`replay.json` format described below).
5. Provide shader code for lightweight rug animation (vertex ripple + tilt). Use about 10×10 subdivisions.
6. Provide mobile and desktop controls (keyboard, on-screen touch controls, optional device tilt).
7. Add documentation inside the repo (README) and inline comments.
8. Provide a single-file `integration.md` that explains how to hook the project to on-chain data and the betting oracle.

---

## Folder tree (suggested — cursor can choose precise placement)
```
<chosen-root>/
  README.md
  package.json
  vite.config.js
  index.html
  src/
    main.js
    App.vue (or App.jsx)
    components/
      GameCanvas.jsx
      HUD.jsx
      RugSelector.jsx
      ControlsOverlay.jsx
    games/
      rug-flight/
        index.js
        scene.js
        rugController.js
        shader.glsl
        courseGenerator.js
        replay.js
        api.js
        assets/
          placeholder-rug.png
        styles.css
    utils/
      deterministic.js
      inputRecorder.js
    tests/
      replay.test.js
      deterministic.test.js
  docs/
    integration.md
    gameplay-spec.md
```

---

## Interfaces & API (important)
- `initGame(options)` — main entry point
  ```js
  initGame({
    mountElement,          // DOM node to mount canvas
    tokenId,               // token ID (optional)
    nftImageUrl,           // string: URL for the rug texture (IPFS/HTTP)
    onChainState,          // object: { dirtLevel: number, agingLevel: number, frameLevel: number, maintenanceScore: number, lastCleaned: number }
    seed,                  // optional deterministic seed (string or number)
    onRaceComplete(result) // callback receiving { finalTime, events, replayHash }
  })
  ```

- `computeGameStats(onChainState)` — canonical mapping from on-chain trait -> playable stats
  - Returns `{ topSpeed, turnSensitivity, boostRecovery, wobbleAmount }`
  - Include a deterministic JS implementation and commented formulas for tuning.

- `recordInputs` / `exportReplay` — stores input events in compact JSON:
  ```json
  {
    "matchId": "string",
    "seed": 12345,
    "player": "0xabc...",
    "events": [
      {"t": 0.120, "ev": "steer", "val": -0.6},
      {"t": 0.350, "ev": "steer", "val": 0.0},
      {"t": 1.230, "ev": "boost", "val": 1}
    ],
    "finalTime": 26.341
  }
  ```

- `loadReplay(replayJson)` — deterministic recreation of the run using input events and seed.

---

## Core technical notes for implementation (explicit, do not handwave)

### Three.js scene
- Use `PerspectiveCamera` (FOV ~60). Use `OrbitControls` only in debug mode.
- Rug: `PlaneGeometry(width, height, 10, 10)`, `ShaderMaterial` with a texture uniform for NFT image.
- Vertex shader: combine a longitudinal sine wave (based on speed) + 2D simplex noise (time) + steering tilt. Keep math cheap.
- Use `InstancedMesh` for repeated obstacles (rings, pillars).
- Move world toward the camera to simulate forward motion; keep rug near fixed Z.

### Rug controller
- `update(delta)` computes `position`, `velocity`, `rotation` from `inputs` and `gameStats`.
- Steering is analog: input range [-1,1]. Apply exponential smoothing: `steer = lerp(steer, input, 1 - exp(-k*dt))`.
- Boost: discrete cooldown-based boost that multiplies forward velocity for 0.6s; recharge rate depends on cleanliness.

### Deterministic course generation
- `seed` determines order and parameterization. Implement a small xorshift or mulberry32 PRNG in `deterministic.js`.
- Course segments: randomized from a small bank, but deterministic by seed. Each segment includes:
  `{ type: "ring" | "pillars" | "boostStrip" | "wind", length: seconds, params: {...} }`

### Ghost & oracle
- Store only `events` (input timeline) + `seed` + `static rug stats` for replay verification.
- Provide helper `computeResultHash(replay)` → `keccak256` or JS equivalent and explain how to pass to oracle for signing.
- Include a `verifyReplay(replay, signature, oraclePubKey)` stub with comments.

---

## UX & HUD
- Minimal HUD: timer, speed (numeric), boost bar, progress bar.
- Rug card: show NFT image, cleanliness icon, frame badge, and small "Clean" button that links to contract action.
- Add a results modal with shareable replay link and a small GIF/WebM export button (client-side recorder stub).

---

## Tests & QA checklist
- Replay determinism: same seed + input events -> identical finalTime to within 0.01s.
- Performance: measure FPS on medium laptop and an iPhone 12 simulator. Document expectations.
- Input latency: ensure smoothing doesn't feel sluggish; test across devices.
- Oracle compatibility: test `computeResultHash` matches node/oracle implementation.

---

## Implementation examples & snippets (to include in generated repo)

### computeGameStats (JS) — canonical mapping
```js
export function computeGameStats({ dirtLevel, agingLevel, frameLevel }) {
  // cleanliness mapping
  const cleanliness = (dirtLevel === 0) ? 1.0 : (dirtLevel === 1) ? 0.65 : 0.35;
  // base
  const BASE_SPEED = 12.0;
  const BASE_TURN = 1.0;
  const BASE_BOOST_REC = 5.0;
  // multipliers
  const speedMult = 0.5 + 0.75 * cleanliness;
  const frameBonus = 1.0 + frameLevel * 0.03;
  const agingPenalty = 1.0 - agingLevel * 0.01;
  return {
    topSpeed: BASE_SPEED * speedMult * agingPenalty,
    turnSensitivity: BASE_TURN * (0.8 + cleanliness * 0.4) * frameBonus,
    boostRecovery: BASE_BOOST_REC / (0.8 + cleanliness * 0.4),
    wobbleAmount: (1 - cleanliness) * 0.03
  };
}
```

### Vertex shader outline (to include as `shader.glsl`)
```glsl
uniform float u_time;
uniform float u_speed;
uniform float u_steer;
attribute vec2 uv;
void main(){
  vec3 pos = position;
  float wave = sin((pos.x * 2.0) + u_time * u_speed) * 0.02;
  float tilt = u_steer * 0.05 * pos.x;
  pos.z += wave + tilt;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

---

## Docs to deliver
- `docs/integration.md` — how to connect on-chain data, sample ethers.js calls, how to compute and include `cleanliness`.
- `docs/gameplay-spec.md` — final gameplay reference (controls, segments, balancing numbers).
- `README.md` — how to run, build, and how Cursor placed files.

---

## Cursor generation directives (explicit)
- Use Vite + vanilla JS or React. Prefer a small framework (React with Vite) unless repo is clearly Next.js; detect and adapt.
- Create minimal CSS and a responsive canvas container.
- Insert TODO placeholders for oracle signing and smart contract addresses.
- Create a single demo NFT image in `assets/placeholder-rug.png` and ensure loading works from IPFS-style URLs.
- Include small sample seed and a "Play Demo" button that runs with the placeholder rug and fake on-chain state.
- Keep package.json lean: `three`, `glslify` (or no glsl bundler, inline shader string), `lit` optional, and dev deps for vite.

---

## Acceptance criteria (for you)
- Cursor output runs `npm install && npm run dev` and loads a demo page with the rug, basic HUD, and one short procedural course.
- The game accepts an external NFT image URL and uses it as rug texture visually.
- The `computeGameStats` function is present and used to alter in-game behavior.
- Replay export/import works for a single run and can be reloaded deterministically.

---

## Final note for Cursor
Be minimalistic, pragmatic and modular. Aim for clean code, clear comments, and an MVP that is delightful. Avoid heavy external dependencies. Make the generated code a strong foundation — not a finished AAA product.

---

End of prompt.
