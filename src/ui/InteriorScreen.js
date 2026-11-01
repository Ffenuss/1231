// Full-screen interior view: walk your character inside a building and interact with objects.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Interior3D from '../game3d/Interior3D';
import DialogueModal from './DialogueModal';
import { Btn } from './primitives';
import { sfx } from '../game/audio';
import { npcDialogue } from '../game/dialogues';

const ROOM_TITLES = {
  bank: { title: 'Банк', icon: '🏦', hint: 'Банкомат — кредиты и вклады, стойка — операции' },
  office: { title: 'Офис', icon: '🏙️', hint: 'Стойка — карьера, архив — мини-игра' },
  casino: { title: 'Казино', icon: '🎰', hint: 'Рулетка и автоматы — ставки и мини-игры' },
  property: { title: 'Ваш дом', icon: '🏠', hint: 'Кровать и диван — отдохнуть, стол — семья' },
  business: { title: 'Ваш бизнес', icon: '🏪', hint: 'Стойка — управление, касса — задачи' },
};

export default function InteriorScreen({ roomType = 'office', onExit, onAction, onTalk }) {
  const [nearest, setNearest] = useState(null);
  const [bubble, setBubble] = useState(null);
  const [toast, setToast] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const bubbleTimer = useRef(null);
  const toastTimer = useRef(null);
  const meta = ROOM_TITLES[roomType] || ROOM_TITLES.office;

  useEffect(
    () => () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  // A short toast so the player sees what a room action actually did.
  const onToast = useCallback((text) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const interact = useCallback(
    (label, npcIndex) => {
      sfx.click();
      if (typeof npcIndex === 'number') {
        const d = npcDialogue(roomType, npcIndex);
        setDialogue(d);
        sfx.voice(0.85 + (npcIndex % 3) * 0.15);
        return;
      }
      if (onAction) onAction(label, onToast);
    },
    [onAction, onToast, roomType]
  );

  const choose = useCallback(
    (i) => {
      const opt = dialogue && dialogue.options[i];
      if (!opt) return;
      sfx.levelUp();
      onToast(opt.effect && opt.effect.log ? opt.effect.log : 'Разговор завершён');
      if (onTalk) onTalk(opt.effect || {});
      setDialogue(null);
    },
    [dialogue, onTalk, onToast]
  );

  const onNpcTalk = useCallback((line, name) => {
    setBubble({ line, name });
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 3200);
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#070b16', '#0e1428', '#1a1030']} style={StyleSheet.absoluteFill} />
      <Interior3D
        roomType={roomType}
        onInteract={interact}
        onNearest={(label) => setNearest((prev) => (prev === label ? prev : label))}
        onNpcTalk={onNpcTalk}
      />

      <View style={styles.top} pointerEvents="box-none">
        <Pressable style={styles.exit} onPress={onExit}>
          <Text style={styles.exitText}>← Выйти в город</Text>
        </Pressable>
        <View style={styles.titleBox}>
          <Text style={styles.title}>
            {meta.icon} {meta.title}
          </Text>
          <Text style={styles.hint}>{meta.hint}</Text>
        </View>
      </View>

      {bubble ? (
        <View style={styles.bubble} pointerEvents="none">
          <Text style={styles.bubbleName}>{bubble.name}</Text>
          <Text style={styles.bubbleLine}>{bubble.line}</Text>
        </View>
      ) : null}

      {toast ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <DialogueModal dialogue={dialogue} onChoose={choose} onClose={() => setDialogue(null)} />

      <View style={styles.bottom} pointerEvents="box-none">
        <Text style={styles.joyHint}>Держите палец на экране и ведите — персонаж идёт</Text>
        <Btn
          label={nearest ? `Действие: ${nearest}` : 'Подойдите ближе'}
          icon="✋"
          tone={nearest ? 'primary' : 'ghost'}
          disabled={!nearest}
          onPress={() => nearest && interact(nearest)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070b16' },
  top: { position: 'absolute', top: 36, left: 12, right: 12, gap: 8 },
  exit: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(10,14,26,0.85)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.3)',
  },
  exitText: { color: '#eaf3ff', fontSize: 12, fontWeight: '800' },
  titleBox: {
    backgroundColor: 'rgba(10,14,26,0.7)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.16)',
  },
  title: { color: '#ffd166', fontSize: 15, fontWeight: '900' },
  hint: { color: 'rgba(200,220,255,0.75)', fontSize: 10.5, marginTop: 2 },
  bubble: {
    position: 'absolute',
    top: 132,
    alignSelf: 'center',
    maxWidth: 260,
    backgroundColor: 'rgba(12,18,34,0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(77,210,255,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleName: { color: '#4dd2ff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  bubbleLine: { color: '#eaf3ff', fontSize: 12.5, fontWeight: '700', marginTop: 2 },
  toast: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    backgroundColor: 'rgba(63,216,138,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(63,216,138,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  toastText: { color: '#9dffc9', fontSize: 12, fontWeight: '800' },
  bottom: {
    position: 'absolute',
    bottom: 18,
    left: 12,
    right: 12,
    gap: 8,
    alignItems: 'stretch',
  },
  joyHint: { color: 'rgba(200,220,255,0.55)', fontSize: 10, textAlign: 'center' },
});
