// Tile action modal: what happens on the cell the player landed on.
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameModal, { ActionBtn } from './GameModal';
import { Btn, Chip } from './primitives';
import { TILES } from '../game/board';
import { CATEGORY_COLORS } from '../game/config';
import { CAREERS, BUSINESSES, PROPERTIES, ENTERTAINMENT, EDU_LEVELS, EDU_COST, EVENTS } from '../game/data';
import { formatMoney, pick } from '../game/rng';
import { netWorth } from '../game/state';

const PROPERTY_ON_TILE = { 4: 'studio', 13: 'house', 17: 'penthouse' };
const BUSINESS_ON_TILE = { 8: 'coffee', 15: 'shop', 19: 'startup' };
const ENTERABLE = {
  bank: true,
  career: true,
  casino: true,
  property: true,
  business: true,
  education: true,
  life: true,
  entertainment: true,
};

export default function TileModal({
  tileIndex,
  state,
  onClose,
  actions,
  onMiniGame,
  onCasino,
  onEnter,
}) {
  const tile = TILES[tileIndex];
  const player = state.players[state.current];
  const owner = state.ownedTiles[tileIndex];
  const [event] = useState(() => pick(EVENTS));

  const color = CATEGORY_COLORS[tile.type] || '#8fb4ff';

  const body = useMemo(() => {
    switch (tile.type) {
      case 'start':
        return (
          <Text style={styles.text}>
            Вы на старте. Бонус за круг уже начислен. Продолжайте путь к капиталу!
          </Text>
        );
      case 'event':
        return (
          <View style={{ gap: 8 }}>
            <Text style={styles.text}>{event.text}</Text>
            <Chip
              label={`${event.money > 0 ? '+' : ''}${formatMoney(event.money)}`}
              color={event.money > 0 ? '#8cffb0' : '#ff9db0'}
            />
          </View>
        );
      case 'tax': {
        const tax = Math.max(400, Math.round(player.money * 0.06 + player.properties.length * 250));
        return <Text style={styles.text}>Налоговая инспекция начисляет сбор {formatMoney(tax)}.</Text>;
      }
      case 'jail':
        return (
          <Text style={styles.text}>
            Полиция задержала вас за нарушение порядка. Пропуск 2 ходов или штраф.
          </Text>
        );
      case 'education': {
        const level = tileIndex === 1 ? 'college' : 'university';
        const def = EDU_COST[level];
        const done = EDU_LEVELS.findIndex((e) => e.id === player.education) >=
          EDU_LEVELS.findIndex((e) => e.id === level);
        return (
          <View style={{ gap: 8 }}>
            <Text style={styles.text}>
              {done
                ? 'Этот уровень образования уже получен.'
                : `Стоимость: ${formatMoney(def.cost)} · ${def.months} мес. обучения`}
            </Text>
            <Btn
              label={done ? 'Уже получено' : `Записаться (${formatMoney(def.cost)})`}
              icon="🎓"
              tone="primary"
              disabled={done || player.money < def.cost || !!player.educationTarget}
              onPress={() => actions.enroll(level)}
            />
          </View>
        );
      }
      case 'career': {
        const eduIdx = EDU_LEVELS.findIndex((e) => e.id === player.education);
        const options = CAREERS.filter(
          (c) => EDU_LEVELS.findIndex((e) => e.id === c.edu) <= eduIdx
        ).slice(-3);
        return (
          <View style={{ gap: 8 }}>
            <Text style={styles.text}>Доступные вакансии для вашего уровня образования:</Text>
            {options.map((c) => (
              <View key={c.id} style={styles.vacancy}>
                <Text style={styles.vacancyIcon}>{c.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vacancyName}>{c.name}</Text>
                  <Text style={styles.vacancySub}>${c.base}/мес · {EDU_LEVELS.find((e) => e.id === c.edu)?.name}</Text>
                </View>
                <Btn
                  label="Наняться"
                  small
                  tone="success"
                  onPress={() => actions.job(c.id)}
                  disabled={player.age < 16}
                />
              </View>
            ))}
            <Btn
              label="Мини-игра собеседования"
              icon="🎯"
              tone="purple"
              onPress={() => onMiniGame('interview')}
            />
          </View>
        );
      }
      case 'property': {
        const id = PROPERTY_ON_TILE[tileIndex];
        const def = PROPERTIES[id];
        if (owner && owner.owner !== player.id) {
          const buyout = Math.round((owner.value || def.price) * 1.25);
          return (
            <View style={{ gap: 8 }}>
              <Text style={styles.text}>
                Объект принадлежит {state.players[owner.owner].name}. Вы платите аренду{' '}
                {formatMoney(def.rent)}.
              </Text>
              <Btn
                label={`Выкупить за ${formatMoney(buyout)}`}
                icon="🤝"
                tone="gold"
                disabled={player.money < buyout}
                onPress={() => actions.buyOut(tileIndex)}
              />
            </View>
          );
        }
        return (
          <View style={{ gap: 8 }}>
            <Text style={styles.text}>
              {def.name} · {formatMoney(def.price)} · аренда {formatMoney(def.rent)}/мес
            </Text>
            <Btn
              label={owner ? 'Уже ваше' : `Купить за ${formatMoney(def.price)}`}
              icon="🏠"
              tone="gold"
              disabled={!!owner || player.money < def.price}
              onPress={() => actions.buyProperty(id, tileIndex)}
            />
          </View>
        );
      }
      case 'business': {
        const id = BUSINESS_ON_TILE[tileIndex];
        const def = BUSINESSES[id];
        if (owner && owner.owner !== player.id) {
          const buyout = Math.round((owner.value || def.price) * 1.25);
          return (
            <View style={{ gap: 8 }}>
              <Text style={styles.text}>
                Бизнес {def.name} принадлежит {state.players[owner.owner].name}.
              </Text>
              <Btn
                label={`Выкупить за ${formatMoney(buyout)}`}
                icon="🤝"
                tone="gold"
                disabled={player.money < buyout}
                onPress={() => actions.buyOut(tileIndex)}
              />
            </View>
          );
        }
        return (
          <View style={{ gap: 8 }}>
            <Text style={styles.text}>
              {def.name} · {formatMoney(def.price)} · доход {formatMoney(def.income)}/мес
            </Text>
            <Btn
              label={owner ? 'Уже ваш' : `Открыть за ${formatMoney(def.price)}`}
              icon="🏪"
              tone="gold"
              disabled={!!owner || player.money < def.price}
              onPress={() => actions.buyBusiness(id, tileIndex)}
            />
            <Btn
              label="Мини-игра: управление бизнесом"
              icon="📈"
              tone="purple"
              onPress={() => onMiniGame('business')}
            />
          </View>
        );
      }
      case 'casino':
        return (
          <View style={{ gap: 8 }}>
            <Text style={styles.text}>Испытайте удачу — слоты, рулетка, кости и блэкджек.</Text>
            <Btn label="Войти в казино" icon="🎰" tone="danger" onPress={onCasino} />
          </View>
        );
      case 'entertainment':
        return (
          <View style={{ gap: 8 }}>
            <Text style={styles.text}>Отдохните и поднимите настроение:</Text>
            {ENTERTAINMENT.map((e) => (
              <View key={e.id} style={styles.vacancy}>
                <Text style={styles.vacancyIcon}>{e.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vacancyName}>{e.name}</Text>
                  <Text style={styles.vacancySub}>
                    {formatMoney(e.cost)} · +{e.happiness} счастья
                  </Text>
                </View>
                <Btn
                  label="Пойти"
                  small
                  tone="primary"
                  disabled={player.money < e.cost}
                  onPress={() => actions.entertain(e.cost, e.happiness)}
                />
              </View>
            ))}
          </View>
        );
      case 'bank':
        return (
          <View style={{ gap: 8 }}>
            <Text style={styles.text}>
              Кредит до {formatMoney(60000 - player.debt)} · ставка 12% годовых. Капитал:{' '}
              {formatMoney(netWorth(player))}
            </Text>
            <View style={styles.row}>
              <ActionBtn label="+$5K кредит" small tone="danger" onPress={() => actions.loan(5000)} />
              <ActionBtn label="Погасить $5K" small tone="success" onPress={() => actions.repay(5000)} />
            </View>
            <Btn label="Инвестиции и акции" icon="📈" tone="purple" onPress={() => actions.open('invest')} />
          </View>
        );
      case 'life':
        return (
          <View style={{ gap: 8 }}>
            <Text style={styles.text}>
              {tileIndex === 10
                ? 'Романтическая встреча: можно создать семью.'
                : 'Семейная жизнь: дети приносят счастье (и расходы).'}
            </Text>
            <View style={styles.row}>
              <ActionBtn
                label={player.family.married ? 'Уже в браке' : 'Пожениться $3K'}
                small
                tone="danger"
                disabled={player.family.married || player.money < 3000}
                onPress={() => actions.marry()}
              />
              <ActionBtn
                label="Завести ребёнка $5K"
                small
                tone="gold"
                disabled={!player.family.married || player.money < 5000}
                onPress={() => actions.child()}
              />
            </View>
          </View>
        );
      default:
        return <Text style={styles.text}>{tile.desc}</Text>;
    }
  }, [tileIndex, state, actions, event]);

  return (
    <GameModal
      visible
      title={tile.label}
      subtitle={`${tile.icon} ${tile.desc}`}
      icon={tile.icon}
      onClose={onClose}
      footer={
        tile.type === 'event' || tile.type === 'tax' || tile.type === 'jail' || tile.type === 'start' ? (
          <ActionBtn
            label={
              tile.type === 'event'
                ? `Применить событие`
                : tile.type === 'tax'
                ? 'Заплатить налог'
                : tile.type === 'jail'
                ? 'Принять последствия'
                : 'Продолжить'
            }
            tone="primary"
            onPress={() => {
              if (tile.type === 'event') actions.event(event);
              else if (tile.type === 'tax') actions.tax();
              else if (tile.type === 'jail') actions.jail();
              onClose();
            }}
          />
        ) : (
          <ActionBtn label="Готово" tone="ghost" onPress={onClose} />
        )
      }
    >
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={[styles.badgeText, { color }]}>{tile.label.toUpperCase()}</Text>
      </View>
      {onEnter && ENTERABLE[tile.type] ? (
        <Btn
          label="Войти в здание (3D-интерьер)"
          icon="🚪"
          tone="purple"
          onPress={onEnter}
        />
      ) : null}
      {body}
    </GameModal>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 1 },
  text: { color: 'rgba(225,238,255,0.92)', fontSize: 12.5, lineHeight: 18 },
  vacancy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 9,
  },
  vacancyIcon: { fontSize: 20 },
  vacancyName: { color: '#eaf3ff', fontSize: 12.5, fontWeight: '800' },
  vacancySub: { color: 'rgba(190,215,255,0.65)', fontSize: 10 },
  row: { flexDirection: 'row', gap: 8 },
});
