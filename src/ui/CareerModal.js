// Career panel: education, job search, promotion, salary overview.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameModal, { ActionBtn } from './GameModal';
import { Btn, Chip, Meter, SectionTitle } from './primitives';
import { CAREERS, EDU_LEVELS, EDU_COST, CAREER_BY_ID } from '../game/data';
import { formatMoney } from '../game/rng';

export default function CareerModal({ visible, player, onClose, actions, onMiniGame }) {
  const eduIdx = EDU_LEVELS.findIndex((e) => e.id === player.education);
  const career = player.career ? CAREER_BY_ID[player.career] : null;
  const available = CAREERS.filter((c) => EDU_LEVELS.findIndex((e) => e.id === c.edu) <= eduIdx);

  return (
    <GameModal
      visible={visible}
      title="Карьера и образование"
      subtitle={`${player.avatar} ${player.name} · ${player.age.toFixed(1)} лет`}
      icon="💼"
      onClose={onClose}
      wide
    >
      <SectionTitle>Текущий статус</SectionTitle>
      <View style={styles.statusRow}>
        <Chip label={career ? `${career.icon} ${career.name}` : 'Без работы'} color="#8fb4ff" />
        <Chip label={`💰 ${player.salary ? `${formatMoney(player.salary)}/мес` : 'нет дохода'}`} color="#8cffb0" />
        <Chip label={`📈 ур. ${player.careerLevel}`} color="#ffd166" />
        <Chip label={`🎓 ${EDU_LEVELS[eduIdx].name}`} color="#c9a0ff" />
      </View>
      {player.educationTarget ? (
        <View style={{ gap: 6 }}>
          <Meter
            label={`Обучение: ${EDU_COST[player.educationTarget].title}`}
            value={player.educationMonths}
            max={EDU_COST[player.educationTarget].months}
            color="#4dd2ff"
          />
        </View>
      ) : null}

      <SectionTitle>Образование</SectionTitle>
      {Object.entries(EDU_COST).map(([id, def]) => {
        const done = EDU_LEVELS.findIndex((e) => e.id === id) <= eduIdx;
        return (
          <View key={id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{def.title}</Text>
              <Text style={styles.rowSub}>
                {def.cost ? formatMoney(def.cost) : 'бесплатно'} · {def.months} мес.
              </Text>
            </View>
            <Btn
              label={done ? 'Получено' : 'Учиться'}
              small
              tone={done ? 'ghost' : 'primary'}
              disabled={done || player.money < def.cost || !!player.educationTarget}
              onPress={() => actions.enroll(id)}
            />
          </View>
        );
      })}

      <SectionTitle>Вакансии</SectionTitle>
      {available.slice(-4).map((c) => (
        <View key={c.id} style={styles.row}>
          <Text style={styles.rowIcon}>{c.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{c.name}</Text>
            <Text style={styles.rowSub}>
              ${c.base}/мес · {EDU_LEVELS.find((e) => e.id === c.edu)?.name}
            </Text>
          </View>
          <Btn
            label={player.career === c.id ? 'Работаю' : 'Наняться'}
            small
            tone={player.career === c.id ? 'ghost' : 'success'}
            onPress={() => actions.job(c.id)}
          />
        </View>
      ))}

      <View style={styles.row}>
        <ActionBtn
          label="Повышение"
          icon="⬆️"
          tone="gold"
          small
          disabled={!player.career}
          onPress={actions.promote}
        />
        <ActionBtn
          label="Мини-игра"
          icon="🎯"
          tone="purple"
          small
          onPress={() => onMiniGame(career?.mini || 'interview')}
        />
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 9,
  },
  rowIcon: { fontSize: 18 },
  rowTitle: { color: '#eaf3ff', fontSize: 12.5, fontWeight: '800' },
  rowSub: { color: 'rgba(190,215,255,0.65)', fontSize: 10 },
});
