// Procedural geometry + material builders for the city.
import * as THREE from 'three';
import {
  makeAsphalt,
  makeGrass,
  makeConcrete,
  makeBrick,
  makeGlassFacade,
  makeMarble,
  makeTileLabel,
} from './textures';

const cache = {};

function tex(canvas, repeat = 1) {
  if (!canvas) return null;
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

export function getTextures() {
  if (cache.ready) return cache;
  cache.asphalt = tex(makeAsphalt(256), 6);
  cache.grass = tex(makeGrass(256), 8);
  cache.concrete = tex(makeConcrete(256), 2);
  cache.brick = tex(makeBrick(256), 2);
  cache.glass = tex(makeGlassFacade(256), 1);
  cache.marble = tex(makeMarble(256), 2);
  cache.ready = true;
  return cache;
}

export function tileLabelTexture(tile, color) {
  const canvas = makeTileLabel(tile.label, color, tile.icon);
  const t = tex(canvas, 1);
  return t;
}

export function standardMaterial(opts) {
  return new THREE.MeshStandardMaterial({
    metalness: 0.15,
    roughness: 0.55,
    ...opts,
  });
}

export function buildGround(scene) {
  const t = getTextures();
  const groundGeo = new THREE.PlaneGeometry(220, 220, 1, 1);
  const groundMat = standardMaterial({
    map: t.grass,
    color: 0x9fd39a,
    roughness: 0.9,
    metalness: 0.02,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  // city asphalt ring around the board
  const roadMat = standardMaterial({ map: t.asphalt, color: 0x8d8d99, roughness: 0.85 });
  const road = new THREE.Mesh(new THREE.RingGeometry(26, 46, 64), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.01;
  road.receiveShadow = true;
  scene.add(road);

  // plaza under the board
  const plazaMat = standardMaterial({ map: t.concrete, color: 0xdcd7cf, roughness: 0.7 });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(25, 64), plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // decorative road markings
  const markMat = standardMaterial({ color: 0xffe9a8, emissive: 0x554400, roughness: 0.4 });
  for (let i = 0; i < 28; i += 1) {
    const a = (i / 28) * Math.PI * 2;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 2.4), markMat);
    mark.position.set(Math.cos(a) * 36, 0.03, Math.sin(a) * 36);
    mark.rotation.y = -a;
    scene.add(mark);
  }
  return ground;
}

export function buildTile(tile, color) {
  const group = new THREE.Group();
  const t = getTextures();
  const baseMat = standardMaterial({ map: t.marble, color: 0x2b3350, roughness: 0.4, metalness: 0.35 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.34, 4.7), baseMat);
  base.position.y = 0.17;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const topMat = standardMaterial({
    color: 0x1a2033,
    roughness: 0.3,
    metalness: 0.5,
    emissive: new THREE.Color(color).multiplyScalar(0.18),
  });
  const top = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.06, 4.2), topMat);
  top.position.y = 0.37;
  top.receiveShadow = true;
  group.add(top);

  // label plane laid flat, facing up
  const labelTex = tileLabelTexture(tile, color);
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTex,
    transparent: false,
    roughness: 0.5,
    metalness: 0.1,
    emissive: 0xffffff,
    emissiveMap: labelTex,
    emissiveIntensity: 0.22,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), labelMat);
  label.rotation.x = -Math.PI / 2;
  label.position.y = 0.405;
  group.add(label);

  // glowing edge trim
  const trimMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.9,
    metalness: 0.6,
    roughness: 0.25,
  });
  const trimGeo = new THREE.BoxGeometry(4.8, 0.08, 0.12);
  const trim1 = new THREE.Mesh(trimGeo, trimMat);
  trim1.position.set(0, 0.36, 2.35);
  group.add(trim1);
  const trim2 = trim1.clone();
  trim2.position.z = -2.35;
  group.add(trim2);

  group.userData.baseMat = baseMat;
  group.userData.trimMat = trimMat;
  return group;
}

// Generic skyscraper with window grid, setbacks and a rooftop antenna.
export function buildSkyscraper({ width = 6, depth = 6, height = 22, color = 0x6fa8c8, seed = 1 }) {
  const g = new THREE.Group();
  const t = getTextures();
  const glassTex = t.glass.clone();
  glassTex.needsUpdate = true;
  glassTex.repeat.set(Math.max(1, Math.round(width / 3)), Math.max(1, Math.round(height / 4)));
  const glassMat = new THREE.MeshStandardMaterial({
    map: glassTex,
    color,
    metalness: 0.75,
    roughness: 0.22,
    envMapIntensity: 1.2,
  });
  const frameMat = standardMaterial({ color: 0xe8eaf0, roughness: 0.45, metalness: 0.4 });

  let y = 0;
  let w = width;
  let d = depth;
  const tiers = 2 + (seed % 2);
  for (let i = 0; i < tiers; i += 1) {
    const h = (height / tiers) * (1 - i * 0.12);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat);
    body.position.y = y + h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3), frameMat);
    cap.position.y = y + h;
    cap.castShadow = true;
    g.add(cap);
    y += h;
    w *= 0.82;
    d *= 0.82;
  }
  // antenna
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 3.2, 6), frameMat);
  ant.position.y = y + 1.6;
  g.add(ant);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xff3355, emissive: 0xff2244, emissiveIntensity: 2 })
  );
  beacon.position.y = y + 3.3;
  g.add(beacon);
  g.userData.beacon = beacon;
  return g;
}

export function buildHouse({ width = 6, depth = 6, height = 4, wallColor = 0xe8d6b8, roofColor = 0x8b4a3a }) {
  const g = new THREE.Group();
  const t = getTextures();
  const wallMat = standardMaterial({ map: t.brick, color: wallColor, roughness: 0.8 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  walls.position.y = height / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  g.add(walls);

  const roofMat = standardMaterial({ color: roofColor, roughness: 0.6, metalness: 0.2 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.78, 2.6, 4), roofMat);
  roof.position.y = height + 1.3;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // windows
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x9fd8ff,
    emissive: 0x88bbff,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.1,
  });
  const winGeo = new THREE.BoxGeometry(1.1, 1.1, 0.1);
  const positions = [
    [-width * 0.25, height * 0.55, depth / 2 + 0.02],
    [width * 0.25, height * 0.55, depth / 2 + 0.02],
    [0, height * 0.55, -depth / 2 - 0.02],
  ];
  positions.forEach(([x, y, z]) => {
    const wmesh = new THREE.Mesh(winGeo, winMat);
    wmesh.position.set(x, y, z);
    g.add(wmesh);
  });

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2, 0.12),
    standardMaterial({ color: 0x5a3a22, roughness: 0.7 })
  );
  door.position.set(0, 1, depth / 2 + 0.03);
  g.add(door);
  return g;
}

export function buildTree(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * scale, 0.26 * scale, 2.2 * scale, 7),
    standardMaterial({ color: 0x6b4a2f, roughness: 0.9 })
  );
  trunk.position.y = 1.1 * scale;
  trunk.castShadow = true;
  g.add(trunk);
  const leafMat = standardMaterial({ color: 0x3f8f4a, roughness: 0.85 });
  for (let i = 0; i < 3; i += 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry((1.5 - i * 0.3) * scale, 1.9 * scale, 8), leafMat);
    cone.position.y = (2.2 + i * 0.85) * scale;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

export function buildStreetLamp() {
  const g = new THREE.Group();
  const mat = standardMaterial({ color: 0x2a2f3a, metalness: 0.8, roughness: 0.35 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 5, 8), mat);
  pole.position.y = 2.5;
  pole.castShadow = true;
  g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), mat);
  arm.position.set(0.6, 5, 0);
  g.add(arm);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xfff2c4,
    emissive: 0xffe08a,
    emissiveIntensity: 2.2,
  });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), lampMat);
  lamp.position.set(1.25, 4.9, 0);
  g.add(lamp);
  const light = new THREE.PointLight(0xffd68a, 0.9, 16, 2);
  light.position.set(1.25, 4.8, 0);
  g.add(light);
  return g;
}

export function buildCar(color = 0xff4d6d) {
  const g = new THREE.Group();
  const bodyMat = standardMaterial({ color, metalness: 0.6, roughness: 0.28 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 1.2), bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.6, 1.05),
    new THREE.MeshStandardMaterial({ color: 0x9fdcff, metalness: 0.9, roughness: 0.1 })
  );
  cabin.position.set(-0.15, 1.15, 0);
  cabin.castShadow = true;
  g.add(cabin);
  const wheelMat = standardMaterial({ color: 0x14161c, roughness: 0.9 });
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12);
  [
    [0.8, 0.32, 0.62],
    [0.8, 0.32, -0.62],
    [-0.85, 0.32, 0.62],
    [-0.85, 0.32, -0.62],
  ].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, y, z);
    g.add(w);
  });
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.25, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffee, emissiveIntensity: 1.6 })
  );
  head.position.set(1.32, 0.6, 0);
  g.add(head);
  return g;
}

export function buildBuildingForTile(type, index) {
  const g = new THREE.Group();
  const palette = [0x6fa8c8, 0x9fd0e8, 0xc8a0e8, 0x8fd8b8, 0xe8b88f];
  if (type === 'property') {
    const h = 6 + (index % 4) * 3;
    g.add(buildSkyscraper({ width: 5, depth: 5, height: h, color: palette[index % palette.length], seed: index }));
  } else if (type === 'business') {
    g.add(buildHouse({ width: 6, depth: 6, height: 4.5, wallColor: 0xf0e0c0, roofColor: 0x4a6b8b }));
  } else if (type === 'education') {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(7, 5, 6),
      standardMaterial({ map: getTextures().concrete, color: 0xe8e4dc, roughness: 0.7 })
    );
    base.position.y = 2.5;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      standardMaterial({ color: 0xb8c8e0, metalness: 0.5, roughness: 0.3 })
    );
    dome.position.y = 5;
    g.add(dome);
  } else if (type === 'casino') {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(7, 4.5, 6),
      standardMaterial({ color: 0x2a1030, metalness: 0.6, roughness: 0.25 })
    );
    base.position.y = 2.25;
    base.castShadow = true;
    g.add(base);
    const neonMat = new THREE.MeshStandardMaterial({
      color: 0xff4dd2,
      emissive: 0xff22bb,
      emissiveIntensity: 2.4,
    });
    const neon = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.18, 8, 24), neonMat);
    neon.position.set(0, 5.2, 0);
    neon.rotation.x = Math.PI / 2;
    g.add(neon);
    const light = new THREE.PointLight(0xff44cc, 1.6, 18, 2);
    light.position.set(0, 5, 0);
    g.add(light);
  } else if (type === 'jail') {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(7, 4, 6),
      standardMaterial({ map: getTextures().concrete, color: 0x8a8f9a, roughness: 0.85 })
    );
    base.position.y = 2;
    base.castShadow = true;
    g.add(base);
    const barMat = standardMaterial({ color: 0x3a3f4a, metalness: 0.9, roughness: 0.3 });
    for (let i = 0; i < 6; i += 1) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6), barMat);
      bar.position.set(-2.5 + i, 2, 3.05);
      g.add(bar);
    }
  } else if (type === 'bank') {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(7, 6, 6),
      standardMaterial({ map: getTextures().marble, color: 0xf4f2ec, roughness: 0.35, metalness: 0.2 })
    );
    base.position.y = 3;
    base.castShadow = true;
    g.add(base);
    const colMat = standardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
    for (let i = 0; i < 4; i += 1) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 12), colMat);
      col.position.set(-2.4 + i * 1.6, 3, 3.2);
      g.add(col);
    }
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2, 4), standardMaterial({ color: 0xffffff }));
    pediment.position.y = 7;
    pediment.rotation.y = Math.PI / 4;
    g.add(pediment);
  } else if (type === 'entertainment') {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.8, 3, 16),
      standardMaterial({ color: 0xff9db0, roughness: 0.5 })
    );
    base.position.y = 1.5;
    base.castShadow = true;
    g.add(base);
    const wheelMat = standardMaterial({ color: 0xffd166, emissive: 0x553300, metalness: 0.6, roughness: 0.3 });
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(3, 0.22, 8, 32), wheelMat);
    wheel.position.y = 6.5;
    g.add(wheel);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x4dd2ff, emissive: 0x2277aa, emissiveIntensity: 0.6 });
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), cabinMat);
      cab.position.set(Math.cos(a) * 3, 6.5 + Math.sin(a) * 3, 0);
      g.add(cab);
    }
    g.userData.wheel = wheel;
  } else if (type === 'career') {
    g.add(buildSkyscraper({ width: 6, depth: 6, height: 20, color: 0x8fb8d8, seed: index + 3 }));
  } else if (type === 'life') {
    g.add(buildHouse({ width: 5, depth: 5, height: 4, wallColor: 0xffe0e8, roofColor: 0xd0607a }));
  } else if (type === 'start') {
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.35, 10, 28, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xaa7700, emissiveIntensity: 1.1, metalness: 0.8, roughness: 0.25 })
    );
    arch.position.y = 3;
    g.add(arch);
  } else {
    g.add(buildTree(1.2));
    g.add(buildTree(0.9));
  }
  return g;
}

export function buildPlayerToken(color) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color).multiplyScalar(0.35),
    metalness: 0.55,
    roughness: 0.25,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 6, 12), bodyMat);
  body.position.y = 0.85;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), bodyMat);
  head.position.y = 1.5;
  head.castShadow = true;
  g.add(head);
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.12, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x0a0f18, emissive: 0x66ddff, emissiveIntensity: 1.4 })
  );
  visor.position.set(0, 1.55, 0.26);
  g.add(visor);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.66, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);
  g.userData.ring = ring;
  return g;
}

export function buildDice(size = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfaf7f0,
    roughness: 0.35,
    metalness: 0.2,
    emissive: 0x222222,
  });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
  cube.castShadow = true;
  g.add(cube);
  // pips on faces
  const pipMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.5 });
  const pipGeo = new THREE.SphereGeometry(size * 0.07, 8, 8);
  const faces = [
    { n: 0, pos: [0, 0, size / 2], rot: 0 },
    { n: 1, pos: [0, 0, -size / 2], rot: 0 },
    { n: 2, pos: [size / 2, 0, 0], rot: 0 },
    { n: 3, pos: [-size / 2, 0, 0], rot: 0 },
    { n: 4, pos: [0, size / 2, 0], rot: 0 },
    { n: 5, pos: [0, -size / 2, 0], rot: 0 },
  ];
  faces.forEach((f) => {
    for (let i = 0; i < 3; i += 1) {
      const pip = new THREE.Mesh(pipGeo, pipMat);
      const off = (i - 1) * size * 0.24;
      if (Math.abs(f.pos[0]) > 0) pip.position.set(f.pos[0] * 1.001, off, 0);
      else if (Math.abs(f.pos[1]) > 0) pip.position.set(0, f.pos[1] * 1.001, off);
      else pip.position.set(off, 0, f.pos[2] * 1.001);
      g.add(pip);
    }
  });
  return g;
}
