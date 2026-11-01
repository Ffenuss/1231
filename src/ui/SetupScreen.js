// Setup screen: choose players (2-4), names, avatars, start / continue / multiplayer.
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Btn, Panel } from './primitives';
import { AVATARS, NAMES } from '../game/data';
import { PLAYER_COLORS } from '../game/config';

export default function SetupScreen({ onStart, onContinue, hasSave, onMultiplayer, multiplayerInfo }) {
  const [count, setCount] = useState(2);
  const [players, setPlayers] = useState(
    [0, 1, 2, 3].map((i) => ({ name: NAMES[i], avatar: AVATARS[i], bot: i > 0 }))
  );
  const [allBots, setAllBots] = useState(false);

  const update = (i, patch) => {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const start = () => {
    const cfg = players.slice(0, count).map((p, i) => ({
      name: p.name || NAMES[i],
      avatar: p.avatar,
      isBot: allBots ? false : p.bot,
    }));
    onStart(cfg);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0a0f1e', '#131a33', '#2a1440']} style={StyleSheet.absoluteFill} />
      <View style={styles.aurora1} />
      <View style={styles.aurora2} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Жизнь и Бизнес</Text>
          <Text style={styles.subtitle}>3D-симулятор жизни, карьеры и капитала</Text>
          <View style={styles.heroChips}>
            <Text style={styles.heroChip}>🎲 24 клетки</Text>
            <Text style={styles.heroChip}>🏙️ 3D-город</Text>
            <Text style={styles.heroChip}>👥 2–4 игрока</Text>
          </View>
        </View>

        <Panel style={{ marginBottom: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Игроков</Text>
            <View style={styles.counter}>
              {[2, 3, 4].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setCount(n)}
                  style={[styles.counterBtn, count === n && styles.counterBtnActive]}
                >
                  <Text style={[styles.counterText, count === n && { color: '#0b1020' }]}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={[styles.rowBetween, { marginTop: 10 }]}>
            <Text style={styles.label}>Все игроки — люди (хотсит)</Text>
            <Switch
              value={allBots}
              onValueChange={setAllBots}
              trackColor={{ true: '#4f8cff', false: '#3a3f52' }}
              thumbColor="#fff"
            />
          </View>
        </Panel>

        {players.slice(0, count).map((p, i) => (
          <Panel key={i} style={{ marginBottom: 10 }}>
            <View style={styles.playerRow}>
              <View style={[styles.colorDot, { backgroundColor: PLAYER_COLORS[i] }]} />
              <TextInput
                value={p.name}
                onChangeText={(t) => update(i, { name: t })}
                placeholder={`Игрок ${i + 1}`}
                placeholderTextColor="rgba(200,220,255,0.4)"
                style={styles.input}
                maxLength={14}
              />
              {!allBots ? (
                <Pressable
                  onPress={() => update(i, { bot: !p.bot })}
                  style={[styles.botToggle, p.bot && styles.botToggleOn]}
                >
                  <Text style={styles.botText}>{p.bot ? '🤖 Бот' : '🧑 Игрок'}</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatars}>
              {AVATARS.map((a) => (
                <Pressable
                  key={a}
                  onPress={() => update(i, { avatar: a })}
                  style={[styles.avatarBtn, p.avatar === a && { borderColor: PLAYER_COLORS[i], borderWidth: 2 }]}
                >
                  <Text style={styles.avatarText}>{a}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Panel>
        ))}

        <Btn label="Начать новую игру" icon="▶️" tone="gold" onPress={start} style={{ marginTop: 6 }} />
        {hasSave ? (
          <Btn
            label="Продолжить сохранение"
            icon="💾"
            tone="ghost"
            onPress={onContinue}
            style={{ marginTop: 8 }}
          />
        ) : null}
        <Btn
          label="Мультиплеер (локальная сеть)"
          icon="📡"
          tone="purple"
          onPress={onMultiplayer}
          style={{ marginTop: 8 }}
        />
        {multiplayerInfo ? <Text style={styles.mpInfo}>{multiplayerInfo}</Text> : null}
        <Text style={styles.footnote}>
          Совет: откройте приложение в Expo Go на телефоне — тот же код, нативный рендер 3D.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0f1e' },
  aurora1: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(80,140,255,0.18)',
  },
  aurora2: {
    position: 'absolute',
    bottom: -140,
    right: -90,
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: 'rgba(200,80,255,0.16)',
  },
  content: { padding: 16, paddingTop: 46, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 18 },
  logo: { width: 84, height: 84, borderRadius: 22, marginBottom: 10 },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(90,150,255,0.65)',
    textShadowRadius: 18,
  },
  subtitle: { color: 'rgba(190,215,255,0.8)', fontSize: 12.5, marginTop: 4 },
  heroChips: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  heroChip: {
    color: 'rgba(220,235,255,0.9)',
    fontSize: 10.5,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#eaf3ff', fontSize: 12.5, fontWeight: '700', flex: 1 },
  counter: { flexDirection: 'row', gap: 6 },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnActive: { backgroundColor: '#ffd166' },
  counterText: { color: '#eaf3ff', fontWeight: '900', fontSize: 13 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 13.5,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  botToggle: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  botToggleOn: { backgroundColor: 'rgba(79,140,255,0.45)' },
  botText: { color: '#eaf3ff', fontSize: 10.5, fontWeight: '800' },
  avatars: { gap: 6, paddingTop: 10 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarText: { fontSize: 20 },
  mpInfo: { color: '#a8ecff', fontSize: 11, marginTop: 8, textAlign: 'center' },
  footnote: {
    color: 'rgba(190,215,255,0.5)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 15,
  },
});
