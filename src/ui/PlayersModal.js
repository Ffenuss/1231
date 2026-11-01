// Player roster with detailed stats.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameModal from './GameModal';
import { Meter, Chip, SectionTitle } from './primitives';
import { formatMoney } from '../game/rng';
import { netWorth } from '../game/state';
import { EDU_LEVELS } from '../game/data';
import { CAREER_BY_ID, BUSINESSES, PROPERTIES } from '../game/data';

export default function PlayersModal({ visible, state, onClose }) {
  return (
    <GameModal visible={visible} title="Игроки" subtitle="Капитал, семья и активы" icon="👥" onClose={onClose} wide>
      {state.players.map((p) => {
        const career = p.career ? CAREER_BY_ID[p.career] : null;
        const edu = EDU_LEVELS.find((e) => e.id === p.education);
        return (
          <View key={p.id} style={[styles.card, { borderColor: `${p.color}66` }]}>
            <View style={styles.head}>
              <Text style={styles.avatar}>{p.avatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: p.color }]}>{p.name}</Text>
                <Text style={styles.sub}>
                  {p.age.toFixed(1)} лет · {edu?.name} {p.educationTarget ? '(учится)' : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.worth}>{formatMoney(netWorth(p))}</Text>
                <Text style={styles.worthCap}>капитал</Text>
              </View>
            </View>
            <View style={styles.chips}>
              <Chip label={`💵 ${formatMoney(p.money)}`} color="#8cffb0" />
              <Chip label={`🏦 долг ${formatMoney(p.debt)}`} color="#ff9db0" />
              {career ? <Chip label={`${career.icon} ${career.name}`} color="#8fb4ff" /> : null}
              {p.salary ? <Chip label={`$${p.salary}/мес`} color="#ffd166" /> : null}
              {p.family.married ? <Chip label="💍 в браке" color="#ff9db0" /> : null}
              {p.family.kids ? <Chip label={`👶 ${p.family.kids}`} color="#ffd166" /> : null}
            </View>
            <View style={styles.meters}>
              <View style={{ flex: 1 }}>
                <Meter label="Счастье" value={p.happiness} color="#ffd166" />
              </View>
              <View style={{ flex: 1 }}>
                <Meter label="Здоровье" value={p.health} color="#3fd88a" />
              </View>
            </View>
            {p.properties.length || p.businesses.length ? (
              <>
                <SectionTitle>Активы</SectionTitle>
                <View style={styles.chips}>
                  {p.properties.map((id, i) => (
                    <Chip key={`p${i}`} label={`${PROPERTIES[id]?.icon} ${PROPERTIES[id]?.name}`} color="#c9a0ff" />
                  ))}
                  {p.businesses.map((b, i) => (
                    <Chip
                      key={`b${i}`}
                      label={`${BUSINESSES[b.id]?.icon} ${BUSINESSES[b.id]?.name} ур.${b.level}`}
                      color="#ffb347"
                    />
                  ))}
                </View>
              </>
            ) : null}
          </View>
        );
      })}
    </GameModal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    gap: 9,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { fontSize: 28 },
  name: { fontSize: 14, fontWeight: '900' },
  sub: { color: 'rgba(200,220,255,0.7)', fontSize: 10.5 },
  worth: { color: '#eaf3ff', fontSize: 14, fontWeight: '900' },
  worthCap: { color: 'rgba(200,220,255,0.55)', fontSize: 9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meters: { flexDirection: 'row', gap: 10 },
});
