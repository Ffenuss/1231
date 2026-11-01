// Casino: slots, roulette, dice and blackjack — all playable with real state changes.
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GameModal, { ActionBtn } from './GameModal';
import { Btn, Chip, SectionTitle } from './primitives';
import { CASINO_GAMES } from '../game/data';
import { formatMoney, randInt, pick, chance } from '../game/rng';

const SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣', '⭐'];
const PAYOUTS = { '🍒': 3, '🍋': 4, '🔔': 6, '💎': 10, '7️⃣': 20, '⭐': 8 };

export default function CasinoModal({ visible, player, onClose, onResult }) {
  const [game, setGame] = useState('slots');
  const [bet, setBet] = useState(500);
  const [reels, setReels] = useState(['🍒', '🍋', '🔔']);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [roulettePick, setRoulettePick] = useState('red');
  const [diceResult, setDiceResult] = useState(null);
  const [hand, setHand] = useState(null);
  const [deck, setDeck] = useState([]);
  const timer = useRef(null);

  const maxBet = Math.max(100, Math.floor(player.money / 4));

  const addBet = (d) => setBet((b) => Math.max(100, Math.min(maxBet, b + d)));

  const resolve = (delta, note) => {
    onResult(delta, note);
    setMessage(`${note} ${delta >= 0 ? '+' : ''}${formatMoney(delta)}`);
  };

  const spinSlots = () => {
    if (spinning || player.money < bet) return;
    setSpinning(true);
    setMessage('');
    let ticks = 0;
    timer.current = setInterval(() => {
      setReels([pick(SYMBOLS), pick(SYMBOLS), pick(SYMBOLS)]);
      ticks += 1;
      if (ticks > 12) {
        clearInterval(timer.current);
        const final = [pick(SYMBOLS), pick(SYMBOLS), pick(SYMBOLS)];
        setReels(final);
        setSpinning(false);
        let mult = 0;
        if (final[0] === final[1] && final[1] === final[2]) mult = PAYOUTS[final[0]] || 5;
        else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) mult = 1.6;
        const delta = mult > 0 ? Math.round(bet * (mult - 1)) : -bet;
        resolve(delta, mult > 0 ? `Слоты x${mult}` : 'Слоты: мимо');
      }
    }, 90);
  };

  const playRoulette = () => {
    if (player.money < bet) return;
    const n = randInt(0, 36);
    const red = n !== 0 && n % 2 === 1;
    let delta = -bet;
    let note = `Рулетка ${n}`;
    if (roulettePick === 'red' && red) {
      delta = bet;
      note += ' — красное!';
    } else if (roulettePick === 'black' && n !== 0 && !red) {
      delta = bet;
      note += ' — чёрное!';
    } else if (roulettePick === 'even' && n !== 0 && n % 2 === 0) {
      delta = bet;
      note += ' — чётное!';
    } else if (roulettePick === 'zero' && n === 0) {
      delta = bet * 35;
      note += ' — ЗЕРРО!';
    }
    resolve(delta, note);
  };

  const playDice = (over) => {
    if (player.money < bet) return;
    const a = randInt(1, 6);
    const b = randInt(1, 6);
    const sum = a + b;
    setDiceResult({ a, b, sum });
    const win = over ? sum > 7 : sum < 7;
    const delta = win ? bet : -bet;
    resolve(delta, `Кости ${a}+${b}=${sum} ${win ? '— выигрыш' : '— проигрыш'}`);
  };

  const newDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const cards = [];
    suits.forEach((s) => {
      for (let v = 2; v <= 10; v += 1) cards.push({ s, v });
      ['J', 'Q', 'K'].forEach((f) => cards.push({ s, v: 10, f }));
      cards.push({ s, v: 11, f: 'A' });
    });
    return cards.sort(() => Math.random() - 0.5);
  };

  const handValue = (cards) => {
    let total = cards.reduce((a, c) => a + c.v, 0);
    let aces = cards.filter((c) => c.f === 'A').length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return total;
  };

  const startBlackjack = () => {
    if (player.money < bet) return;
    const d = newDeck();
    setDeck(d.slice(4));
    setHand({ player: [d[0], d[2]], dealer: [d[1], d[3]], done: false });
    setMessage('');
  };

  const hit = () => {
    if (!hand || hand.done) return;
    const [card, ...rest] = deck;
    const next = { ...hand, player: [...hand.player, card] };
    setDeck(rest);
    if (handValue(next.player) > 21) {
      next.done = true;
      setHand(next);
      resolve(-bet, 'Блэкджек: перебор');
      return;
    }
    setHand(next);
  };

  const stand = () => {
    if (!hand || hand.done) return;
    let dealer = [...hand.dealer];
    let rest = [...deck];
    while (handValue(dealer) < 17) {
      dealer.push(rest[0]);
      rest = rest.slice(1);
    }
    const pv = handValue(hand.player);
    const dv = handValue(dealer);
    const next = { ...hand, dealer, done: true };
    setHand(next);
    setDeck(rest);
    if (dv > 21 || pv > dv) resolve(bet, `Блэкджек: выигрыш ${pv}:${dv}`);
    else if (pv === dv) resolve(0, `Блэкджек: ничья ${pv}:${dv}`);
    else resolve(-bet, `Блэкджек: проигрыш ${pv}:${dv}`);
  };

  const gameDef = useMemo(() => CASINO_GAMES.find((g) => g.id === game), [game]);

  return (
    <GameModal
      visible={visible}
      title="Казино «Золотой фламинго»"
      subtitle={`Баланс: ${formatMoney(player.money)}`}
      icon="🎰"
      onClose={onClose}
      wide
    >
      <View style={styles.tabs}>
        {CASINO_GAMES.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => {
              setGame(g.id);
              setMessage('');
            }}
            style={[styles.tab, game === g.id && styles.tabActive]}
          >
            <Text style={styles.tabIcon}>{g.icon}</Text>
            <Text style={[styles.tabLabel, game === g.id && { color: '#0b1020' }]}>{g.name}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.betRow}>
        <Text style={styles.betLabel}>Ставка</Text>
        <Btn label="−" small tone="ghost" onPress={() => addBet(-100)} style={{ width: 40 }} />
        <View style={styles.betValue}>
          <Text style={styles.betValueText}>{formatMoney(bet)}</Text>
        </View>
        <Btn label="+" small tone="ghost" onPress={() => addBet(100)} style={{ width: 40 }} />
        <Btn label="MAX" small tone="gold" onPress={() => setBet(maxBet)} style={{ width: 56 }} />
      </View>

      {game === 'slots' ? (
        <View style={{ gap: 10 }}>
          <View style={styles.reels}>
            {reels.map((r, i) => (
              <LinearGradient key={i} colors={['#2a1236', '#12061c']} style={styles.reel}>
                <Text style={styles.reelText}>{r}</Text>
              </LinearGradient>
            ))}
          </View>
          <Text style={styles.hint}>3 одинаковых — до x20 · 2 одинаковых — x1.6</Text>
          <Btn
            label={spinning ? 'Крутится…' : `Крутить (${formatMoney(bet)})`}
            icon="🎰"
            tone="danger"
            onPress={spinSlots}
            disabled={spinning || player.money < bet}
          />
        </View>
      ) : null}

      {game === 'roulette' ? (
        <View style={{ gap: 10 }}>
          <View style={styles.rouletteRow}>
            {[
              { id: 'red', label: 'Красное', color: '#e63946' },
              { id: 'black', label: 'Чёрное', color: '#22252e' },
              { id: 'even', label: 'Чётное', color: '#4f8cff' },
              { id: 'zero', label: 'Зерро x35', color: '#3fd88a' },
            ].map((o) => (
              <Pressable
                key={o.id}
                onPress={() => setRoulettePick(o.id)}
                style={[
                  styles.rouletteBtn,
                  { backgroundColor: o.color },
                  roulettePick === o.id && styles.rouletteActive,
                ]}
              >
                <Text style={styles.rouletteText}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
          <Btn
            label={`Крутить колесо (${formatMoney(bet)})`}
            icon="🎡"
            tone="danger"
            onPress={playRoulette}
            disabled={player.money < bet}
          />
        </View>
      ) : null}

      {game === 'dice' ? (
        <View style={{ gap: 10 }}>
          <View style={styles.diceRow}>
            <View style={styles.die}>
              <Text style={styles.dieText}>{diceResult ? diceResult.a : '?'}</Text>
            </View>
            <View style={styles.die}>
              <Text style={styles.dieText}>{diceResult ? diceResult.b : '?'}</Text>
            </View>
            <Text style={styles.sumText}>{diceResult ? `= ${diceResult.sum}` : ''}</Text>
          </View>
          <View style={styles.row}>
            <ActionBtn
              label="Меньше 7"
              tone="primary"
              small
              onPress={() => playDice(false)}
              disabled={player.money < bet}
            />
            <ActionBtn
              label="Больше 7"
              tone="purple"
              small
              onPress={() => playDice(true)}
              disabled={player.money < bet}
            />
          </View>
        </View>
      ) : null}

      {game === 'blackjack' ? (
        <View style={{ gap: 10 }}>
          {hand ? (
            <View style={{ gap: 8 }}>
              <SectionTitle>Дилер ({handValue(hand.dealer)})</SectionTitle>
              <View style={styles.cards}>
                {hand.dealer.map((c, i) => (
                  <View key={i} style={styles.card}>
                    <Text style={[styles.cardText, c.s === '♥' || c.s === '♦' ? { color: '#ff6b7d' } : null]}>
                      {c.f || c.v}
                      {c.s}
                    </Text>
                  </View>
                ))}
              </View>
              <SectionTitle>Вы ({handValue(hand.player)})</SectionTitle>
              <View style={styles.cards}>
                {hand.player.map((c, i) => (
                  <View key={i} style={styles.card}>
                    <Text style={[styles.cardText, c.s === '♥' || c.s === '♦' ? { color: '#ff6b7d' } : null]}>
                      {c.f || c.v}
                      {c.s}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.row}>
                <ActionBtn label="Взять" tone="primary" small onPress={hit} disabled={hand.done} />
                <ActionBtn label="Хватит" tone="gold" small onPress={stand} disabled={hand.done} />
              </View>
            </View>
          ) : (
            <Btn label={`Раздать (${formatMoney(bet)})`} icon="🃏" tone="danger" onPress={startBlackjack} />
          )}
        </View>
      ) : null}

      {message ? (
        <View style={styles.message}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
      <Chip label={`${gameDef.icon} ${gameDef.desc}`} color="#ff9db0" />
    </GameModal>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    gap: 2,
  },
  tabActive: { backgroundColor: '#ffd166' },
  tabIcon: { fontSize: 15 },
  tabLabel: { color: '#eaf3ff', fontSize: 9.5, fontWeight: '800' },
  betRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  betLabel: { color: 'rgba(200,220,255,0.75)', fontSize: 11, fontWeight: '700', width: 46 },
  betValue: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  betValueText: { color: '#ffd166', fontSize: 13, fontWeight: '900' },
  reels: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  reel: {
    width: 78,
    height: 78,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ff4dd2',
  },
  reelText: { fontSize: 38 },
  hint: { color: 'rgba(200,220,255,0.6)', fontSize: 10, textAlign: 'center' },
  rouletteRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  rouletteBtn: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rouletteActive: { borderColor: '#ffd166' },
  rouletteText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },
  diceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  die: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#faf7f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieText: { color: '#1a1a22', fontSize: 24, fontWeight: '900' },
  sumText: { color: '#ffd166', fontSize: 18, fontWeight: '900' },
  cards: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  card: {
    width: 40,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#faf7f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { color: '#1a1a22', fontSize: 13, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 8 },
  message: {
    backgroundColor: 'rgba(255,209,102,0.14)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.35)',
  },
  messageText: { color: '#ffe6a8', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
