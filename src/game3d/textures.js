// Procedurally generated textures (canvas 2D) used as maps for PBR-ish materials.
// Every texture is generated once and cached; resolution is kept modest for mobile GPUs.
export function createCanvas(w, h) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function noiseFill(ctx, w, h, base, amp) {
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i += 1) {
    const n = (Math.random() - 0.5) * amp;
    img.data[i * 4] = clamp255(base[0] + n);
    img.data[i * 4 + 1] = clamp255(base[1] + n);
    img.data[i * 4 + 2] = clamp255(base[2] + n);
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}

export function makeAsphalt(size = 256) {
  const c = createCanvas(size, size);
  if (!c) return null;
  const ctx = c.getContext('2d');
  noiseFill(ctx, size, size, [46, 48, 56], 34);
  // subtle cracks
  ctx.strokeStyle = 'rgba(20,20,26,0.5)';
  for (let i = 0; i < 14; i += 1) {
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k += 1) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  return c;
}

export function makeGrass(size = 256) {
  const c = createCanvas(size, size);
  if (!c) return null;
  const ctx = c.getContext('2d');
  noiseFill(ctx, size, size, [58, 104, 60], 40);
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(${90 + Math.random() * 60},${140 + Math.random() * 70},${70 + Math.random() * 50},0.5)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 3);
  }
  return c;
}

export function makeConcrete(size = 256) {
  const c = createCanvas(size, size);
  if (!c) return null;
  const ctx = c.getContext('2d');
  noiseFill(ctx, size, size, [176, 174, 168], 22);
  ctx.strokeStyle = 'rgba(120,118,112,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo((size / 4) * i, 0);
    ctx.lineTo((size / 4) * i, size);
    ctx.moveTo(0, (size / 4) * i);
    ctx.lineTo(size, (size / 4) * i);
    ctx.stroke();
  }
  return c;
}

export function makeBrick(size = 256) {
  const c = createCanvas(size, size);
  if (!c) return null;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a4b3a';
  ctx.fillRect(0, 0, size, size);
  const bh = size / 8;
  const bw = size / 4;
  for (let row = 0; row < 8; row += 1) {
    for (let col = -1; col < 5; col += 1) {
      const offset = row % 2 ? bw / 2 : 0;
      const x = col * bw + offset;
      const y = row * bh;
      const shade = 150 + Math.random() * 60;
      ctx.fillStyle = `rgb(${shade},${shade * 0.55},${shade * 0.42})`;
      ctx.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
    }
  }
  return c;
}

export function makeGlassFacade(size = 256) {
  const c = createCanvas(size, size);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#7fb8d8');
  grad.addColorStop(0.5, '#3d6f8f');
  grad.addColorStop(1, '#8fd0e8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(230,245,255,0.35)';
  ctx.lineWidth = 3;
  const step = size / 8;
  for (let i = 0; i <= 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }
  // random lit windows
  for (let i = 0; i < 26; i += 1) {
    ctx.fillStyle = `rgba(255,${210 + Math.random() * 40},${140 + Math.random() * 60},${0.35 + Math.random() * 0.5})`;
    const gx = Math.floor(Math.random() * 8) * step;
    const gy = Math.floor(Math.random() * 8) * step;
    ctx.fillRect(gx + 3, gy + 3, step - 6, step - 6);
  }
  return c;
}

export function makeMarble(size = 256) {
  const c = createCanvas(size, size);
  if (!c) return null;
  const ctx = c.getContext('2d');
  noiseFill(ctx, size, size, [232, 230, 226], 14);
  ctx.strokeStyle = 'rgba(150,150,160,0.35)';
  for (let i = 0; i < 24; i += 1) {
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k += 1) {
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.lineWidth = Math.random() * 1.6;
    ctx.stroke();
  }
  return c;
}

export function makeTileLabel(text, color, icon) {
  const c = createCanvas(256, 256);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#20263a');
  grad.addColorStop(1, '#11141f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 246);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(16, 16, 224, 224);
  ctx.font = 'bold 92px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, 128, 96);
  ctx.fillStyle = color;
  ctx.font = 'bold 30px sans-serif';
  const words = String(text).split(' ');
  if (words.length > 1 && text.length > 9) {
    ctx.fillText(words[0], 128, 168);
    ctx.fillText(words.slice(1).join(' '), 128, 202);
  } else {
    ctx.fillText(text, 128, 186);
  }
  return c;
}

export function makeRoughnessNoise(size = 128) {
  const c = createCanvas(size, size);
  if (!c) return null;
  const ctx = c.getContext('2d');
  noiseFill(ctx, size, size, [140, 140, 140], 120);
  return c;
}
