// Modal shell used by every in-game dialog.
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Btn } from './primitives';

export default function GameModal({ visible, title, subtitle, icon, onClose, children, footer, wide }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, wide && styles.cardWide]}>
          <LinearGradient
            colors={['rgba(28,38,66,0.98)', 'rgba(10,14,26,0.99)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glow} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {icon ? <Text style={styles.icon}>{icon}</Text> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

export function ModalActions({ children }) {
  return <View style={styles.actions}>{children}</View>;
}

export function ActionBtn(props) {
  return <Btn {...props} style={[{ flex: 1 }, props.style]} />;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,6,14,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '88%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.3)',
  },
  cardWide: { maxWidth: 560 },
  glow: {
    position: 'absolute',
    top: -60,
    left: -40,
    right: -40,
    height: 120,
    backgroundColor: 'rgba(90,150,255,0.18)',
    borderRadius: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  icon: { fontSize: 26 },
  title: { color: '#f2f7ff', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },
  subtitle: { color: 'rgba(190,210,240,0.75)', fontSize: 11.5, marginTop: 2 },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#cfe0ff', fontSize: 13, fontWeight: '800' },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  actions: { flexDirection: 'row', gap: 8, width: '100%' },
});
