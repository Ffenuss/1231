// Bottom action bar: roll dice, open panels, end turn.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Btn } from './primitives';

const ACTIONS = [
  { id: 'career', label: 'Карьера', icon: '💼' },
  { id: 'edu', label: 'Учёба', icon: '🎓' },
  { id: 'property', label: 'Активы', icon: '🏠' },
  { id: 'bank', label: 'Банк', icon: '🏦' },
  { id: 'family', label: 'Семья', icon: '💕' },
  { id: 'casino', label: 'Казино', icon: '🎰' },
  { id: 'menu', label: 'Меню', icon: '⚙️' },
];

export default function ActionBar({ state, onRoll, onAction, onEndTurn, busy }) {
  const p = state.players[state.current];
  const canRoll = state.phase === 'roll' && !busy && p.jailTurns === 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={canRoll ? onRoll : undefined}
          style={({ pressed }) => [styles.rollBtn, pressed && canRoll && { transform: [{ scale: 0.96 }] }]}
        >
          <LinearGradient
            colors={canRoll ? ['#ffd166', '#e08b1a'] : ['#3a3f52', '#262a36']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.rollIcon}>🎲</Text>
          <View>
            <Text style={styles.rollLabel}>{state.dice ? `Выпало ${state.dice}` : 'Крутить'}</Text>
            <Text style={styles.rollSub}>1 – 10</Text>
          </View>
        </Pressable>
        <Btn
          label="Завершить ход"
          icon="➡️"
          tone="success"
          onPress={onEndTurn}
          disabled={state.phase === 'roll' || busy}
          style={{ flex: 1 }}
        />
      </View>
      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <Pressable key={a.id} onPress={() => onAction(a.id)} style={styles.action}>
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 6,
    gap: 8,
    backgroundColor: 'rgba(6,9,18,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(140,180,255,0.14)',
  },
  row: { flexDirection: 'row', gap: 8 },
  rollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
    minWidth: 132,
    justifyContent: 'center',
  },
  rollIcon: { fontSize: 22 },
  rollLabel: { color: '#1a1206', fontSize: 14, fontWeight: '900' },
  rollSub: { color: 'rgba(40,25,0,0.7)', fontSize: 9.5, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.14)',
    gap: 2,
  },
  actionIcon: { fontSize: 15 },
  actionLabel: { color: 'rgba(220,235,255,0.85)', fontSize: 8.5, fontWeight: '700' },
});
