// Top HUD: players strip + current player summary + dice.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatMoney } from '../game/rng';
import { netWorth } from '../game/state';
import { Meter } from './primitives';

export default function Hud({ state, onOpenPlayers, onOpenLog }) {
  const players = state.players;
  const active = players[state.current];
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        pointerEvents="box-none"
      >
        {players.map((p, i) => {
          const isActive = i === state.current;
          return (
            <Pressable
              key={p.id}
              onPress={onOpenPlayers}
              style={[styles.card, isActive && { borderColor: p.color }]}
            >
              <LinearGradient
                colors={
                  isActive
                    ? [`${p.color}44`, 'rgba(10,14,26,0.92)']
                    : ['rgba(30,38,60,0.85)', 'rgba(12,16,28,0.9)']
                }
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardHead}>
                <Text style={styles.avatar}>{p.avatar}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.money} numberOfLines={1}>
                    {formatMoney(p.money)}
                  </Text>
                </View>
                {p.bankrupt ? <Text style={styles.bankrupt}>💀</Text> : null}
              </View>
              <View style={styles.cardFoot}>
                <Text style={styles.small}>💼 {p.career ? 'есть' : '—'}</Text>
                <Text style={styles.small}>🏠 {p.properties.length}</Text>
                <Text style={styles.small}>🏪 {p.businesses.length}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.bar} pointerEvents="box-none">
        <View style={styles.barLeft}>
          <Text style={styles.turnLabel}>
            Ход: <Text style={{ color: active.color }}>{active.name}</Text>
          </Text>
          <Text style={styles.meta}>
            {state.year} г. · {active.age.toFixed(1)} лет · капитал {formatMoney(netWorth(active))}
          </Text>
        </View>
        <View style={styles.meters}>
          <View style={styles.meterCol}>
            <Meter value={active.happiness} color="#ffd166" compact />
            <Text style={styles.meterCap}>😊</Text>
          </View>
          <View style={styles.meterCol}>
            <Meter value={active.health} color="#3fd88a" compact />
            <Text style={styles.meterCap}>❤️</Text>
          </View>
        </View>
        <Pressable onPress={onOpenLog} style={styles.logBtn}>
          <Text style={styles.logBtnText}>📜</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  strip: { gap: 8, paddingHorizontal: 10, paddingTop: 6 },
  card: {
    width: 132,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.2)',
    padding: 8,
    gap: 6,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { fontSize: 18 },
  name: { color: '#eaf3ff', fontSize: 11.5, fontWeight: '800' },
  money: { color: '#8cffb0', fontSize: 11.5, fontWeight: '900' },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { color: 'rgba(200,220,255,0.7)', fontSize: 9.5, fontWeight: '700' },
  bankrupt: { fontSize: 12 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(10,14,26,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.16)',
  },
  barLeft: { flex: 1 },
  turnLabel: { color: '#eaf3ff', fontSize: 12, fontWeight: '800' },
  meta: { color: 'rgba(190,210,240,0.65)', fontSize: 9.5, marginTop: 1 },
  meters: { flexDirection: 'row', gap: 6, width: 96 },
  meterCol: { flex: 1, gap: 2 },
  meterCap: { fontSize: 8, textAlign: 'right' },
  logBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: { fontSize: 13 },
});
