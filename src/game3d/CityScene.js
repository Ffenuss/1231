// Three.js scene controller: builds the city, animates tokens, dice, camera and weather.
import * as THREE from 'three';
import { TILES, tileWorldPos, tileRotation, CELL } from '../game/board';
import { CATEGORY_COLORS } from '../game/config';
import {
  buildGround,
  buildTile,
  buildBuildingForTile,
  buildTree,
  buildStreetLamp,
  buildCar,
  buildPlayerToken,
  buildDice,
  buildSkyscraper,
  buildHouse,
  getTextures,
  standardMaterial,
} from './builders';

export class CityScene {
  constructor(gl, opts = {}) {
    this.gl = gl;
    this.width = opts.width || gl.drawingBufferWidth;
    this.height = opts.height || gl.drawingBufferHeight;
    this.clock = new THREE.Clock();
    this.tokens = [];
    this.tokenTargets = [];
    this.tokenProgress = [];
    this.dice = null;
    this.diceSpin = 0;
    this.cars = [];
    this.beacons = [];
    this.wheels = [];
    this.quality = opts.quality || 'high';
    this.cameraMode = 'orbit';
    this.cameraAngle = 0.6;
    this.cameraDist = 46;
    this.cameraHeight = 34;
    this.orbitSpeed = 0.06;
    this.focus = new THREE.Vector3(0, 0, 0);
    this.focusTarget = new THREE.Vector3(0, 0, 0);
    this.particles = null;
    this.init();
  }

  init() {
    const gl = this.gl;
    const renderer = new THREE.WebGLRenderer({
      canvas: {
        width: this.width,
        height: this.height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: this.height,
        clientWidth: this.width,
        getContext: () => gl,
      },
      context: gl,
      antialias: this.quality === 'high',
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(this.width, this.height, false);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = this.quality === 'high';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    scene.fog = new THREE.Fog(0x0b1020, 70, 165);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(48, this.width / this.height, 0.5, 400);
    camera.position.set(0, this.cameraHeight, this.cameraDist);
    camera.lookAt(0, 0, 0);
    this.camera = camera;

    this.setupLights();
    this.setupEnvironment();
    buildGround(scene);
    this.buildTiles();
    this.buildCity();
    this.buildCars();
    this.buildDice();
    this.buildParticles();
  }

  setupLights() {
    const hemi = new THREE.HemisphereLight(0x9fd0ff, 0x2a2440, 0.85);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0d0, 2.1);
    sun.position.set(38, 58, 26);
    sun.castShadow = this.quality === 'high';
    if (sun.castShadow) {
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      sun.shadow.camera.left = -55;
      sun.shadow.camera.right = 55;
      sun.shadow.camera.top = 55;
      sun.shadow.camera.bottom = -55;
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 160;
      sun.shadow.bias = -0.0012;
    }
    this.scene.add(sun);
    this.sun = sun;

    const fill = new THREE.DirectionalLight(0x6a8cff, 0.7);
    fill.position.set(-30, 22, -34);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0xff66cc, 1.1, 90, 2);
    rim.position.set(0, 24, -20);
    this.scene.add(rim);
  }

  setupEnvironment() {
    // small procedural gradient cube map for reflections (no external HDR needed)
    const size = 64;
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#3a6ea8');
    grad.addColorStop(0.45, '#9ec8e8');
    grad.addColorStop(0.55, '#ffe6c0');
    grad.addColorStop(1, '#2a2030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const envTex = new THREE.CanvasTexture(canvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    if ('colorSpace' in envTex) envTex.colorSpace = THREE.SRGBColorSpace;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.6;
  }

  buildTiles() {
    this.tileGroups = [];
    this.tileTrims = [];
    TILES.forEach((tile) => {
      const color = CATEGORY_COLORS[tile.type] || '#ffffff';
      const group = buildTile(tile, color);
      const { x, z } = tileWorldPos(tile.i);
      group.position.set(x, 0, z);
      group.rotation.y = tileRotation(tile.i);
      this.scene.add(group);
      this.tileGroups.push(group);
      this.tileTrims.push(group.userData.trimMat);
    });

    // central plaza decoration: fountain
    const fountainBase = new THREE.Mesh(
      new THREE.CylinderGeometry(6.5, 7, 0.7, 40),
      standardMaterial({ map: getTextures().marble, color: 0x2a3350, roughness: 0.35, metalness: 0.4 })
    );
    fountainBase.position.y = 0.35;
    fountainBase.receiveShadow = true;
    this.scene.add(fountainBase);

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(6, 40),
      new THREE.MeshStandardMaterial({
        color: 0x2f8fd8,
        metalness: 0.9,
        roughness: 0.08,
        transparent: true,
        opacity: 0.9,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.72;
    this.scene.add(water);
    this.water = water;

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.9, 5, 16),
      standardMaterial({ map: getTextures().marble, color: 0xdfe6f0, roughness: 0.3 })
    );
    pillar.position.y = 2.6;
    pillar.castShadow = true;
    this.scene.add(pillar);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xffaa33,
        emissiveIntensity: 1.8,
        metalness: 0.9,
        roughness: 0.15,
      })
    );
    orb.position.y = 5.6;
    this.scene.add(orb);
    this.orb = orb;
    const orbLight = new THREE.PointLight(0xffbb55, 2.2, 30, 2);
    orbLight.position.y = 5.6;
    this.scene.add(orbLight);

    // ring of light beams on the plaza
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 9), beamMat);
      beam.position.set(Math.cos(a) * 13, 4.5, Math.sin(a) * 13);
      beam.rotation.y = -a + Math.PI / 2;
      this.scene.add(beam);
    }
  }

  buildCity() {
    // outer ring of skyscrapers
    const outer = 42;
    let seed = 1;
    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2;
      const r = outer + (i % 3) * 5;
      const h = 14 + ((i * 7) % 26);
      const tower = buildSkyscraper({
        width: 5 + (i % 3),
        depth: 5 + ((i + 1) % 3),
        height: h,
        color: [0x6fa8c8, 0x9fd0e8, 0xc8a0e8, 0x8fd8b8, 0xe8b88f][i % 5],
        seed,
      });
      tower.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      tower.rotation.y = -a;
      this.scene.add(tower);
      if (tower.userData.beacon) this.beacons.push(tower.userData.beacon);
      seed += 1;
    }

    // mid ring of smaller houses
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 + 0.2;
      const r = 27;
      const house = buildHouse({
        width: 4.5,
        depth: 4.5,
        height: 3.4,
        wallColor: [0xf0e0c0, 0xe8d0d8, 0xd8e8f0][i % 3],
        roofColor: [0x8b4a3a, 0x4a6b8b, 0x5a7a4a][i % 3],
      });
      house.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      house.rotation.y = -a;
      this.scene.add(house);
    }

    // buildings behind each board tile
    TILES.forEach((tile) => {
      if (['event', 'start', 'jail'].includes(tile.type)) return;
      const b = buildBuildingForTile(tile.type, tile.i);
      const { x, z } = tileWorldPos(tile.i);
      const rot = tileRotation(tile.i);
      const outward = 8.4;
      const dx = Math.sin(rot) * -outward;
      const dz = Math.cos(rot) * -outward;
      b.position.set(x + dx, 0, z + dz);
      b.rotation.y = rot;
      this.scene.add(b);
      if (b.userData.wheel) this.wheels.push(b.userData.wheel);
      if (b.userData.beacon) this.beacons.push(b.userData.beacon);
    });

    // decorative trees & lamps around the plaza
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2 + 0.1;
      const tree = buildTree(0.8 + (i % 3) * 0.2);
      tree.position.set(Math.cos(a) * 23.5, 0, Math.sin(a) * 23.5);
      this.scene.add(tree);
    }
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const lamp = buildStreetLamp();
      lamp.position.set(Math.cos(a) * 20.5, 0, Math.sin(a) * 20.5);
      lamp.rotation.y = -a;
      this.scene.add(lamp);
    }
  }

  buildCars() {
    for (let i = 0; i < 5; i += 1) {
      const car = buildCar([0xff4d6d, 0x4dd2ff, 0xffd166, 0x8cff8c, 0xc9a0ff][i]);
      car.userData.angle = (i / 5) * Math.PI * 2;
      car.userData.speed = 0.16 + i * 0.03;
      car.userData.radius = 34 + (i % 2) * 3;
      this.scene.add(car);
      this.cars.push(car);
    }
  }

  buildDice() {
    const dice = buildDice(1.6);
    dice.position.set(0, 9, 0);
    dice.visible = false;
    this.scene.add(dice);
    this.dice = dice;
  }

  buildParticles() {
    const count = 140;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = Math.random() * 40 + 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.35,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.particles = points;
  }

  setPlayers(players) {
    // create/update tokens
    while (this.tokens.length < players.length) {
      const idx = this.tokens.length;
      const token = buildPlayerToken(players[idx].color);
      this.scene.add(token);
      this.tokens.push(token);
      const { x, z } = tileWorldPos(0);
      this.tokenTargets.push(new THREE.Vector3(x, 0, z));
      this.tokenProgress.push(1);
    }
    players.forEach((p, i) => {
      const token = this.tokens[i];
      if (!token) return;
      token.visible = !p.bankrupt;
      const { x, z } = tileWorldPos(p.pos);
      const offset = this.tokenOffset(i, players.length);
      const target = new THREE.Vector3(x + offset.x, 0, z + offset.z);
      const prev = this.tokenTargets[i];
      if (!prev || prev.distanceTo(target) > 0.01) {
        this.tokenTargets[i] = target;
        this.tokenProgress[i] = 0;
      }
    });
  }

  tokenOffset(i, total) {
    const spread = 1.15;
    const positions = [
      { x: -spread, z: -spread },
      { x: spread, z: -spread },
      { x: -spread, z: spread },
      { x: spread, z: spread },
    ];
    return positions[i % positions.length];
  }

  setActivePlayer(index) {
    this.activePlayer = index;
  }

  focusTile(tileIndex) {
    const { x, z } = tileWorldPos(tileIndex);
    this.focusTarget.set(x * 0.55, 0, z * 0.55);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'top') {
      this.cameraDist = 34;
      this.cameraHeight = 62;
    } else if (mode === 'close') {
      this.cameraDist = 30;
      this.cameraHeight = 18;
    } else {
      this.cameraDist = 46;
      this.cameraHeight = 34;
    }
  }

  rotateCamera(delta) {
    this.cameraAngle += delta;
    if (this.cameraMode === 'orbit') this.cameraMode = 'free';
  }

  zoomCamera(factor) {
    this.cameraDist = Math.max(22, Math.min(78, this.cameraDist * factor));
    this.cameraHeight = Math.max(14, Math.min(72, this.cameraHeight * factor));
    if (this.cameraMode === 'orbit') this.cameraMode = 'free';
  }

  rollDiceAnimation() {
    if (!this.dice) return;
    this.dice.visible = true;
    this.dice.position.set(0, 10, 0);
    this.diceSpin = 1;
  }

  hideDice() {
    if (this.dice) this.dice.visible = false;
    this.diceSpin = 0;
  }

  resize(width, height) {
    if (!this.renderer) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    const t = this.clock.getElapsedTime();

    // camera orbit
    if (this.cameraMode === 'orbit') this.cameraAngle += dt * this.orbitSpeed;
    this.focus.lerp(this.focusTarget, Math.min(1, dt * 2.2));
    const camX = Math.sin(this.cameraAngle) * this.cameraDist;
    const camZ = Math.cos(this.cameraAngle) * this.cameraDist;
    this.camera.position.set(camX + this.focus.x * 0.4, this.cameraHeight, camZ + this.focus.z * 0.4);
    this.camera.lookAt(this.focus.x, 1.5, this.focus.z);

    // tokens
    this.tokens.forEach((token, i) => {
      const target = this.tokenTargets[i];
      if (!target) return;
      const prog = this.tokenProgress[i];
      if (prog < 1) {
        this.tokenProgress[i] = Math.min(1, prog + dt * 2.6);
        token.position.lerp(target, 0.25);
        token.position.y = Math.abs(Math.sin(this.tokenProgress[i] * Math.PI)) * 1.4;
      } else {
        token.position.x += (target.x - token.position.x) * 0.2;
        token.position.z += (target.z - token.position.z) * 0.2;
        token.position.y = Math.sin(t * 2 + i) * 0.12 + 0.05;
      }
      const isActive = i === this.activePlayer;
      token.rotation.y = t * (isActive ? 1.6 : 0.6);
      if (token.userData.ring) {
        const s = isActive ? 1 + Math.sin(t * 5) * 0.12 : 0.85;
        token.userData.ring.scale.setScalar(s);
        token.userData.ring.material.opacity = isActive ? 0.95 : 0.45;
      }
    });

    // dice spin
    if (this.diceSpin) {
      this.dice.rotation.x += dt * 7;
      this.dice.rotation.y += dt * 5;
      this.dice.rotation.z += dt * 3;
      this.dice.position.y = 10 + Math.sin(t * 6) * 1.2;
    }

    // cars
    this.cars.forEach((car) => {
      car.userData.angle += dt * car.userData.speed * 0.35;
      const a = car.userData.angle;
      const r = car.userData.radius;
      car.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r);
      car.rotation.y = -a + Math.PI / 2;
    });

    // beacons pulse
    this.beacons.forEach((b, i) => {
      if (b.material) b.material.emissiveIntensity = 1 + Math.sin(t * 3 + i) * 0.9;
    });

    // ferris wheel
    this.wheels.forEach((w) => {
      w.rotation.z += dt * 0.4;
    });

    // tile trim pulse on active tile
    if (this.activeTile != null && this.tileTrims[this.activeTile]) {
      const m = this.tileTrims[this.activeTile];
      m.emissiveIntensity = 1.4 + Math.sin(t * 5) * 0.9;
    }

    // water shimmer
    if (this.water) {
      this.water.material.opacity = 0.82 + Math.sin(t * 1.6) * 0.07;
    }
    if (this.orb) {
      this.orb.position.y = 5.6 + Math.sin(t * 1.4) * 0.22;
      this.orb.rotation.y += dt * 0.6;
    }

    // floating particles
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        let y = pos.getY(i) - dt * 1.6;
        if (y < 2) y = 42;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
  }

  render() {
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    try {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      if (this.renderer) this.renderer.dispose();
    } catch (e) {
      /* ignore */
    }
  }
}
