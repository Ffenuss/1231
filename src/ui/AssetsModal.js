// Assets panel: properties, businesses (with upgrades) and stock market.
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GameModal, { ActionBtn } from './GameModal';
import { Btn, Chip, SectionTitle } from './primitives';
import { BUSINESSES, PROPERTIES, STOCKS } from '../game/data';
import { formatMoney } from '../game/rng';

export default function AssetsModal({ visible, player, state, onClose, actions }) {
  const [tab, setTab] = useState('property');
  return (
    <GameModal
      visible={visible}
      title="Активы и инвестиции"
      subtitle={`Свободные средства: ${formatMoney(player.money)}`}
      icon="🏠"
      onClose={onClose}
      wide
    >
      <View style={styles.tabs}>
        {[
          { id: 'property', label: 'Недвижимость', icon: '🏠' },
          { id: 'business', label: 'Бизнес', icon: '🏪' },
          { id: 'stocks', label: 'Акции', icon: '📈' },
        ].map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && styles.tabActive]}
          >
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabLabel, tab === t.id && { color: '#0b1020' }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'property' ? (
        <>
          <SectionTitle>Ваши объекты</SectionTitle>
          {player.properties.length === 0 ? (
            <Text style={styles.empty}>Пока нет недвижимости. Купите на клетках «Квартира», «Дом», «Пентхаус».</Text>
          ) : (
            player.properties.map((id, i) => {
              const def = PROPERTIES[id];
              return (
                <View key={`${id}${i}`} style={styles.row}>
                  <Text style={styles.icon}>{def.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{def.name}</Text>
                    <Text style={styles.sub}>
                      Аренда {formatMoney(def.rent)}/мес · стоимость {formatMoney(def.price)}
                    </Text>
                  </View>
                  <Chip label="доход" color="#8cffb0" />
                  <Btn
                    label="Продать"
                    small
                    tone="danger"
                    onPress={() => actions.sellAsset('property', id)}
                  />
                </View>
              );
            })
          )}
          <SectionTitle>Каталог</SectionTitle>
          {Object.values(PROPERTIES).map((def) => (
            <View key={def.id} style={styles.row}>
              <Text style={styles.icon}>{def.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{def.name}</Text>
                <Text style={styles.sub}>{formatMoney(def.price)} · аренда {formatMoney(def.rent)}</Text>
              </View>
              <Chip label={`владельцев: ${Object.values(state.ownedTiles).filter((o) => o.id === def.id).length}`} color="#c9a0ff" />
            </View>
          ))}
        </>
      ) : null}

      {tab === 'business' ? (
        <>
          <SectionTitle>Ваши бизнесы</SectionTitle>
          {player.businesses.length === 0 ? (
            <Text style={styles.empty}>Откройте бизнес на клетках «Кофейня», «Магазин», «Тех-стартап».</Text>
          ) : (
            player.businesses.map((b, i) => {
              const def = BUSINESSES[b.id];
              const cost = Math.round(def.price * 0.4 * (b.level + 1));
              return (
                <View key={`${b.id}${i}`} style={styles.row}>
                  <Text style={styles.icon}>{def.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>
                      {def.name} · ур. {b.level}
                    </Text>
                    <Text style={styles.sub}>
                      Доход {formatMoney(def.income * (1 + b.level * 0.35) - def.upkeep)}/мес
                    </Text>
                  </View>
                  <Btn
                    label={`Улучшить ${formatMoney(cost)}`}
                    small
                    tone="gold"
                    disabled={b.level >= 5 || player.money < cost}
                    onPress={() => actions.upgrade(b.id)}
                  />
                  <Btn label="Продать" small tone="danger" onPress={() => actions.sellAsset('business', b.id)} />
                </View>
              );
            })
          )}
          <SectionTitle>Свободные ниши</SectionTitle>
          {Object.values(BUSINESSES).map((def) => (
            <View key={def.id} style={styles.row}>
              <Text style={styles.icon}>{def.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{def.name}</Text>
                <Text style={styles.sub}>
                  {formatMoney(def.price)} · {formatMoney(def.income)}/мес · риск {Math.round(def.risk * 100)}%
                </Text>
              </View>
            </View>
          ))}
        </>
      ) : null}

      {tab === 'stocks' ? (
        <>
          <SectionTitle>Биржа</SectionTitle>
          {STOCKS.map((s) => {
            const price = state.stockPrices[s.id];
            const owned = player.stocks[s.id] || 0;
            const change = ((price - s.base) / s.base) * 100;
            return (
              <View key={s.id} style={styles.row}>
                <View style={[styles.stockDot, { backgroundColor: s.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{s.name}</Text>
                  <Text style={styles.sub}>
                    {formatMoney(price)} ·{' '}
                    <Text style={{ color: change >= 0 ? '#8cffb0' : '#ff9db0' }}>
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(1)}%
                    </Text>{' '}
                    · в портфеле {owned}
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <Btn
                    label="Купить 10"
                    small
                    tone="success"
                    disabled={player.money < price * 10}
                    onPress={() => actions.buyStock(s.id, 10)}
                  />
                  <Btn
                    label="Продать 10"
                    small
                    tone="danger"
                    disabled={owned < 10}
                    onPress={() => actions.sellStock(s.id, 10)}
                  />
                </View>
              </View>
            );
          })}
          <Text style={styles.empty}>Цены меняются каждый ход. Высокая волатильность — высокий риск.</Text>
        </>
      ) : null}
    </GameModal>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    gap: 2,
  },
  tabActive: { backgroundColor: '#ffd166' },
  tabIcon: { fontSize: 15 },
  tabLabel: { color: '#eaf3ff', fontSize: 9.5, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 9,
  },
  icon: { fontSize: 20 },
  title: { color: '#eaf3ff', fontSize: 12.5, fontWeight: '800' },
  sub: { color: 'rgba(190,215,255,0.65)', fontSize: 10 },
  empty: { color: 'rgba(190,215,255,0.55)', fontSize: 11, lineHeight: 16 },
  stockDot: { width: 12, height: 12, borderRadius: 6 },
});
