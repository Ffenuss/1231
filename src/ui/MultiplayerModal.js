// Multiplayer lobby: host a game over the local relay or join one by ws:// URL.
// Once connected, both sides see the live player list with readiness flags.
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import GameModal, { ActionBtn } from './GameModal';
import { Btn, Chip, SectionTitle } from './primitives';
import { localIpHint, hostUrl } from '../game/multiplayer';
import { lobbySummary } from '../game/lobby';

function PlayerRow({ player, you }) {
  return (
    <View style={styles.playerRow}>
      <Text style={styles.playerAvatar}>{player.avatar || '🙂'}</Text>
      <View style={styles.playerMain}>
        <Text style={styles.playerName} numberOfLines={1}>
          {player.name}
          {you ? ' (вы)' : ''}
        </Text>
        <Text style={styles.playerRole}>{player.isHost ? 'хост' : 'игрок'}</Text>
      </View>
      <Chip
        label={player.ready ? 'готов' : 'ждём'}
        color={player.ready ? '#8cffb0' : '#ffd166'}
      />
    </View>
  );
}

export default function MultiplayerModal({
  visible,
  onClose,
  onHost,
  onJoin,
  onReady,
  onStart,
  status,
  connected,
  role,
  players = [],
  youId,
}) {
  const [url, setUrl] = useState(hostUrl('localhost'));
  const summary = lobbySummary(players);
  const inLobby = players.length > 0;

  return (
    <GameModal
      visible={visible}
      title="Мультиплеер"
      subtitle="Играйте по локальной WiFi-сети"
      icon="📡"
      onClose={onClose}
    >
      {!inLobby ? (
        <>
          <SectionTitle>Как это работает</SectionTitle>
          <Text style={styles.text}>
            На компьютере в той же сети запустите ретранслятор:{'\n'}
            <Text style={styles.code}>node scripts/mp-server.js</Text>
            {'\n'}Он печатает адрес вида ws://192.168.x.x:8787 — его вводят остальные игроки.
          </Text>

          <SectionTitle>Хост</SectionTitle>
          <ActionBtn label="Создать игру (я хост)" tone="gold" onPress={onHost} />
          <Text style={styles.hint}>{localIpHint()}</Text>

          <SectionTitle>Подключиться</SectionTitle>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="ws://192.168.1.10:8787"
            placeholderTextColor="rgba(200,220,255,0.4)"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <View style={styles.row}>
            <ActionBtn label="Подключиться" tone="primary" onPress={() => onJoin(url)} />
            <Chip label={connected ? '● подключено' : '○ нет связи'} color={connected ? '#8cffb0' : '#ff9db0'} />
          </View>
        </>
      ) : (
        <>
          <SectionTitle right={<Chip label={`${summary.ready}/${summary.total} готовы`} color="#4dd2ff" />}>
            Лобби
          </SectionTitle>
          <View style={styles.playerList}>
            {players.map((p) => (
              <PlayerRow key={p.id} player={p} you={p.id === youId} />
            ))}
          </View>
          {role === 'client' ? (
            <ActionBtn
              label="Я готов"
              tone="success"
              onPress={() => onReady(true)}
            />
          ) : null}
          {role === 'host' ? (
            <ActionBtn
              label={summary.canStart ? 'Начать игру' : 'Ждём готовности игроков'}
              tone={summary.canStart ? 'gold' : 'ghost'}
              disabled={!summary.canStart}
              onPress={onStart}
            />
          ) : (
            <Text style={styles.hint}>Игру начнёт хост, когда все будут готовы.</Text>
          )}
          <Btn label="Закрыть" tone="ghost" onPress={onClose} />
        </>
      )}
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </GameModal>
  );
}

const styles = StyleSheet.create({
  text: { color: 'rgba(225,238,255,0.9)', fontSize: 12, lineHeight: 18 },
  code: { color: '#ffd166', fontWeight: '800' },
  hint: { color: 'rgba(190,215,255,0.6)', fontSize: 10.5, lineHeight: 15 },
  input: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { color: '#a8ecff', fontSize: 11 },
  playerList: { gap: 6, marginBottom: 8 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  playerAvatar: { fontSize: 20 },
  playerMain: { flex: 1 },
  playerName: { color: '#eaf3ff', fontSize: 12.5, fontWeight: '800' },
  playerRole: { color: 'rgba(200,220,255,0.6)', fontSize: 10 },
});
