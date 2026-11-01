// Family & lifestyle panel.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameModal, { ActionBtn } from './GameModal';
import { Chip, Meter, SectionTitle } from './primitives';
import { formatMoney, pick } from '../game/rng';
import { NAMES } from '../game/data';

export default function FamilyModal({ visible, player, onClose, actions }) {
  return (
    <GameModal
      visible={visible}
      title="Семья и жизнь"
      subtitle={`${player.avatar} ${player.name}`}
      icon="💕"
      onClose={onClose}
    >
      <SectionTitle>Состояние</SectionTitle>
      <View style={styles.chips}>
        <Chip label={player.family.married ? `💍 ${player.family.partner}` : '💔 не в браке'} color="#ff9db0" />
        <Chip label={`👶 детей: ${player.family.kids}`} color="#ffd166" />
        <Chip label={`🎂 ${player.age.toFixed(1)} лет`} color="#8fb4ff" />
      </View>
      <Meter label="Счастье" value={player.happiness} color="#ffd166" />
      <Meter label="Здоровье" value={player.health} color="#3fd88a" />

      <SectionTitle>Действия</SectionTitle>
      <View style={styles.row}>
        <ActionBtn
          label={player.family.married ? 'Уже в браке' : 'Свадьба $3K'}
          icon="💍"
          small
          tone="danger"
          disabled={player.family.married || player.money < 3000}
          onPress={() => actions.marry(pick(NAMES))}
        />
        <ActionBtn
          label="Ребёнок $5K"
          icon="👶"
          small
          tone="gold"
          disabled={!player.family.married || player.family.kids >= 3 || player.money < 5000}
          onPress={actions.child}
        />
      </View>
      <View style={styles.row}>
        <ActionBtn
          label="СПА $1.2K"
          icon="💆"
          small
          tone="primary"
          disabled={player.money < 1200}
          onPress={() => actions.entertain(1200, 16)}
        />
        <ActionBtn
          label="Концерт $900"
          icon="🎤"
          small
          tone="purple"
          disabled={player.money < 900}
          onPress={() => actions.entertain(900, 14)}
        />
      </View>
      <Text style={styles.hint}>
        Дети повышают счастье и дают бонус к пассивному доходу семьи, но требуют расходов.
      </Text>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', gap: 8 },
  hint: { color: 'rgba(190,215,255,0.6)', fontSize: 10.5, lineHeight: 15 },
});
