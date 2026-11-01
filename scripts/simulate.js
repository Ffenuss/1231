// Headless rules simulation: plays full games with simple bots to catch crashes / balance bugs.
// Run: npx sucrase-node scripts/simulate.js
const G = require('../src/game/state');
const { TILES } = require('../src/game/board');
const { PROPERTIES, BUSINESSES, CAREERS, NAMES } = require('../src/game/data');

function botTurn(state) {
  let s = G.clone(state);
  const p = s.players[s.current];
  // roll
  const v = G.rollDice();
  s.dice = v;
  s = G.movePlayer(s, v);
  const tile = TILES[p.pos];
  // act on the tile
  if (!p.career && p.age >= 16) {
    const affordable = CAREERS.filter((c) => c.edu === 'none');
    s = G.applyForJob(s, affordable[Math.floor(Math.random() * affordable.length)].id);
  }
  if (tile.type === 'education' && !p.educationTarget) {
    const lvl = p.pos === 1 ? 'college' : 'university';
    s = G.enrollEducation(s, lvl);
  }
  if (tile.type === 'property') {
    const id = { 4: 'studio', 13: 'house', 17: 'penthouse' }[p.pos];
    if (id && p.money > PROPERTIES[id].price * 1.2) s = G.buyProperty(s, id, p.pos);
  }
  if (tile.type === 'business') {
    const id = { 8: 'coffee', 15: 'shop', 19: 'startup' }[p.pos];
    if (id && p.money > BUSINESSES[id].price * 1.2) s = G.buyBusiness(s, id, p.pos);
  }
  if (tile.type === 'event') s = G.applyEvent(s);
  if (tile.type === 'tax') s = G.payTax(s);
  if (tile.type === 'jail') s = G.goToJail(s, 2);
  if (tile.type === 'entertainment') s = G.entertain(s, 400, 8);
  if (tile.type === 'casino') s = G.casinoResult(s, Math.random() < 0.45 ? 1500 : -1000, 'ставка');
  if (tile.type === 'life' && !p.family.married && p.money > 6000) s = G.marry(s, NAMES[1]);
  if (p.career && Math.random() < 0.06 && p.careerLevel < 8) s = G.promote(s);
  if (p.money > 30000 && Math.random() < 0.4) s = G.buyStock(s, 'tech', 3);
  if (p.debt > 0 && p.money > 20000) s = G.repayLoan(s, 5000);
  if (p.money < 3000 && Math.random() < 0.5) s = G.takeLoan(s, 8000);
  return G.endTurn(s);
}

function runGame(playerCount) {
  const cfgs = Array.from({ length: playerCount }, (_, i) => ({ name: NAMES[i], avatar: '🧑' }));
  let s = G.createInitialState(cfgs);
  s = G.beginTurn(s);
  let guard = 0;
  while (s.phase !== 'gameover' && guard < 480) {
    s = botTurn(s);
    guard += 1;
    s.players.forEach((p) => {
      if (!Number.isFinite(p.money)) throw new Error(`money NaN for ${p.name}`);
      if (!Number.isFinite(p.age)) throw new Error(`age NaN for ${p.name}`);
      if (p.pos < 0 || p.pos >= TILES.length) throw new Error(`bad pos ${p.pos}`);
      if (!Number.isFinite(G.netWorth(p))) throw new Error('netWorth NaN');
    });
  }
  return { turns: s.turn, winner: s.winner && s.winner.name, ranking: G.ranking(s) };
}

let ok = 0;
for (let i = 0; i < 12; i += 1) {
  const n = 2 + (i % 3);
  const res = runGame(n);
  ok += 1;
  console.log(
    `game ${i + 1} (${n}p): turns=${res.turns} winner=${res.winner} ` +
      res.ranking.map((r) => `${r.name}:${Math.round(r.worth)}`).join(' ')
  );
}
console.log(`\nOK — ${ok} games simulated without errors`);
