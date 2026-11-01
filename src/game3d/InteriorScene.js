// Interior scene: a walkable 3D room the player enters from a building tile.
// Player character is driven by a virtual joystick; NPCs wander, can be talked to
// and bump into the player (footstep + speech sounds are emitted through callbacks).
import * as THREE from 'three';
import { getTextures, standardMaterial } from './builders';
import { ROOM_W, ROOM_D, WALL_H, labelTexture, buildLayout, plant } from './interiorRooms';

const ROOM_TITLES = {
  bank: 'БАНК',
  office: 'ОФИС',
  casino: 'КАЗИНО',
  property: 'ДОМ',
  business: 'БИЗНЕС',
};

const NPC_LINES = {
  bank: ['Где тут бланк?', 'Курс валют опять упал…', 'Мне нужен кредит!', 'Очередь не двигается.'],
  office: ['Совещание в 3?', 'Отчёт готов?', 'Кофе закончился…', 'Начальник в отпуске!'],
  casino: ['Ставлю на красное!', 'Сегодня мой день!', 'Ещё одну партию…', 'Крупье, фишки!'],
  property: ['Ужин готов!', 'Давай отдохнём.', 'Дети спят?', 'Какой уютный дом.'],
  business: ['Где заказ №12?', 'Клиенты довольны!', 'Нужна новая поставка.', 'Выручка растёт!'],
};

export class InteriorScene {
  constructor(gl, opts = {}) {
    this.gl = gl;
    this.width = opts.width || gl.drawingBufferWidth;
    this.height = opts.height || gl.drawingBufferHeight;
    this.roomType = opts.roomType || 'office';
    this.clock = new THREE.Clock();
    this.joy = { x: 0, y: 0 };
    this.npcs = [];
    this.interactables = [];
    this.nearest = null;
    this.onInteract = opts.onInteract || (() => {});
    this.onStep = opts.onStep || (() => {});
    this.onNpcTalk = opts.onNpcTalk || (() => {});
    this.moveSpeed = 5.2;
    this.stepTimer = 0;
    this.talkCooldown = 0;
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
      antialias: true,
      alpha: false,
    });
    renderer.setSize(this.width, this.height, false);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1c);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(52, this.width / this.height, 0.1, 120);
    camera.position.set(0, 8.2, 14.7);
    camera.lookAt(0, 1.5, 0.7);
    this.camera = camera;

    this.setupLights();
    this.buildRoom();
    this.buildFurniture();
    this.buildPlayer();
    this.buildNpcs();
  }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xbcd8ff, 0x2a2036, 0.9));
    const key = new THREE.DirectionalLight(0xfff2d8, 1.7);
    key.position.set(7, 13, 8);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.left = -16;
    key.shadow.camera.right = 16;
    key.shadow.camera.top = 16;
    key.shadow.camera.bottom = -16;
    key.shadow.bias = -0.001;
    this.scene.add(key);
    const lampColor = this.roomType === 'casino' ? 0xff9ad5 : 0xffd9a0;
    [-5, 0, 5].forEach((x) => {
      const lamp = new THREE.PointLight(lampColor, 0.9, 22, 2);
      lamp.position.set(x, WALL_H - 0.6, 0);
      this.scene.add(lamp);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: lampColor, emissiveIntensity: 2 })
      );
      bulb.position.copy(lamp.position);
      this.scene.add(bulb);
    });
  }

  buildRoom() {
    const t = getTextures();
    const floorTint = {
      bank: 0xd8c9a8,
      office: 0xb9c6d8,
      casino: 0x6b2f52,
      property: 0xc79a63,
      business: 0xa9b3c4,
    }[this.roomType] || 0xd8c9a8;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_D),
      standardMaterial({ map: t.marble, color: floorTint, roughness: 0.42, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const wallTint = {
      bank: 0x2c3a58,
      office: 0x24304a,
      casino: 0x3a1030,
      property: 0x4a3a2c,
      business: 0x1f3a34,
    }[this.roomType] || 0x2c3a58;
    const wallMat = standardMaterial({ map: t.concrete, color: wallTint, roughness: 0.85 });
    const mkWall = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      m.position.set(x, y, z);
      m.receiveShadow = true;
      m.castShadow = true;
      this.scene.add(m);
    };
    mkWall(ROOM_W, WALL_H, 0.4, 0, WALL_H / 2, -ROOM_D / 2);
    mkWall(0.4, WALL_H, ROOM_D, -ROOM_W / 2, WALL_H / 2, 0);
    mkWall(0.4, WALL_H, ROOM_D, ROOM_W / 2, WALL_H / 2, 0);
    // front wall with a doorway gap
    mkWall(ROOM_W / 2 - 1.6, WALL_H, 0.4, -ROOM_W / 4 - 0.8, WALL_H / 2, ROOM_D / 2);
    mkWall(ROOM_W / 2 - 1.6, WALL_H, 0.4, ROOM_W / 4 + 0.8, WALL_H / 2, ROOM_D / 2);

    // doorway glow so the exit reads as "out into the city"
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 4.2),
      new THREE.MeshBasicMaterial({ color: 0x4dd2ff, transparent: true, opacity: 0.22 })
    );
    door.position.set(0, 2.1, ROOM_D / 2 - 0.22);
    door.rotation.y = Math.PI;
    this.scene.add(door);
    this.door = door;

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.1),
      new THREE.MeshBasicMaterial({ map: labelTexture('ВЫХОД', '#1a1030', '#ffd166'), transparent: true })
    );
    sign.position.set(0, WALL_H - 0.9, ROOM_D / 2 - 0.25);
    sign.rotation.y = Math.PI;
    this.scene.add(sign);

    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 2.4),
      new THREE.MeshBasicMaterial({
        map: labelTexture(ROOM_TITLES[this.roomType] || 'ЖИЗНЬ & БИЗНЕС', '#0e1a33', '#4dd2ff'),
      })
    );
    art.position.set(0, 3.4, -ROOM_D / 2 + 0.25);
    this.scene.add(art);
  }

  buildFurniture() {
    this.solids = [];
    buildLayout(this.scene, this.roomType, {
      add: (label, x, z) => this.interactables.push({ label, x, z }),
      solid: (x, z, sx, sz) => this.solids.push({ x, z, sx, sz }),
    });
    // Ring marker under every interactable — the furniture itself has no emissive
    // material, so a glowing floor ring is the reliable "you can use this" cue.
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0x4dd2ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    this.interactables.forEach((it) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.35, 28), this.ringMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(it.x, 0.04, it.z);
      this.scene.add(ring);
      it.ring = ring;
    });
    // a couple of plants are always there, purely decorative
    const p1 = plant(0.9);
    p1.position.set(-8, 0, 6);
    this.scene.add(p1);
    const p2 = plant(0.9);
    p2.position.set(8, 0, 6);
    this.scene.add(p2);
    this.scene.traverse((o) => {
      if (o.userData && o.userData.screen) this.glowScreen = o.userData.screen;
    });
  }

  buildPlayer() {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 0.9, 6, 14),
      new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.45, metalness: 0.2 })
    );
    body.position.y = 1.05;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0xffd9b3, roughness: 0.55 })
    );
    head.position.y = 1.95;
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.12, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x0b1020, emissive: 0x4dd2ff, emissiveIntensity: 1.2 })
    );
    visor.position.set(0, 1.98, 0.33);
    const group = new THREE.Group();
    group.add(body, head, visor);
    group.children.forEach((c) => {
      c.castShadow = true;
    });
    group.position.set(0, 0, 4.2);
    this.scene.add(group);
    this.player = group;
    this.facing = Math.PI;
  }

  buildNpcs() {
    const names = ['Клиент', 'Менеджер', 'Курьер', 'Инвестор'];
    const colors = [0x4dd2ff, 0xffd166, 0x8cff8c, 0xc9a0ff];
    names.forEach((name, i) => {
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.38, 0.85, 6, 12),
        new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.5 })
      );
      body.position.y = 1;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd9b3, roughness: 0.6 })
      );
      head.position.y = 1.82;
      const g = new THREE.Group();
      g.add(body, head);
      g.children.forEach((c) => {
        c.castShadow = true;
      });
      const angle = (i / names.length) * Math.PI * 2;
      g.position.set(Math.cos(angle) * 5.2, 0, Math.sin(angle) * 3.6 - 1);
      this.scene.add(g);
      this.npcs.push({
        group: g,
        name,
        home: g.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
      });
    });
  }

  setJoystick(x, y) {
    this.joy.x = x;
    this.joy.y = y;
  }

  interact() {
    if (!this.nearest) return;
    this.onInteract(this.nearest.label, this.nearest.npcIndex);
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
    const p = this.player;
    if (!p) return;

    const speed = this.moveSpeed * dt;
    const nx = p.position.x + this.joy.x * speed;
    const nz = p.position.z - this.joy.y * speed;
    const limX = ROOM_W / 2 - 1;
    const limZmin = -ROOM_D / 2 + 1;
    const limZmax = ROOM_D / 2 - 0.8;
    // axis-separated collision: try X first, then Z, so sliding along furniture works
    const blocked = (x, z) =>
      (this.solids || []).some(
        (s) => Math.abs(x - s.x) < s.sx + 0.45 && Math.abs(z - s.z) < s.sz + 0.45
      );
    const tryX = Math.max(-limX, Math.min(limX, nx));
    if (!blocked(tryX, p.position.z)) p.position.x = tryX;
    const tryZ = Math.max(limZmin, Math.min(limZmax, nz));
    if (!blocked(p.position.x, tryZ)) p.position.z = tryZ;
    const moving = Math.abs(this.joy.x) + Math.abs(this.joy.y) > 0.08;
    if (moving) {
      const target = Math.atan2(this.joy.x, -this.joy.y);
      let diff = target - this.facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.facing += diff * Math.min(1, dt * 12);
      p.position.y = Math.abs(Math.sin(t * 11)) * 0.12;
      // footsteps every ~0.32s while walking
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.32;
        this.onStep();
      }
    } else {
      p.position.y += (0 - p.position.y) * 0.2;
      this.stepTimer = 0;
    }
    p.rotation.y = this.facing;

    // nearest interactable (furniture or an NPC)
    let best = null;
    let bestDist = 2.6;
    this.interactables.forEach((it) => {
      const d = Math.hypot(it.x - p.position.x, it.z - p.position.z);
      if (d < bestDist) {
        bestDist = d;
        best = it;
      }
    });
    this.npcs.forEach((n, i) => {
      const d = Math.hypot(n.group.position.x - p.position.x, n.group.position.z - p.position.z);
      if (d < bestDist) {
        bestDist = d;
        best = { label: `Поговорить: ${n.name}`, npcIndex: i };
      }
    });
    this.nearest = best;
    this.interactables.forEach((it) => {
      const ring = it.ring;
      if (!ring) return;
      const isNear = it === best;
      const target = isNear ? 0.55 + Math.sin(t * 6) * 0.3 : 0;
      ring.material.opacity += (target - ring.material.opacity) * Math.min(1, dt * 8);
      ring.material.color.setHex(isNear ? 0x4dd2ff : 0x7fa8d8);
    });

    // NPCs wander, face the player when close, and greet once in a while
    this.talkCooldown -= dt;
    this.npcs.forEach((n, i) => {
      const a = t * n.speed * 0.5 + n.phase;
      n.group.position.x = n.home.x + Math.cos(a) * 1.4;
      n.group.position.z = n.home.z + Math.sin(a * 0.8) * 1.1;
      const dx = p.position.x - n.group.position.x;
      const dz = p.position.z - n.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 2.4) {
        n.group.rotation.y = Math.atan2(dx, dz);
        if (this.talkCooldown <= 0) {
          this.talkCooldown = 4.5;
          const lines = NPC_LINES[this.roomType] || NPC_LINES.office;
          this.onNpcTalk(lines[i % lines.length], n.name);
        }
      } else {
        n.group.rotation.y = -a + Math.PI / 2;
      }
      n.group.position.y = Math.abs(Math.sin(t * 4 + i)) * 0.06;
    });

    if (this.glowScreen && this.glowScreen.material) {
      this.glowScreen.material.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.6;
    }
    if (this.door) {
      this.door.material.opacity = 0.16 + Math.sin(t * 2) * 0.07;
    }

    // camera follows the character from behind/above at a readable angle
    const camTargetX = p.position.x * 0.35;
    const camTargetZ = p.position.z * 0.3 + 10.5;
    this.camera.position.x += (camTargetX - this.camera.position.x) * Math.min(1, dt * 3);
    this.camera.position.z += (camTargetZ - this.camera.position.z) * Math.min(1, dt * 3);
    this.camera.position.y = 8.2;
    this.camera.lookAt(p.position.x * 0.45, 1.5, p.position.z * 0.45 - 1.2);
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
