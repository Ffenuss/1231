// Bank & investment panel: loans, deposits, portfolio summary.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameModal, { ActionBtn } from './GameModal';
import { Btn, Chip, Meter, SectionTitle } from './primitives';
import { LOAN_LIMIT } from '../game/config';
import { formatMoney } from '../game/rng';
import { netWorth } from '../game/state';
import { STOCKS } from '../game/data';

export default function BankModal({ visible, player, state, onClose, actions }) {
  const room = LOAN_LIMIT - player.debt;
  const portfolio = Object.entries(player.stocks)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ def: STOCKS.find((s) => s.id === id), qty, price: state.stockPrices[id] }));
  const portfolioValue = portfolio.reduce((a, p) => a + p.qty * p.price, 0);

  return (
    <GameModal
      visible={visible}
      title="Банк «Капитал»"
      subtitle={`Капитал: ${formatMoney(netWorth(player))}`}
      icon="🏦"
      onClose={onClose}
      wide
    >
      <View style={styles.grid}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Наличные</Text>
          <Text style={styles.statValue}>{formatMoney(player.money)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Кредит</Text>
          <Text style={[styles.statValue, { color: '#ff9db0' }]}>{formatMoney(player.debt)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Портфель</Text>
          <Text style={styles.statValue}>{formatMoney(portfolioValue)}</Text>
        </View>
      </View>

      <Meter label="Кредитный лимит" value={player.debt} max={LOAN_LIMIT} color="#ff9db0" />
      <Text style={styles.hint}>Доступно для займа: {formatMoney(room)} · ставка 12% годовых (1% в месяц)</Text>

      <SectionTitle>Кредит</SectionTitle>
      <View style={styles.row}>
        <ActionBtn label="+$5K" small tone="danger" disabled={room < 5000} onPress={() => actions.loan(5000)} />
        <ActionBtn label="+$15K" small tone="danger" disabled={room < 15000} onPress={() => actions.loan(15000)} />
        <ActionBtn label="Всё" small tone="danger" disabled={room <= 0} onPress={() => actions.loan(room)} />
      </View>
      <View style={styles.row}>
        <ActionBtn
          label="Погасить $5K"
          small
          tone="success"
          disabled={player.debt <= 0 || player.money < 5000}
          onPress={() => actions.repay(5000)}
        />
        <ActionBtn
          label="Погасить всё"
          small
          tone="success"
          disabled={player.debt <= 0}
          onPress={() => actions.repay(player.debt)}
        />
      </View>

      <SectionTitle>Портфель</SectionTitle>
      {portfolio.length === 0 ? (
        <Text style={styles.hint}>Акций нет. Купите их в разделе «Активы → Акции».</Text>
      ) : (
        portfolio.map((p) => (
          <View key={p.def.id} style={styles.holding}>
            <View style={[styles.dot, { backgroundColor: p.def.color }]} />
            <Text style={styles.holdingName}>{p.def.name}</Text>
            <Chip label={`${p.qty} шт`} color="#8fb4ff" />
            <Chip label={formatMoney(p.qty * p.price)} color="#8cffb0" />
          </View>
        ))
      )}

      <Btn label="Открыть биржу" icon="📈" tone="purple" onPress={() => actions.open('invest')} />
    </GameModal>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 9,
    gap: 2,
  },
  statLabel: { color: 'rgba(190,215,255,0.65)', fontSize: 9.5, fontWeight: '700' },
  statValue: { color: '#eaf3ff', fontSize: 13, fontWeight: '900' },
  hint: { color: 'rgba(190,215,255,0.6)', fontSize: 10.5, lineHeight: 15 },
  row: { flexDirection: 'row', gap: 8 },
  holding: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  holdingName: { flex: 1, color: '#eaf3ff', fontSize: 12, fontWeight: '700' },
});
