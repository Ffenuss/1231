// Core game state model. All functions are pure: they take state and return a new state
// plus a list of log entries / UI effects so the React layer can animate them.
import {
  START_MONEY,
  LOAN_LIMIT,
  LOAN_RATE_PER_YEAR,
  MIN_WORK_AGE,
  RETIRE_AGE,
  MAX_TURNS,
  PLAYER_COLORS,
} from './config';
import { TILES } from './board';
import {
  CAREER_BY_ID,
  BUSINESSES,
  PROPERTIES,
  STOCKS,
  EDU_LEVELS,
  EDU_COST,
  EVENTS,
  AVATARS,
  NAMES,
} from './data';
import { randInt, pick, chance, clamp } from './rng';

export const SAVE_VERSION = 3;

export function createPlayer(index, name, avatar) {
  return {
    id: index,
    name: name || NAMES[index % NAMES.length],
    avatar: avatar || AVATARS[index % AVATARS.length],
    color: PLAYER_COLORS[index],
    money: START_MONEY,
    debt: 0,
    pos: 0,
    age: 18,
    health: 100,
    happiness: 70,
    education: 'none',
    educationMonths: 0,
    educationTarget: null,
    career: null,
    careerLevel: 0,
    salary: 0,
    experience: 0,
    jobSearchCooldown: 0,
    properties: [],
    businesses: [],
    stocks: {},
    family: { married: false, partner: null, kids: 0 },
    jailTurns: 0,
    bonusTurns: 0,
    laps: 0,
    bankrupt: false,
    retired: false,
    isBot: false,
    totalEarned: 0,
    totalSpent: 0,
  };
}

export function createInitialState(playerConfigs) {
  return {
    version: SAVE_VERSION,
    phase: 'roll', // roll | moving | action | gameover
    players: playerConfigs.map((p, i) => createPlayer(i, p.name, p.avatar)),
    current: 0,
    turn: 0,
    dice: 0,
    log: [],
    stockPrices: STOCKS.reduce((a, s) => ((a[s.id] = s.base), a), {}),
    ownedTiles: {}, // tileIndex -> { type:'property'|'business', owner, level }
    lastEvent: null,
    pendingTile: null,
    winner: null,
    year: 1,
    month: 0,
    multiplayer: false,
  };
}

export function currentPlayer(state) {
  return state.players[state.current];
}

export function netWorth(player, state) {
  const propValue = player.properties.reduce((a, id) => a + (PROPERTIES[id]?.price || 0) * 0.85, 0);
  const bizValue = player.businesses.reduce((a, b) => a + (BUSINESSES[b.id]?.price || 0) * 0.9, 0);
  const stockValue = Object.entries(player.stocks).reduce((a, [id, qty]) => {
    const live = state && state.stockPrices ? state.stockPrices[id] : null;
    return a + qty * (live || STOCKS.find((s) => s.id === id)?.base || 0);
  }, 0);
  return player.money + propValue + bizValue + stockValue - player.debt;
}

export function log(state, text, kind = 'info') {
  const entry = { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, text, kind, turn: state.turn };
  state.log = [entry, ...state.log].slice(0, 60);
  return entry;
}

function addMoney(player, amount) {
  player.money += amount;
  if (amount > 0) player.totalEarned += amount;
  else player.totalSpent += -amount;
}

export function rollDice() {
  return randInt(1, 10);
}

// ---------------------------------------------------------------------------
// Turn flow
// ---------------------------------------------------------------------------

export function beginTurn(state) {
  const s = clone(state);
  const p = s.players[s.current];
  s.phase = 'roll';
  s.dice = 0;
  if (p.jailTurns > 0) {
    p.jailTurns -= 1;
    log(s, `${p.name} пропускает ход (тюрьма, осталось ${p.jailTurns})`, 'bad');
    s.phase = 'action';
    s.pendingTile = { type: 'jail', i: 12 };
  }
  if (p.bonusTurns > 0) p.bonusTurns -= 1;
  return s;
}

export function movePlayer(state, steps) {
  const s = clone(state);
  const p = s.players[s.current];
  const from = p.pos;
  let to = (from + steps) % TILES.length;
  let laps = 0;
  if (from + steps >= TILES.length) laps = 1;
  p.pos = to;
  if (laps) {
    p.laps += 1;
    const salary = p.salary || 0;
    const bonus = 1500 + p.laps * 150;
    addMoney(p, bonus + salary * 0.25);
    log(s, `${p.name} проходит круг: +$${Math.round(bonus + salary * 0.25)}`, 'good');
  }
  s.phase = 'action';
  s.pendingTile = { type: TILES[to].type, i: to };
  // rent for tiles owned by somebody else
  const own = s.ownedTiles[to];
  if (own && own.owner !== p.id) {
    const owner = s.players[own.owner];
    const def = own.type === 'property' ? PROPERTIES[own.id] : BUSINESSES[own.id];
    if (def && owner && !owner.bankrupt) {
      const rent = Math.round((def.rent || def.income * 0.35 || 0) * (1 + (own.level || 0) * 0.2));
      addMoney(p, -rent);
      addMoney(owner, rent);
      log(s, `${p.name} платит аренду $${rent} → ${owner.name}`, 'bad');
      s.lastRent = { from: p.id, to: owner.id, amount: rent };
    }
  }
  if (p.money < 0) {
    p.happiness = clamp(p.happiness - 6, 0, 100);
    log(s, `${p.name} уходит в минус: $${p.money}`, 'bad');
  }
  return s;
}

export function endTurn(state) {
  const s = clone(state);
  // passive monthly income / upkeep
  const p = s.players[s.current];
  // passive income: businesses pay out every 2nd turn, rent every turn
  let income = 0;
  if (s.turn % 2 === 0) {
    p.businesses.forEach((b) => {
      const def = BUSINESSES[b.id];
      if (!def) return;
      const profit = def.income * (1 + b.level * 0.35) - def.upkeep;
      income += Math.round(profit);
    });
  }
  p.properties.forEach((id) => {
    const def = PROPERTIES[id];
    if (def) income += Math.round(def.rent * 0.6);
  });
  // family upkeep
  const upkeep = p.family.kids * 450 + (p.family.married ? 300 : 0);
  if (upkeep) income -= upkeep;
  if (income) {
    addMoney(p, income);
    log(s, `${p.name}: пассивный доход $${income}`, income > 0 ? 'good' : 'bad');
  }
  // salary: paid every 2nd turn (a "month" of work), costs wellbeing
  if (p.salary > 0 && p.age >= MIN_WORK_AGE && !p.retired) {
    if (s.turn % 2 === 0) {
      addMoney(p, p.salary);
      log(s, `${p.name}: зарплата $${p.salary}`, 'good');
    }
    p.happiness = clamp(p.happiness - 0.35, 0, 100);
  } else if (!p.retired && p.age >= MIN_WORK_AGE && p.money < 2500) {
    addMoney(p, 700);
    log(s, `${p.name}: подработка $700`, 'info');
  }
  // loan interest
  if (p.debt > 0) {
    const interest = Math.round((p.debt * LOAN_RATE_PER_YEAR) / 12);
    p.debt += interest;
    log(s, `${p.name}: проценты по кредиту $${interest}`, 'bad');
  }
  // aging
  p.age += 1 / 12;
  if (p.age >= RETIRE_AGE && !p.retired) {
    p.retired = true;
    p.salary = 0;
    log(s, `${p.name} выходит на пенсию`, 'info');
  }
  // health / happiness drift
  p.health = clamp(p.health - (p.age > 50 ? 0.35 : 0.1) + (p.happiness > 70 ? 0.15 : 0), 0, 100);
  p.happiness = clamp(p.happiness - 0.25 + p.family.kids * 0.05, 0, 100);
  // distress: forced liquidation, then bankruptcy
  let guard = 0;
  while (p.money < -8000 && guard < 8) {
    guard += 1;
    if (p.properties.length) {
      const id = p.properties.shift();
      const tile = Object.keys(s.ownedTiles).find((t) => s.ownedTiles[t].owner === p.id && s.ownedTiles[t].id === id);
      const value = (tile && s.ownedTiles[tile].value) || PROPERTIES[id].price;
      if (tile) delete s.ownedTiles[tile];
      addMoney(p, Math.round(value * 0.7));
      log(s, `${p.name} продаёт ${PROPERTIES[id].name} для покрытия долгов`, 'bad');
    } else if (p.businesses.length) {
      const biz = p.businesses.shift();
      const tile = Object.keys(s.ownedTiles).find((t) => s.ownedTiles[t].owner === p.id && s.ownedTiles[t].id === biz.id);
      const value = (tile && s.ownedTiles[tile].value) || BUSINESSES[biz.id].price;
      if (tile) delete s.ownedTiles[tile];
      addMoney(p, Math.round(value * 0.7));
      log(s, `${p.name} продаёт бизнес ${BUSINESSES[biz.id].name}`, 'bad');
    } else if (Object.values(p.stocks).some((q) => q > 0)) {
      Object.entries(p.stocks).forEach(([id, qty]) => {
        if (qty > 0) {
          addMoney(p, qty * (s.stockPrices[id] || 0));
          p.stocks[id] = 0;
        }
      });
      log(s, `${p.name} продаёт акции для покрытия долгов`, 'bad');
    } else {
      break;
    }
  }
  if (p.money < -8000) {
    p.bankrupt = true;
    p.money = 0;
    log(s, `${p.name} объявляет банкротство`, 'bad');
  }
  // stock drift
  s.stockPrices = Object.entries(s.stockPrices).reduce((acc, [id, price]) => {
    const def = STOCKS.find((x) => x.id === id);
    const drift = (Math.random() - 0.51) * def.volatility * price;
    acc[id] = Math.max(5, Math.round(price + drift));
    return acc;
  }, {});
  // dividends: a small, capped cash flow on the portfolio
  Object.entries(p.stocks).forEach(([id, qty]) => {
    if (!qty) return;
    const price = s.stockPrices[id] || 0;
    const div = Math.round(qty * price * 0.006);
    if (div > 0) {
      addMoney(p, div);
      p.totalEarned += div;
    }
  });
  // property value appreciation (2% per turn, capped at 3x the base price)
  s.ownedTiles = Object.entries(s.ownedTiles).reduce((acc, [tile, own]) => {
    const next = { ...own };
    if (next.owner === p.id) {
      const base = next.type === 'property' ? PROPERTIES[next.id]?.price : BUSINESSES[next.id]?.price;
      if (base) next.value = Math.min(base * 3, Math.round((next.value || base) * 1.02));
    }
    acc[tile] = next;
    return acc;
  }, {});
  // education progress
  if (p.educationTarget) {
    p.educationMonths += 1;
    const target = EDU_COST[p.educationTarget];
    if (target && p.educationMonths >= target.months) {
      p.education = p.educationTarget;
      p.educationTarget = null;
      p.educationMonths = 0;
      log(s, `${p.name} завершает обучение: ${EDU_LEVELS.find((e) => e.id === p.education)?.name}`, 'good');
    }
  }
  if (p.jobSearchCooldown > 0) p.jobSearchCooldown -= 1;
  // advance turn
  s.turn += 1;
  s.month = (s.month + 1) % 12;
  if (s.month === 0) s.year += 1;
  s.current = nextActivePlayer(s, s.current);
  s.phase = 'roll';
  s.pendingTile = null;
  // end condition
  const alive = s.players.filter((pl) => !pl.bankrupt);
  if (s.turn >= MAX_TURNS || alive.length <= 1) {
    s.phase = 'gameover';
    s.winner = [...s.players].sort((a, b) => netWorth(b) - netWorth(a))[0];
    log(s, `Игра окончена. Победитель: ${s.winner.name}`, 'good');
  }
  return beginTurn(s);
}

function nextActivePlayer(state, from) {
  let idx = from;
  for (let k = 0; k < state.players.length; k += 1) {
    idx = (idx + 1) % state.players.length;
    if (!state.players[idx].bankrupt) return idx;
  }
  return from;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function takeLoan(state, amount) {
  const s = clone(state);
  const p = currentPlayer(s);
  const room = LOAN_LIMIT - p.debt;
  const real = Math.min(amount, room);
  if (real <= 0) return s;
  p.debt += real;
  addMoney(p, real);
  log(s, `${p.name} берёт кредит $${real}`, 'info');
  return s;
}

export function repayLoan(state, amount) {
  const s = clone(state);
  const p = currentPlayer(s);
  const real = Math.min(amount, p.debt, Math.max(0, p.money));
  if (real <= 0) return s;
  p.debt -= real;
  addMoney(p, -real);
  log(s, `${p.name} гасит кредит $${real}`, 'good');
  return s;
}

export function enrollEducation(state, level) {
  const s = clone(state);
  const p = currentPlayer(s);
  const def = EDU_COST[level];
  if (!def || p.educationTarget) return s;
  if (p.money < def.cost) return s;
  addMoney(p, -def.cost);
  p.educationTarget = level;
  p.educationMonths = 0;
  log(s, `${p.name} начинает обучение: ${def.title}`, 'info');
  return s;
}

export function applyForJob(state, careerId) {
  const s = clone(state);
  const p = currentPlayer(s);
  const career = CAREER_BY_ID[careerId];
  if (!career) return s;
  if (p.age < MIN_WORK_AGE) return s;
  const eduIdx = EDU_LEVELS.findIndex((e) => e.id === p.education);
  const reqIdx = EDU_LEVELS.findIndex((e) => e.id === career.edu);
  if (eduIdx < reqIdx) {
    log(s, `${p.name}: не хватает образования для «${career.name}»`, 'bad');
    return s;
  }
  const level = 1;
  const salary = Math.round(career.base * (1 + (eduIdx - reqIdx) * 0.25));
  p.career = careerId;
  p.careerLevel = level;
  p.salary = salary;
  p.experience = 0;
  log(s, `${p.name} устраивается: ${career.name} ($${salary}/мес)`, 'good');
  return s;
}

export function promote(state) {
  const s = clone(state);
  const p = currentPlayer(s);
  if (!p.career) return s;
  if (p.careerLevel >= 8) {
    log(s, `${p.name} уже на вершине карьеры`, 'info');
    return s;
  }
  p.careerLevel += 1;
  p.salary = Math.round(p.salary * 1.18 + 150);
  p.experience += 1;
  log(s, `${p.name} получает повышение: $${p.salary}/мес`, 'good');
  return s;
}

export function buyProperty(state, propertyId, tileIndex) {
  const s = clone(state);
  const p = currentPlayer(s);
  const def = PROPERTIES[propertyId];
  if (!def || p.money < def.price) return s;
  if (s.ownedTiles[tileIndex]) return s;
  addMoney(p, -def.price);
  p.properties.push(propertyId);
  s.ownedTiles[tileIndex] = { type: 'property', owner: p.id, id: propertyId };
  log(s, `${p.name} покупает ${def.name} за $${def.price}`, 'good');
  return s;
}

export function buyBusiness(state, bizId, tileIndex) {
  const s = clone(state);
  const p = currentPlayer(s);
  const def = BUSINESSES[bizId];
  if (!def || p.money < def.price) return s;
  if (s.ownedTiles[tileIndex]) return s;
  addMoney(p, -def.price);
  p.businesses.push({ id: bizId, level: 0, tile: tileIndex });
  s.ownedTiles[tileIndex] = { type: 'business', owner: p.id, id: bizId };
  log(s, `${p.name} открывает бизнес: ${def.name}`, 'good');
  return s;
}

export function upgradeBusiness(state, bizId) {
  const s = clone(state);
  const p = currentPlayer(s);
  const biz = p.businesses.find((b) => b.id === bizId);
  const def = BUSINESSES[bizId];
  if (!biz || !def) return s;
  const cost = Math.round(def.price * 0.4 * (biz.level + 1));
  if (p.money < cost || biz.level >= 5) return s;
  addMoney(p, -cost);
  biz.level += 1;
  log(s, `${p.name} улучшает ${def.name} до уровня ${biz.level}`, 'good');
  return s;
}

export function buyStock(state, stockId, qty) {
  const s = clone(state);
  const p = currentPlayer(s);
  const price = s.stockPrices[stockId];
  const cost = price * qty;
  if (p.money < cost) return s;
  addMoney(p, -cost);
  p.stocks[stockId] = (p.stocks[stockId] || 0) + qty;
  log(s, `${p.name} покупает ${qty} акций ${stockId.toUpperCase()}`, 'info');
  return s;
}

export function sellStock(state, stockId, qty) {
  const s = clone(state);
  const p = currentPlayer(s);
  const owned = p.stocks[stockId] || 0;
  const real = Math.min(qty, owned);
  if (real <= 0) return s;
  const price = s.stockPrices[stockId];
  p.stocks[stockId] = owned - real;
  addMoney(p, price * real);
  log(s, `${p.name} продаёт ${real} акций ${stockId.toUpperCase()}`, 'info');
  return s;
}

export function marry(state, partnerName) {
  const s = clone(state);
  const p = currentPlayer(s);
  if (p.family.married) return s;
  const cost = 3000;
  if (p.money < cost) return s;
  addMoney(p, -cost);
  p.family.married = true;
  p.family.partner = partnerName;
  p.happiness = clamp(p.happiness + 18, 0, 100);
  log(s, `${p.name} женится/выходит замуж за ${partnerName}`, 'good');
  return s;
}

export function haveChild(state) {
  const s = clone(state);
  const p = currentPlayer(s);
  if (!p.family.married || p.family.kids >= 3) return s;
  const cost = 5000;
  if (p.money < cost) return s;
  addMoney(p, -cost);
  p.family.kids += 1;
  p.happiness = clamp(p.happiness + 12, 0, 100);
  log(s, `${p.name}: в семье пополнение! Детей: ${p.family.kids}`, 'good');
  return s;
}

export function applyEvent(state, forcedEvent) {
  const s = clone(state);
  const p = currentPlayer(s);
  const ev = forcedEvent || pick(EVENTS);
  addMoney(p, ev.money);
  p.happiness = clamp(p.happiness + (ev.money > 0 ? 5 : -4), 0, 100);
  s.lastEvent = ev;
  log(s, `${p.name}: ${ev.text} (${ev.money > 0 ? '+' : ''}$${Math.abs(ev.money)})`, ev.money > 0 ? 'good' : 'bad');
  return s;
}

export function goToJail(state, turns = 2) {
  const s = clone(state);
  const p = currentPlayer(s);
  p.jailTurns = turns;
  p.pos = 12;
  log(s, `${p.name} отправляется в тюрьму на ${turns} хода`, 'bad');
  return s;
}

export function payTax(state) {
  const s = clone(state);
  const p = currentPlayer(s);
  const tax = Math.max(400, Math.round(p.money * 0.06 + p.properties.length * 250));
  addMoney(p, -tax);
  log(s, `${p.name} платит налог $${tax}`, 'bad');
  return s;
}

export function entertain(state, cost, happiness) {
  const s = clone(state);
  const p = currentPlayer(s);
  if (p.money < cost) return s;
  addMoney(p, -cost);
  p.happiness = clamp(p.happiness + happiness, 0, 100);
  p.health = clamp(p.health + 2, 0, 100);
  log(s, `${p.name} отдыхает (-$${cost}, +${happiness} счастья)`, 'good');
  return s;
}

export function casinoResult(state, delta, note) {
  const s = clone(state);
  const p = currentPlayer(s);
  addMoney(p, delta);
  log(s, `${p.name}: ${note} (${delta >= 0 ? '+' : ''}$${Math.abs(delta)})`, delta >= 0 ? 'good' : 'bad');
  return s;
}

export function finishAction(state) {
  const s = clone(state);
  s.phase = 'end';
  return s;
}

// Sell a property or business back to the market for 70% of its current value.
export function sellAsset(state, kind, id) {
  const s = clone(state);
  const p = currentPlayer(s);
  if (kind === 'property') {
    const idx = p.properties.indexOf(id);
    if (idx < 0) return s;
    p.properties.splice(idx, 1);
    const tile = Object.keys(s.ownedTiles).find((t) => s.ownedTiles[t].owner === p.id && s.ownedTiles[t].id === id);
    const value = (tile && s.ownedTiles[tile].value) || PROPERTIES[id].price;
    if (tile) delete s.ownedTiles[tile];
    addMoney(p, Math.round(value * 0.7));
    log(s, `${p.name} продаёт ${PROPERTIES[id].name} за $${Math.round(value * 0.7)}`, 'info');
  } else {
    const idx = p.businesses.findIndex((b) => b.id === id);
    if (idx < 0) return s;
    const [biz] = p.businesses.splice(idx, 1);
    const tile = Object.keys(s.ownedTiles).find((t) => s.ownedTiles[t].owner === p.id && s.ownedTiles[t].id === id);
    const value = (tile && s.ownedTiles[tile].value) || BUSINESSES[id].price;
    if (tile) delete s.ownedTiles[tile];
    addMoney(p, Math.round(value * 0.7));
    log(s, `${p.name} продаёт бизнес ${BUSINESSES[id].name} за $${Math.round(value * 0.7)}`, 'info');
  }
  return s;
}

// Buy the tile the player is standing on when it is owned by somebody else.
export function buyOutTile(state, tileIndex) {
  const s = clone(state);
  const p = currentPlayer(s);
  const own = s.ownedTiles[tileIndex];
  if (!own || own.owner === p.id) return s;
  const def = own.type === 'property' ? PROPERTIES[own.id] : BUSINESSES[own.id];
  if (!def) return s;
  const price = Math.round((own.value || def.price) * 1.25);
  if (p.money < price) return s;
  const owner = s.players[own.owner];
  addMoney(p, -price);
  addMoney(owner, price);
  s.ownedTiles[tileIndex] = { ...own, owner: p.id };
  if (own.type === 'property') {
    const i = owner.properties.indexOf(own.id);
    if (i >= 0) owner.properties.splice(i, 1);
    p.properties.push(own.id);
  } else {
    const i = owner.businesses.findIndex((b) => b.id === own.id);
    if (i >= 0) owner.businesses.splice(i, 1);
    p.businesses.push({ id: own.id, level: own.level || 0, tile: tileIndex });
  }
  log(s, `${p.name} выкупает ${def.name} у ${owner.name} за $${price}`, 'good');
  return s;
}

export function clone(state) {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      properties: [...p.properties],
      businesses: p.businesses.map((b) => ({ ...b })),
      stocks: { ...p.stocks },
      family: { ...p.family },
    })),
    log: [...state.log],
    stockPrices: { ...state.stockPrices },
    ownedTiles: { ...state.ownedTiles },
  };
}

export function ranking(state) {
  return [...state.players]
    .map((p) => ({ ...p, worth: netWorth(p) }))
    .sort((a, b) => b.worth - a.worth);
}

export function randomCareerFor(player) {
  const eduIdx = EDU_LEVELS.findIndex((e) => e.id === player.education);
  const options = Object.values(CAREER_BY_ID).filter(
    (c) => EDU_LEVELS.findIndex((e) => e.id === c.edu) <= eduIdx
  );
  return pick(options.length ? options : Object.values(CAREER_BY_ID)).id;
}

export function maybeRandomEvent(chanceValue = 0.35) {
  return chance(chanceValue);
}
