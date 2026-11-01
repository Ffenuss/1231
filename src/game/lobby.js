// Lobby / room protocol on top of the raw relay.
// Messages (JSON text frames):
//   {type:'join', name, avatar}        client -> host   (relay forwards to host)
//   {type:'lobby', players:[...]}      host  -> all    (relay forwards to clients)
//   {type:'ready', id, ready}          client -> host
//   {type:'start'}                     host  -> all    (game begins)
//   {type:'state', state}              host  -> all    (authoritative snapshot)
//   {type:'action', action, from}      client -> host  (player intent)
//   {type:'leave', id}                 anyone -> all
export const LOBBY_MSG = {
  JOIN: 'join',
  LOBBY: 'lobby',
  READY: 'ready',
  START: 'start',
  STATE: 'state',
  ACTION: 'action',
  LEAVE: 'leave',
  PING: 'ping',
};

export function makeLobbyPlayer(id, name, avatar, isHost = false) {
  return { id, name, avatar, isHost, ready: isHost, online: true };
}

export function lobbySummary(players) {
  const total = players.length;
  const ready = players.filter((p) => p.ready).length;
  return { total, ready, canStart: total >= 2 && ready === total };
}
