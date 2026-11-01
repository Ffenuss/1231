// Furniture builders for interior rooms. Each room type gets its own layout,
// palette and set of interactable objects (label = what the action button does).
import * as THREE from 'three';
import { getTextures, standardMaterial } from './builders';
import { createCanvas } from './textures';

export const ROOM_W = 18;
export const ROOM_D = 14;
export const WALL_H = 5.2;

export function labelTexture(text, bg = '#12203a', fg = '#eaf3ff') {
  const c = createCanvas(256, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 116);
  ctx.fillStyle = fg;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 66);
  return new THREE.CanvasTexture(c);
}

function shadow(group) {
  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}

// --- shared pieces ---------------------------------------------------------
export function desk(wood, dark, w = 5.4, d = 1.8) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, d), wood);
  top.position.y = 1.15;
  const front = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, 0.3), dark);
  front.position.set(0, 0.6, d / 2 - 0.15);
  g.add(top, front);
  return shadow(g);
}

export function sofa(fabric, w = 4.4) {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, 1.7), fabric);
  seat.position.y = 0.55;
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, 0.35), fabric);
  back.position.set(0, 1.15, -0.68);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 1.7), fabric);
  armL.position.set(-w / 2 + 0.15, 0.85, 0);
  const armR = armL.clone();
  armR.position.x = w / 2 - 0.15;
  g.add(seat, back, armL, armR);
  return shadow(g);
}

export function roundTable(wood, dark, r = 1.2) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 22), wood);
  top.position.y = 0.9;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 10), dark);
  leg.position.y = 0.45;
  g.add(top, leg);
  return shadow(g);
}

export function plant(scale = 1) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.36, 0.8, 14),
    standardMaterial({ color: 0xb5643c, roughness: 0.8 })
  );
  pot.position.y = 0.4;
  const leaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 0),
    standardMaterial({ color: 0x3f9b52, roughness: 0.8, flatShading: true })
  );
  leaves.position.y = 1.6;
  g.add(pot, leaves);
  g.scale.setScalar(scale);
  return shadow(g);
}

export function shelf(wood, w = 3.6) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, 0.7), wood);
    board.position.y = 1.4 + i * 1.1;
    g.add(board);
  }
  return shadow(g);
}

export function terminal(dark, glow = 0x4dd2ff) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.4, 0.8), dark);
  body.position.y = 1.2;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x0a2a3a, emissive: glow, emissiveIntensity: 1.6 })
  );
  screen.position.set(0, 1.7, 0.42);
  g.add(body, screen);
  g.userData.screen = screen;
  return shadow(g);
}

export function bed(fabric, wood) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 4.4), wood);
  frame.position.y = 0.5;
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 4.2), fabric);
  mattress.position.y = 0.95;
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 0.9), standardMaterial({ color: 0xf2f4ff }));
  pillow.position.set(0, 1.25, -1.5);
  const head = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 0.3), wood);
  head.position.set(0, 1.1, -2.25);
  g.add(frame, mattress, pillow, head);
  return shadow(g);
}

export function slotMachine(dark) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1), dark);
  body.position.y = 1.1;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x2a0a1a, emissive: 0xff4d6d, emissiveIntensity: 1.4 })
  );
  face.position.set(0, 1.5, 0.52);
  const lever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8),
    standardMaterial({ color: 0xffd166, metalness: 0.8, roughness: 0.3 })
  );
  lever.position.set(0.8, 1.5, 0.2);
  lever.rotation.z = 0.3;
  g.add(body, face, lever);
  g.userData.screen = face;
  return shadow(g);
}

export function roulette(dark, wood) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.7, 0.9, 26), dark);
  base.position.y = 0.45;
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.18, 30),
    standardMaterial({ color: 0x0d5c3a, roughness: 0.5, metalness: 0.2 })
  );
  wheel.position.y = 1.05;
  g.add(base, wheel);
  g.userData.wheel = wheel;
  return shadow(g);
}

export function counter(wood, dark, w = 6) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 1.4), wood);
  top.position.y = 1.1;
  const base = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 1, 1.2), dark);
  base.position.y = 0.5;
  g.add(top, base);
  return shadow(g);
}

export function fridge(dark) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 1.2), standardMaterial({ color: 0xdfe6f2, metalness: 0.6, roughness: 0.25 }));
  body.position.y = 1.5;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), dark);
  handle.position.set(0.6, 1.7, 0.65);
  g.add(body, handle);
  return shadow(g);
}

export function whiteboard() {
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 2.2),
    new THREE.MeshBasicMaterial({ map: labelTexture('ПЛАН', '#f4f7ff', '#1a4fd0') })
  );
  board.position.y = 2.8;
  return board;
}

// --- room layouts ----------------------------------------------------------
// Every layout returns { interactables: [{ label, x, z }], extra: [meshes] }.
export function buildLayout(scene, roomType, helpers) {
  const t = getTextures();
  const wood = standardMaterial({ color: 0x8a5a34, roughness: 0.6 });
  const dark = standardMaterial({ color: 0x1f2a40, roughness: 0.5, metalness: 0.35 });
  const fabric = standardMaterial({ color: 0x3a5a8c, roughness: 0.9 });
  const gold = standardMaterial({ color: 0xffd166, metalness: 0.75, roughness: 0.28 });
  const place = (mesh, label, x, z, ry = 0) => {
    mesh.position.x = x;
    mesh.position.z = z;
    mesh.rotation.y = ry;
    scene.add(mesh);
    if (label) helpers.add(label, x, z);
    // solid footprint so the character cannot walk through furniture
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    const sx = Math.max(0.6, (box.max.x - box.min.x) / 2);
    const sz = Math.max(0.6, (box.max.z - box.min.z) / 2);
    helpers.solid(x, z, sx, sz);
    return mesh;
  };

  if (roomType === 'bank') {
    place(desk(wood, dark, 6, 1.8), 'Стойка операциониста', -3.5, -4.4);
    place(sofa(fabric), 'Диван для ожидания', 4.2, -3.2);
    place(roundTable(wood, dark), 'Стол с документами', 4.2, -0.6);
    place(terminal(dark, 0x4dd2ff), 'Банкомат', 7.4, 2.6);
    place(plant(), 'Растение', -7.2, -5.2);
    place(plant(), 'Растение', 7.2, -5.2);
    place(shelf(wood), 'Архив', -7.4, 1.5);
    const vault = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.5, 26), gold);
    vault.rotation.x = Math.PI / 2;
    const vaultGroup = new THREE.Group();
    vaultGroup.add(vault);
    vault.position.z = 0.2;
    place(shadow(vaultGroup), 'Хранилище', 0, -6.4);
    return;
  }

  if (roomType === 'office') {
    place(desk(wood, dark, 5.4, 1.8), 'Стойка администратора', -3.5, -4.4);
    place(shelf(wood), 'Архив', -7.4, 1.5);
    place(sofa(fabric), 'Диван для ожидания', 4.2, -3.2);
    place(roundTable(wood, dark), 'Стол переговоров', 4.2, -0.6);
    place(plant(), 'Растение', -7.2, -5.2);
    place(plant(), 'Растение', 7.2, -5.2);
    const wb = whiteboard();
    wb.position.set(0, 2.8, -ROOM_D / 2 + 0.25);
    scene.add(wb);
    // rows of desks
    for (let i = 0; i < 3; i += 1) {
      const d = desk(wood, dark, 2.8, 1.2);
      d.scale.setScalar(0.8);
      place(d, i === 1 ? 'Рабочее место' : null, -4.5 + i * 4.5, 2.6, Math.PI);
    }
    return;
  }

  if (roomType === 'casino') {
    place(roulette(dark, wood), 'Рулетка', 0, -3.6);
    place(terminal(dark, 0xffd166), 'Терминал ставок', 6.6, 2.4);
    place(counter(wood, dark, 5), 'Касса', -5.4, -5.2);
    place(sofa(fabric, 3.4), 'Диван', 6.4, -4.6);
    place(plant(), 'Растение', -7.4, 3.4);
    [-5.6, -2.8, 2.8, 5.6].forEach((x, i) => {
      const s = slotMachine(dark);
      place(s, i === 0 ? 'Игровой автомат' : null, x, 4.2);
    });
    return;
  }

  if (roomType === 'property') {
    place(bed(fabric, wood), 'Кровать — отдохнуть', -4.6, -3.6);
    place(sofa(fabric, 3.8), 'Диван — отдохнуть', 4.4, -3.4);
    place(roundTable(wood, dark, 1), 'Стол — семейные дела', 4.4, -0.4);
    place(shelf(wood), 'Полка', -7.4, 2.2);
    place(plant(), 'Растение', 7.2, -5.2);
    place(plant(0.8), 'Растение', -7.2, -5.2);
    const tv = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 2),
      new THREE.MeshStandardMaterial({ color: 0x0a1020, emissive: 0x2a6cff, emissiveIntensity: 0.9 })
    );
    tv.position.set(0, 2.6, -ROOM_D / 2 + 0.25);
    scene.add(tv);
    return;
  }

  if (roomType === 'business') {
    place(counter(wood, dark, 6.4), 'Стойка управления', 0, -4.4);
    place(fridge(dark), 'Холодильник', -7.2, -1.2);
    place(terminal(dark, 0x3fd88a), 'Касса-терминал', 6.8, 1.6);
    place(shelf(wood, 4), 'Склад', -7.2, 2.8);
    place(roundTable(wood, dark, 1), 'Стол — задачи', 4.6, -1.2);
    place(plant(0.9), 'Растение', 7.4, -5.2);
    for (let i = 0; i < 3; i += 1) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 1.1),
        standardMaterial({ map: t.brick, color: 0xc79a63, roughness: 0.85 })
      );
      box.position.set(-5.6 + i * 1.25, 0.55, 4.6);
      shadow(box);
      scene.add(box);
    }
    return;
  }

  // fallback: generic lobby
  place(desk(wood, dark), 'Стойка администратора', -3.5, -4.4);
  place(sofa(fabric), 'Диван для ожидания', 4.2, -3.2);
  place(plant(), 'Растение', -7.2, -5.2);
}
