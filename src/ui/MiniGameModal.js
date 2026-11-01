// Profession mini-games: interview quiz, code tapping, coffee orders, trading.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GameModal, { ActionBtn } from './GameModal';
import { Btn, Chip, Meter, SectionTitle } from './primitives';
import { pick, randInt, formatMoney } from '../game/rng';

const QUIZ = [
  { q: 'Что такое EBITDA?', a: ['Прибыль до вычета процентов, налогов и амортизации', 'Вид акций', 'Банковский счёт'], c: 0 },
  { q: 'Что делает менеджер проекта?', a: ['Планирует и координирует работу команды', 'Только пишет код', 'Продаёт акции'], c: 0 },
  { q: 'Что такое KPI?', a: ['Ключевой показатель эффективности', 'Название банка', 'Тип кредита'], c: 0 },
  { q: 'Что такое инфляция?', a: ['Рост общего уровня цен', 'Падение цен', 'Рост зарплат'], c: 0 },
  { q: 'Что такое диверсификация?', a: ['Распределение рисков между активами', 'Покупка одного актива', 'Вид налога'], c: 0 },
];

const CODE_SNIPPET = 'const profit = revenue - costs;';

export default function MiniGameModal({ visible, kind, player, onClose, onFinish }) {
  const [phase, setPhase] = useState('intro'); // intro | play | result
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [codeIdx, setCodeIdx] = useState(0);
  const [order, setOrder] = useState([]);
  const [selected, setSelected] = useState([]);
  const [trades, setTrades] = useState([]);
  const [price, setPrice] = useState(100);
  const [holding, setHolding] = useState(false);
  const timer = useRef(null);

  const questions = useMemo(() => [...QUIZ].sort(() => Math.random() - 0.5).slice(0, 3), []);

  const kindMeta = {
    interview: { title: 'Собеседование', icon: '🎯', desc: 'Ответьте на вопросы правильно' },
    quiz: { title: 'Профессиональный тест', icon: '🧠', desc: '3 вопроса — 15 секунд' },
    code: { title: 'Спринт кодинга', icon: '💻', desc: 'Собери строку кода по символам' },
    coffee: { title: 'Смена в кофейне', icon: '☕', desc: 'Запомни и повтори заказ' },
    trade: { title: 'Торговая сессия', icon: '📊', desc: 'Купи дешевле, продай дороже' },
    business: { title: 'Управление бизнесом', icon: '📈', desc: 'Реагируй на рыночные сигналы' },
  };
  const meta = kindMeta[kind] || kindMeta.interview;

  useEffect(() => {
    if (phase !== 'play') return;
    if (kind === 'interview' || kind === 'quiz') {
      timer.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer.current);
            setPhase('result');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    if (kind === 'code') {
      timer.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer.current);
            setPhase('result');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    if (kind === 'coffee') {
      setOrder([pick(['☕', '🥐', '🍰', '🍵']), pick(['☕', '🥐', '🍰', '🍵']), pick(['☕', '🥐', '🍰', '🍵'])]);
    }
    if (kind === 'trade' || kind === 'business') {
      setPrice(100);
      setTrades([]);
      setHolding(false);
      timer.current = setInterval(() => {
        setPrice((p) => Math.max(20, Math.round(p + (Math.random() - 0.48) * 18)));
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer.current);
            setPhase('result');
            return 0;
          }
          return t - 1;
        });
      }, 700);
    }
    return () => clearInterval(timer.current);
  }, [phase, kind]);

  const start = () => {
    setScore(0);
    setTimeLeft(kind === 'coffee' ? 20 : 15);
    setQuestionIdx(0);
    setCodeIdx(0);
    setSelected([]);
    setPhase('play');
  };

  const answer = (idx) => {
    const correct = questions[questionIdx]?.c === idx;
    const next = score + (correct ? 1 : 0);
    setScore(next);
    if (questionIdx + 1 >= questions.length) {
      clearInterval(timer.current);
      setPhase('result');
    } else {
      setQuestionIdx(questionIdx + 1);
    }
  };

  const tapCode = (ch) => {
    if (ch === CODE_SNIPPET[codeIdx]) {
      const next = codeIdx + 1;
      setCodeIdx(next);
      setScore(Math.round((next / CODE_SNIPPET.length) * 100));
      if (next >= CODE_SNIPPET.length) {
        clearInterval(timer.current);
        setPhase('result');
      }
    } else {
      setScore((s) => Math.max(0, s - 3));
    }
  };

  const tapOrder = (sym) => {
    const next = [...selected, sym];
    setSelected(next);
    if (next.length === order.length) {
      const correct = next.every((s, i) => s === order[i]);
      setScore(correct ? 100 : Math.round((next.filter((s, i) => s === order[i]).length / order.length) * 100));
      setPhase('result');
    }
  };

  const trade = (buy) => {
    if (buy && !holding) {
      setHolding(true);
      setTrades((t) => [...t, { type: 'buy', price }]);
    } else if (!buy && holding) {
      setHolding(false);
      setTrades((t) => [...t, { type: 'sell', price }]);
    }
  };

  const finish = () => {
    const normalized = kind === 'trade' || kind === 'business'
      ? Math.max(0, Math.min(100, Math.round(((price - 100) / 100) * 100 + 50)))
      : score;
    const bonus = Math.round(normalized * 22);
    onFinish(normalized, bonus);
    onClose();
  };

  const renderPlay = () => {
    if (kind === 'interview' || kind === 'quiz') {
      const q = questions[questionIdx];
      return (
        <View style={{ gap: 10 }}>
          <Meter label="Время" value={timeLeft} max={15} color="#4dd2ff" />
          <Text style={styles.question}>{q.q}</Text>
          {q.a.map((a, i) => (
            <Btn key={i} label={a} tone="ghost" small onPress={() => answer(i)} />
          ))}
        </View>
      );
    }
    if (kind === 'code') {
      const chars = 'abcdefghijklmnopqrstuvwxyz =+-;'.split('');
      return (
        <View style={{ gap: 10 }}>
          <Meter label="Время" value={timeLeft} max={15} color="#4dd2ff" />
          <Text style={styles.code}>
            {CODE_SNIPPET.slice(0, codeIdx)}
            <Text style={{ color: '#ffd166' }}>{CODE_SNIPPET[codeIdx]}</Text>
            {CODE_SNIPPET.slice(codeIdx + 1)}
          </Text>
          <View style={styles.keyboard}>
            {chars.map((c) => (
              <Pressable key={c} onPress={() => tapCode(c)} style={styles.key}>
                <Text style={styles.keyText}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
    if (kind === 'coffee') {
      return (
        <View style={{ gap: 10 }}>
          <Text style={styles.question}>Заказ: {order.join(' ')}</Text>
          <Text style={styles.hint}>Повторите последовательность (выбрано {selected.length}/{order.length})</Text>
          <View style={styles.orderRow}>
            {selected.map((s, i) => (
              <Text key={i} style={styles.orderSym}>
                {s}
              </Text>
            ))}
          </View>
          <View style={styles.row}>
            {['☕', '🥐', '🍰', '🍵'].map((s) => (
              <Pressable key={s} onPress={() => tapOrder(s)} style={styles.orderBtn}>
                <Text style={styles.orderSym}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={{ gap: 10 }}>
        <Meter label="Время" value={timeLeft} max={15} color="#4dd2ff" />
        <Text style={styles.price}>${price}</Text>
        <Text style={styles.hint}>{holding ? 'В позиции — продайте на пике' : 'Вне рынка — покупайте на дне'}</Text>
        <View style={styles.row}>
          <ActionBtn label="Купить" tone="success" small onPress={() => trade(true)} disabled={holding} />
          <ActionBtn label="Продать" tone="danger" small onPress={() => trade(false)} disabled={!holding} />
        </View>
        <Text style={styles.hint}>Сделок: {trades.length}</Text>
      </View>
    );
  };

  return (
    <GameModal visible={visible} title={meta.title} subtitle={meta.desc} icon={meta.icon} onClose={onClose}>
      {phase === 'intro' ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.hint}>
            Мини-игра для профессии. Результат влияет на бонус к зарплате и опыт. Нажмите «Начать».
          </Text>
          <Btn label="Начать" icon="▶️" tone="gold" onPress={start} />
        </View>
      ) : null}
      {phase === 'play' ? renderPlay() : null}
      {phase === 'result' ? (
        <View style={{ gap: 10, alignItems: 'center' }}>
          <Text style={styles.resultEmoji}>{score > 60 ? '🏆' : score > 30 ? '👍' : '😅'}</Text>
          <Text style={styles.resultTitle}>Результат: {Math.round(score)}%</Text>
          <Chip label={`Бонус ${formatMoney(Math.round(score * 22))}`} color="#8cffb0" />
          <Btn label="Забрать награду" tone="success" onPress={finish} />
        </View>
      ) : null}
    </GameModal>
  );
}

const styles = StyleSheet.create({
  question: { color: '#eaf3ff', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  hint: { color: 'rgba(190,215,255,0.7)', fontSize: 11, lineHeight: 16 },
  code: {
    color: '#8cffb0',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 10,
  },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  key: {
    width: 26,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { color: '#eaf3ff', fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  orderRow: { flexDirection: 'row', gap: 6, minHeight: 34 },
  orderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  orderSym: { fontSize: 22 },
  price: { color: '#ffd166', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  resultEmoji: { fontSize: 46 },
  resultTitle: { color: '#eaf3ff', fontSize: 16, fontWeight: '900' },
});
