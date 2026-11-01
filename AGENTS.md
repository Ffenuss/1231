This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## This app: «Жизнь и Бизнес» (board game)

- Screens are switched by local state in `App.js` (`setup` / `game`) — no router; do not add Expo Router here.
- Game rules live in `src/game/state.js` (pure functions returning a cloned state). UI never mutates state directly: `GameScreen` passes an `apply(fn)` helper.
- `src/game3d/City3D.js` = board city scene, `src/game3d/Interior3D.js` = walkable building interior (joystick). Both own a Three.js scene class and a `requestAnimationFrame` loop.
- Interior furniture/layouts per room type live in `src/game3d/interiorRooms.js` (`buildLayout`); `InteriorScene` only assembles room shell, player, NPCs and camera. Adding a room = add a branch to `buildLayout` + a title in `ROOM_TITLES` (`InteriorScreen.js`).
- Interior actions are mapped by label text in `GameScreen.interiorAction(label, toast)` — rest/plant/shelf work in any room, then room-specific labels open the matching modal. `toast` shows a short confirmation pill in `InteriorScreen`.
- Interactable highlight = a glowing floor ring created in `InteriorScene.buildFurniture` (furniture materials have no emissive channel, so don't try to pulse them).
- NPCs are talkable: `InteriorScene.update` puts the closest NPC into `nearest` as `{ label: 'Поговорить: …', npcIndex }`; `InteriorScreen` opens `DialogueModal` with a tree from `src/game/dialogues.js` (`npcDialogue(roomType, index)`), and the chosen option's `effect` is applied by `GameScreen.interiorTalk` via `applyDialogueEffect`.
- Furniture is solid: `buildLayout`'s `place()` reports a Box3 footprint through `helpers.solid`, and `InteriorScene.update` does axis-separated collision against `this.solids`.
- Preview/debug deep links (web only): `?autostart=1` jumps into a game, `?autostart=1&room=bank|office|casino|property|business` opens an interior.
- Balance check: `npx sucrase-node scripts/simulate.js` plays 12 headless games and fails on NaN/crash. Keep end-game net worth in the 0.5–10M range (target `TARGET_NET_WORTH` = 500K).
- Multiplayer: `node scripts/mp-server.js` runs a dependency-free WebSocket relay on port 8787. Message types (`src/game/lobby.js`): `state`/`lobby`/`start` go host→clients, `join`/`ready`/`leave`/`action` go client→host. Lobby UI: `src/ui/MultiplayerModal.js`, wiring in `App.js` (`hostGame`, `joinGame`, `setReady`, `startMultiplayerGame`).
- Relay gotcha: the relay marks a socket as host only after it sends the first `state` message, so the host must publish a snapshot before clients can reach it.
- Audio is synthesised at runtime (`src/game/audio.js`): WebAudio on web, PCM/WAV buffers via `expo-audio` on native. No audio asset files.
- `eslint.config.js` disables several `react-hooks/*` compiler rules — PanResponder closures and Three.js refs are intentional.
