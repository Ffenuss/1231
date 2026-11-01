// Shared UI primitives: glass panels, buttons, chips, meters.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function Panel({ children, style, tone = 'dark' }) {
  const colors =
    tone === 'gold'
      ? ['rgba(255,209,102,0.22)', 'rgba(60,40,10,0.85)']
      : tone === 'light'
      ? ['rgba(255,255,255,0.16)', 'rgba(20,26,44,0.85)']
      : ['rgba(30,40,70,0.92)', 'rgba(12,16,28,0.94)'];
  return (
    <View style={[styles.panelWrap, style]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.panelBorder} />
      <View style={styles.panelInner}>{children}</View>
    </View>
  );
}

export function Btn({ label, onPress, tone = 'primary', disabled, small, style, icon }) {
  const palette = {
    primary: ['#4f8cff', '#2a4fd0'],
    success: ['#3fd88a', '#1a9a5c'],
    danger: ['#ff5f7a', '#c02a4a'],
    gold: ['#ffd166', '#e09b1a'],
    ghost: ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.05)'],
    purple: ['#a06bff', '#6a35d0'],
  }[tone] || ['#4f8cff', '#2a4fd0'];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        style,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#3a3f52', '#2a2e3c'] : palette}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.btnContent}>
        {icon ? <Text style={[styles.btnIcon, small && { fontSize: 13 }]}>{icon}</Text> : null}
        <Text style={[styles.btnLabel, small && styles.btnLabelSmall]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function Chip({ label, color = '#8fb4ff', style }) {
  return (
    <View style={[styles.chip, { borderColor: color }, style]}>
      <Text style={[styles.chipText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function Meter({ value, max = 100, color = '#4dd2ff', label, compact }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View style={styles.meterWrap}>
      {label ? (
        <View style={styles.meterHead}>
          <Text style={styles.meterLabel}>{label}</Text>
          <Text style={styles.meterValue}>{Math.round(value)}</Text>
        </View>
      ) : null}
      <View style={[styles.meterTrack, compact && { height: 5 }]}>
        <View style={[styles.meterFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{children}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  panelWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.22)',
  },
  panelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  panelInner: { padding: 12 },
  btn: {
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 46,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  btnSmall: { minHeight: 34, borderRadius: 11 },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  btnIcon: { fontSize: 16 },
  btnLabel: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.2 },
  btnLabelSmall: { fontSize: 11.5 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(10,16,30,0.55)',
  },
  chipText: { fontSize: 10.5, fontWeight: '700' },
  meterWrap: { gap: 4 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { color: 'rgba(220,235,255,0.75)', fontSize: 10.5, fontWeight: '600' },
  meterValue: { color: '#eaf3ff', fontSize: 10.5, fontWeight: '800' },
  meterTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  meterFill: { height: '100%', borderRadius: 999 },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleText: {
    color: '#eaf3ff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
