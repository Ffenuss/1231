// Game log + settings menu + game over screen.
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import GameModal, { ActionBtn } from './GameModal';
import { Btn, Chip, SectionTitle } from './primitives';
import { formatMoney } from '../game/rng';
import { netWorth } from '../game/state';

const KIND_COLORS = { good: '#8cffb0', bad: '#ff9db0', info: '#8fb4ff' };

export function LogModal({ visible, state, onClose }) {
  return (
    <GameModal visible={visible} title="Журнал событий" icon="📜" onClose={onClose}>
      {state.log.length === 0 ? <Text style={styles.empty}>Пока пусто</Text> : null}
      {state.log.map((l) => (
        <View key={l.id} style={styles.logRow}>
          <View style={[styles.logDot, { backgroundColor: KIND_COLORS[l.kind] || '#8fb4ff' }]} />
          <Text style={[styles.logText, { color: KIND_COLORS[l.kind] || '#dce8ff' }]}>{l.text}</Text>
        </View>
      ))}
    </GameModal>
  );
}

export function MenuModal({
  visible,
  onClose,
  onSave,
  onExit,
  onNewGame,
  audio,
  music,
  onToggleAudio,
  onToggleMusic,
  cameraMode,
  onCameraMode,
  state,
}) {
  return (
    <GameModal visible={visible} title="Меню" icon="⚙️" onClose={onClose}>
      <SectionTitle>Настройки</SectionTitle>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>🔊 Звуки</Text>
        <Switch value={audio} onValueChange={onToggleAudio} trackColor={{ true: '#4f8cff', false: '#3a3f52' }} />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>🎵 Музыка</Text>
        <Switch value={music} onValueChange={onToggleMusic} trackColor={{ true: '#4f8cff', false: '#3a3f52' }} />
      </View>
      <SectionTitle>Камера</SectionTitle>
      <View style={styles.row}>
        {[
          { id: 'orbit', label: 'Обзор' },
          { id: 'close', label: 'Близко' },
          { id: 'top', label: 'Сверху' },
        ].map((c) => (
          <ActionBtn
            key={c.id}
            label={c.label}
            small
            tone={cameraMode === c.id ? 'gold' : 'ghost'}
            onPress={() => onCameraMode(c.id)}
          />
        ))}
      </View>
      <SectionTitle>Игра</SectionTitle>
      <View style={styles.row}>
        <ActionBtn label="Сохранить" icon="💾" small tone="success" onPress={onSave} />
        <ActionBtn label="Новая игра" icon="🔄" small tone="danger" onPress={onNewGame} />
      </View>
      <Btn label="Выйти в главное меню" icon="🚪" tone="ghost" onPress={onExit} />
      <Text style={styles.empty}>
        Ход {state.turn} · {state.year} год · игроков {state.players.length}
      </Text>
    </GameModal>
  );
}

export function GameOverModal({ visible, state, onRestart, onClose }) {
  const ranking = [...state.players].map((p) => ({ ...p, worth: netWorth(p) })).sort((a, b) => b.worth - a.worth);
  return (
    <GameModal
      visible={visible}
      title="Игра завершена"
      subtitle={`Победитель: ${ranking[0]?.name}`}
      icon="🏆"
      onClose={onClose}
      footer={<ActionBtn label="Новая игра" tone="gold" onPress={onRestart} />}
    >
      {ranking.map((p, i) => (
        <View key={p.id} style={[styles.rankRow, { borderColor: `${p.color}66` }]}>
          <Text style={styles.rankPlace}>{['🥇', '🥈', '🥉', '4️⃣'][i]}</Text>
          <Text style={styles.rankAvatar}>{p.avatar}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rankName, { color: p.color }]}>{p.name}</Text>
            <Text style={styles.rankSub}>
              {p.family.married ? '💍 ' : ''}
              {p.family.kids ? `👶${p.family.kids} ` : ''}
              🏠{p.properties.length} 🏪{p.businesses.length}
            </Text>
          </View>
          <Chip label={formatMoney(p.worth)} color="#ffd166" />
        </View>
      ))}
    </GameModal>
  );
}

const styles = StyleSheet.create({
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  logDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  logText: { flex: 1, fontSize: 11.5, lineHeight: 16 },
  empty: { color: 'rgba(190,215,255,0.55)', fontSize: 11 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { color: '#eaf3ff', fontSize: 12.5, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rankPlace: { fontSize: 20 },
  rankAvatar: { fontSize: 22 },
  rankName: { fontSize: 13, fontWeight: '900' },
  rankSub: { color: 'rgba(190,215,255,0.7)', fontSize: 10 },
});
