// Minimal WebSocket relay for local-network multiplayer.
// Run on a computer in the same WiFi network:  node scripts/mp-server.js
// The host device connects as the authoritative state owner; clients receive snapshots.
const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.MP_PORT || 8787);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Жизнь и Бизнес — multiplayer relay. Подключайтесь по ws://<host-ip>:' + PORT + '\n');
});

const clients = new Set();
let lastState = null;

function encodeFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

// Returns { messages: [{opcode, data}], rest: Buffer } — rest holds a partial frame.
function decodeFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const b1 = buffer[offset];
    const b2 = buffer[offset + 1];
    const opcode = b1 & 0x0f;
    const masked = (b2 & 0x80) !== 0;
    let len = b2 & 0x7f;
    let pos = offset + 2;
    if (len === 126) {
      if (pos + 2 > buffer.length) break;
      len = buffer.readUInt16BE(pos);
      pos += 2;
    } else if (len === 127) {
      if (pos + 8 > buffer.length) break;
      len = Number(buffer.readBigUInt64BE(pos));
      pos += 8;
    }
    const maskLen = masked ? 4 : 0;
    if (pos + maskLen + len > buffer.length) break;
    const mask = masked ? buffer.slice(pos, pos + 4) : null;
    pos += maskLen;
    const data = Buffer.from(buffer.slice(pos, pos + len));
    if (mask) {
      for (let i = 0; i < data.length; i += 1) data[i] ^= mask[i % 4];
    }
    messages.push({ opcode, data: data.toString('utf8') });
    offset = pos + len;
  }
  return { messages, rest: buffer.slice(offset) };
}

function broadcast(text, except) {
  const frame = encodeFrame(text);
  clients.forEach((c) => {
    if (c !== except && !c.socket.destroyed) c.socket.write(frame);
  });
}

function sendToHost(text) {
  const frame = encodeFrame(text);
  clients.forEach((c) => {
    if (c.isHost && !c.socket.destroyed) c.socket.write(frame);
  });
}

function handleMessage(client, raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch (e) {
    return;
  }
  if (!msg || typeof msg.type !== 'string') return;
  if (msg.type === 'state') {
    // authoritative snapshot from the host
    lastState = msg.state;
    client.isHost = true;
    broadcast(raw, client);
  } else if (msg.type === 'lobby' || msg.type === 'start') {
    // host -> everyone else
    broadcast(raw, client);
  } else if (msg.type === 'action' || msg.type === 'join' || msg.type === 'ready' || msg.type === 'leave') {
    // client -> host only
    sendToHost(raw);
  }
}

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );

  const client = { socket, isHost: false, buffer: Buffer.alloc(0) };
  clients.add(client);
  console.log(`[mp] client connected (${clients.size} total)`);
  if (lastState) socket.write(encodeFrame(JSON.stringify({ type: 'state', state: lastState })));

  socket.on('data', (chunk) => {
    client.buffer = Buffer.concat([client.buffer, chunk]);
    const { messages, rest } = decodeFrames(client.buffer);
    client.buffer = rest;
    messages.forEach(({ opcode, data }) => {
      if (opcode === 0x8) {
        clients.delete(client);
        socket.end();
        return;
      }
      if (opcode === 0x1) handleMessage(client, data);
    });
  });

  socket.on('close', () => {
    clients.delete(client);
    console.log(`[mp] client disconnected (${clients.size} left)`);
  });
  socket.on('error', () => clients.delete(client));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mp] relay listening on ws://0.0.0.0:${PORT}`);
});
