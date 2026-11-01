// Local-network multiplayer over WebSocket.
// Host: runs a tiny authoritative relay (scripts/mp-server.js) and broadcasts snapshots.
// Client: connects to the host URL, receives snapshots, sends its own actions.
import { Platform } from 'react-native';
import { LOBBY_MSG } from './lobby';

const DEFAULT_PORT = 8787;

export function createMultiplayer() {
  return {
    role: null, // 'host' | 'client'
    url: null,
    socket: null,
    connected: false,
    playerId: null,
    onSnapshot: null,
    onStatus: null,
    onLobby: null,
    onJoin: null,
    onReady: null,
    onStart: null,
    stop: false,
  };
}

function rawSend(mp, msg) {
  if (!mp.socket || mp.socket.readyState !== 1) return false;
  try {
    mp.socket.send(JSON.stringify(msg));
    return true;
  } catch (e) {
    return false;
  }
}

function openSocket(url, handlers) {
  if (typeof WebSocket === 'undefined') return null;
  let ws;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    return null;
  }
  ws.onopen = () => handlers.onOpen && handlers.onOpen();
  ws.onclose = () => handlers.onClose && handlers.onClose();
  ws.onerror = () => handlers.onError && handlers.onError();
  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      handlers.onMessage && handlers.onMessage(msg);
    } catch (e) {
      /* ignore malformed frames */
    }
  };
  return ws;
}

export function hostUrl(host = 'localhost') {
  return `ws://${host}:${DEFAULT_PORT}`;
}

// Host side: connect to the local relay so remote clients can receive the state.
export async function startHost(mp, getState) {
  mp.role = 'host';
  mp.stop = false;
  mp.url = hostUrl('localhost');
  mp.socket = openSocket(mp.url, {
    onOpen: () => {
      mp.connected = true;
      if (mp.onStatus) mp.onStatus('host-online');
    },
    onClose: () => {
      mp.connected = false;
      if (mp.onStatus) mp.onStatus('host-offline');
    },
    onMessage: (msg) => {
      // clients ask the host to apply an action / join / toggle readiness
      if (msg.type === LOBBY_MSG.ACTION && mp.onAction) mp.onAction(msg.action, msg.from);
      if (msg.type === LOBBY_MSG.JOIN && mp.onJoin) mp.onJoin(msg);
      if (msg.type === LOBBY_MSG.READY && mp.onReady) mp.onReady(msg);
      if (msg.type === LOBBY_MSG.LEAVE && mp.onLeave) mp.onLeave(msg);
    },
  });
  return { role: 'host', url: mp.url };
}

// Host -> all clients: the player list with readiness flags.
export function publishLobby(mp, players) {
  return rawSend(mp, { type: LOBBY_MSG.LOBBY, players });
}

// Host -> all clients: the game is starting.
export function startBroadcast(mp) {
  return rawSend(mp, { type: LOBBY_MSG.START });
}

// Client -> host: announce myself and my readiness.
export function sendJoin(mp, player) {
  mp.playerId = player.id;
  return rawSend(mp, { type: LOBBY_MSG.JOIN, ...player });
}

export function sendReady(mp, ready) {
  return rawSend(mp, { type: LOBBY_MSG.READY, id: mp.playerId, ready });
}

export function sendLeave(mp) {
  return rawSend(mp, { type: LOBBY_MSG.LEAVE, id: mp.playerId });
}

// Host pushes the authoritative state after every change.
export function publishSnapshot(mp, state) {
  if (!mp.socket || mp.socket.readyState !== 1) return false;
  try {
    mp.socket.send(JSON.stringify({ type: 'state', state }));
    return true;
  } catch (e) {
    return false;
  }
}

export async function joinRoom(mp, url, onSnapshot) {
  mp.role = 'client';
  mp.url = (url || hostUrl('localhost')).replace(/\/$/, '');
  mp.onSnapshot = onSnapshot;
  mp.stop = false;
  mp.socket = openSocket(mp.url, {
    onOpen: () => {
      mp.connected = true;
      if (mp.onStatus) mp.onStatus('client-online');
    },
    onClose: () => {
      mp.connected = false;
      if (mp.onStatus) mp.onStatus('client-offline');
    },
    onMessage: (msg) => {
      if (msg.type === LOBBY_MSG.STATE && mp.onSnapshot) mp.onSnapshot(msg.state);
      if (msg.type === LOBBY_MSG.LOBBY && mp.onLobby) mp.onLobby(msg.players || []);
      if (msg.type === LOBBY_MSG.START && mp.onStart) mp.onStart();
    },
  });
  return !!mp.socket;
}

export async function sendAction(mp, action) {
  if (!mp.socket || mp.socket.readyState !== 1) return false;
  try {
    mp.socket.send(JSON.stringify({ type: 'action', action, from: mp.playerId }));
    return true;
  } catch (e) {
    return false;
  }
}

export function stopMultiplayer(mp) {
  mp.stop = true;
  try {
    if (mp.socket) mp.socket.close();
  } catch (e) {
    /* ignore */
  }
  mp.socket = null;
  mp.connected = false;
}

export function localIpHint() {
  return Platform.OS === 'web'
    ? 'Хост: запустите `node scripts/mp-server.js`, затем подключитесь по ws://<IP-хоста>:8787'
    : 'Хост: запустите `node scripts/mp-server.js` на компьютере в той же WiFi, подключитесь по ws://<IP>:8787';
}
