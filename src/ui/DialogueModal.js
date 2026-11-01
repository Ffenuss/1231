// Dialogue sheet shown when the player talks to an NPC inside a building.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DialogueModal({ dialogue, onChoose, onClose }) {
  if (!dialogue) return null;
  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.card}>
        <LinearGradient colors={['#121c33', '#0a1122']} style={StyleSheet.absoluteFill} />
        <View style={styles.head}>
          <Text style={styles.avatar}>{dialogue.avatar || '🧑'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{dialogue.name}</Text>
            <Text style={styles.text}>{dialogue.text}</Text>
          </View>
        </View>
        <View style={styles.options}>
          {dialogue.options.map((opt, i) => (
            <Pressable
              key={opt.label}
              onPress={() => onChoose(i)}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              <Text style={styles.optionNum}>{i + 1}</Text>
              <Text style={styles.optionText}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>Уйти</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,7,14,0.55)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.28)',
    overflow: 'hidden',
    padding: 14,
    gap: 12,
  },
  head: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  avatar: { fontSize: 30 },
  name: { color: '#4dd2ff', fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  text: { color: '#eaf3ff', fontSize: 13.5, fontWeight: '700', marginTop: 3, lineHeight: 19 },
  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(77,210,255,0.10)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(77,210,255,0.32)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionPressed: { backgroundColor: 'rgba(77,210,255,0.22)' },
  optionNum: { color: '#4dd2ff', fontSize: 12, fontWeight: '900' },
  optionText: { color: '#eaf3ff', fontSize: 12.5, fontWeight: '700', flex: 1 },
  close: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16 },
  closeText: { color: 'rgba(200,220,255,0.6)', fontSize: 11.5, fontWeight: '800' },
});
