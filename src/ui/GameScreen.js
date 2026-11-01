// Main game screen: wires the 3D city, HUD, action bar and all modals to the game state.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import City3D from '../game3d/City3D';
import Hud from './Hud';
import ActionBar from './ActionBar';
import TileModal from './TileModal';
import CasinoModal from './CasinoModal';
import CareerModal from './CareerModal';
import AssetsModal from './AssetsModal';
import BankModal from './BankModal';
import FamilyModal from './FamilyModal';
import PlayersModal from './PlayersModal';
import MiniGameModal from './MiniGameModal';
import { LogModal, MenuModal, GameOverModal } from './InfoModals';
import InteriorScreen from './InteriorScreen';
import { TILES } from '../game/board';
import { sfx } from '../game/audio';
import { pick } from '../game/rng';
import { NAMES } from '../game/data';
import { roomRequested } from '../game/devtools';
import { applyDialogueEffect } from '../game/dialogues';
import * as G from '../game/state';

export default function GameScreen({
  state,
  setState,
  onExit,
  onSave,
  onRestart,
  audio,
  music,
  onToggleAudio,
  onToggleMusic,
}) {
  const [modal, setModal] = useState(null); // {type, ...}
  const [busy, setBusy] = useState(false);
  const [cameraMode, setCameraMode] = useState('orbit');
  const [interior, setInterior] = useState(() => roomRequested());
  const [activeTile, setActiveTile] = useState(0);
  const sceneRef = useRef(null);
  const botTimer = useRef(null);

  const player = state.players[state.current];

  const apply = useCallback(
    (fn) => {
      setState((prev) => fn(G.clone(prev)));
    },
    [setState]
  );

  // --- dice + movement ------------------------------------------------------
  const roll = useCallback(() => {
    if (state.phase !== 'roll' || busy) return;
    setBusy(true);
    sfx.dice();
    const value = G.rollDice();
    if (sceneRef.current) sceneRef.current.rollDiceAnimation();
    let landed = 0;
    setTimeout(() => {
      if (sceneRef.current) sceneRef.current.hideDice();
      setState((prev) => {
        let s = G.clone(prev);
        s.dice = value;
        s = G.movePlayer(s, value);
        landed = s.players[s.current].pos;
        return s;
      });
      sfx.step();
    }, 900);
    setTimeout(() => {
      setBusy(false);
      setModal({ type: 'tile', tileIndex: landed });
    }, 1500);
  }, [state.phase, busy, setState]);

  useEffect(() => {
    if (state.pendingTile) setActiveTile(state.pendingTile.i);
  }, [state.pendingTile]);

  // --- tile actions --------------------------------------------------------
  const tileActions = useMemo(
    () => ({
      enroll: (level) => {
        apply((s) => G.enrollEducation(s, level));
        sfx.levelUp();
      },
      job: (id) => {
        apply((s) => G.applyForJob(s, id));
        sfx.win();
      },
      promote: () => {
        apply((s) => G.promote(s));
        sfx.levelUp();
      },
      buyProperty: (id, tile) => {
        apply((s) => G.buyProperty(s, id, tile));
        sfx.cash();
      },
      buyBusiness: (id, tile) => {
        apply((s) => G.buyBusiness(s, id, tile));
        sfx.cash();
      },
      entertain: (cost, happiness) => {
        apply((s) => G.entertain(s, cost, happiness));
        sfx.click();
      },
      loan: (amount) => {
        apply((s) => G.takeLoan(s, amount));
        sfx.cash();
      },
      repay: (amount) => {
        apply((s) => G.repayLoan(s, amount));
        sfx.cash();
      },
      marry: (name) => {
        apply((s) => G.marry(s, name || pick(NAMES)));
        sfx.win();
      },
      child: () => {
        apply((s) => G.haveChild(s));
        sfx.levelUp();
      },
      event: (ev) => {
        apply((s) => G.applyEvent(s, ev));
        sfx.click();
      },
      tax: () => {
        apply((s) => G.payTax(s));
        sfx.error();
      },
      jail: () => {
        apply((s) => G.goToJail(s, 2));
        sfx.lose();
      },
      open: (what) => setModal({ type: what }),
      upgrade: (id) => {
        apply((s) => G.upgradeBusiness(s, id));
        sfx.levelUp();
      },
      buyStock: (id, qty) => {
        apply((s) => G.buyStock(s, id, qty));
        sfx.cash();
      },
      sellStock: (id, qty) => {
        apply((s) => G.sellStock(s, id, qty));
        sfx.cash();
      },
      sellAsset: (kind, id) => {
        apply((s) => G.sellAsset(s, kind, id));
        sfx.cash();
      },
      buyOut: (tileIndex) => {
        apply((s) => G.buyOutTile(s, tileIndex));
        sfx.cash();
      },
    }),
    [apply]
  );

  // --- turn end ------------------------------------------------------------
  const endTurn = useCallback(() => {
    if (state.phase === 'roll' || busy) return;
    setBusy(true);
    sfx.whoosh();
    setTimeout(() => {
      setState((prev) => G.endTurn(prev));
      setBusy(false);
      setModal(null);
    }, 350);
  }, [state.phase, busy, setState]);

  // --- simple bot AI -------------------------------------------------------
  useEffect(() => {
    if (!player?.isBot || state.phase === 'gameover') return;
    clearTimeout(botTimer.current);
    botTimer.current = setTimeout(() => {
      if (state.phase === 'roll') {
        roll();
      } else if (state.phase === 'action') {
        const p = state.players[state.current];
        let s = G.clone(state);
        // bot invests in education / property / business when possible
        if (!p.career && p.age >= 16) {
          const careers = ['barista', 'courier', 'teacher', 'developer', 'engineer', 'broker'];
          s = G.applyForJob(s, pick(careers));
        } else if (p.career && Math.random() < 0.3) {
          s = G.promote(s);
        }
        if (p.money > 40000 && Math.random() < 0.5) {
          const tile = state.pendingTile?.i ?? 0;
          if (!s.ownedTiles[tile]) {
            if (TILES[tile].type === 'property') s = G.buyProperty(s, 'studio', tile);
            if (TILES[tile].type === 'business') s = G.buyBusiness(s, 'coffee', tile);
          }
        }
        if (p.money > 60000 && Math.random() < 0.4) {
          s = G.buyStock(s, pick(['tech', 'energy', 'food', 'space']), 5);
        }
        if (p.family.married === false && p.money > 20000 && Math.random() < 0.25) {
          s = G.marry(s, pick(NAMES));
        }
        if (Math.random() < 0.2) s = G.entertain(s, 400, 8);
        setState(s);
        setTimeout(() => endTurn(), 700);
      }
    }, 900);
    return () => clearTimeout(botTimer.current);
  }, [player, state.phase, state.current, roll, endTurn, setState, state]);

  const onAction = (id) => {
    sfx.click();
    if (id === 'career') setModal({ type: 'career' });
    else if (id === 'edu') setModal({ type: 'career' });
    else if (id === 'property') setModal({ type: 'assets' });
    else if (id === 'bank') setModal({ type: 'bank' });
    else if (id === 'family') setModal({ type: 'family' });
    else if (id === 'casino') setModal({ type: 'casino' });
    else if (id === 'menu') setModal({ type: 'menu' });
  };

  const miniGameFinish = (score, bonus) => {
    apply((s) => {
      const p = s.players[s.current];
      p.money += bonus;
      p.experience += 1;
      if (score > 70 && p.career) p.salary = Math.round(p.salary * 1.08);
      G.log(s, `${p.name}: мини-игра ${Math.round(score)}% → +$${bonus}`, score > 50 ? 'good' : 'info');
      return s;
    });
    if (score > 50) sfx.win();
    else sfx.lose();
  };

  // --- interiors -----------------------------------------------------------
  const ROOM_FOR_TILE = {
    bank: 'bank',
    career: 'office',
    casino: 'casino',
    property: 'property',
    business: 'business',
    education: 'office',
    life: 'property',
    entertainment: 'casino',
  };

  const enterBuilding = () => {
    const tile = state.pendingTile?.i ?? activeTile;
    const type = TILES[tile]?.type;
    const room = ROOM_FOR_TILE[type] || 'office';
    sfx.whoosh();
    setModal(null);
    setInterior(room);
  };

  const interiorAction = (label, toast) => {
    const p = state.players[state.current];
    if (!p) return;
    sfx.click();
    const say = toast || (() => {});

    // --- rest & self-improvement (available in most rooms) -----------------
    if (label.includes('Кровать') || label.includes('Диван')) {
      apply((s) => G.entertain(s, 0, 7));
      sfx.levelUp();
      say('Отдых: +7 к счастью, +2 к здоровью');
      return;
    }
    if (label.includes('Растение')) {
      apply((s) => {
        const pl = s.players[s.current];
        pl.happiness = Math.min(100, pl.happiness + 1);
        return s;
      });
      say('Немного уюта: +1 к счастью');
      return;
    }
    if (label.includes('Архив') || label.includes('Полка')) {
      apply((s) => {
        const pl = s.players[s.current];
        pl.experience += 1;
        G.log(s, `${pl.name}: самообразование (+1 опыт)`, 'good');
        return s;
      });
      sfx.levelUp();
      say('Самообразование: +1 опыт');
      return;
    }

    // --- room-specific -----------------------------------------------------
    if (interior === 'bank') {
      if (label.includes('Терминал') || label.includes('Стойка') || label.includes('Хранилище')) {
        setInterior(null);
        setModal({ type: 'bank' });
      }
      return;
    }

    if (interior === 'office') {
      if (label.includes('Стойка') || label.includes('Рабочее место')) {
        setInterior(null);
        setModal({ type: 'career' });
      } else if (label.includes('Стол')) {
        setInterior(null);
        setModal({ type: 'minigame', kind: 'quiz' });
      }
      return;
    }

    if (interior === 'casino') {
      if (label.includes('Терминал') || label.includes('Касса')) {
        setInterior(null);
        setModal({ type: 'casino' });
      } else if (label.includes('Рулетка') || label.includes('автомат') || label.includes('Стол')) {
        setInterior(null);
        setModal({ type: 'minigame', kind: 'trade' });
      }
      return;
    }

    if (interior === 'property') {
      if (label.includes('Стол')) {
        setInterior(null);
        setModal({ type: 'family' });
      }
      return;
    }

    if (interior === 'business') {
      if (label.includes('Касса') || label.includes('Стойка')) {
        setInterior(null);
        setModal({ type: 'assets' });
      } else if (label.includes('Стол') || label.includes('Склад') || label.includes('Холодильник')) {
        setInterior(null);
        setModal({ type: 'minigame', kind: 'business' });
      }
    }
  };

  const interiorTalk = (effect) => {
    if (!effect) return;
    apply((s) => {
      const cur = s.players[s.current];
      if (!cur) return s;
      const next = applyDialogueEffect(cur, effect);
      s.players[s.current] = next;
      if (effect.log) G.log(s, `${next.name}: ${effect.log}`, (effect.money || 0) >= 0 ? 'good' : 'info');
      return s;
    });
  };

  if (interior) {
    return (
      <InteriorScreen
        roomType={interior}
        onExit={() => setInterior(null)}
        onTalk={interiorTalk}
        onAction={interiorAction}
      />
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#070b16', '#0e1428', '#1a1030']} style={StyleSheet.absoluteFill} />
      <View style={styles.sceneWrap}>
        <City3D
          players={state.players}
          activeIndex={state.current}
          activeTile={activeTile}
          cameraMode={cameraMode}
          onReady={(scene) => {
            sceneRef.current = scene;
          }}
        />
        <View style={styles.sceneOverlay} pointerEvents="box-none">
          <Hud
            state={state}
            onOpenPlayers={() => setModal({ type: 'players' })}
            onOpenLog={() => setModal({ type: 'log' })}
          />
        </View>
        {busy ? (
          <View style={styles.busy} pointerEvents="none">
            <Text style={styles.busyText}>🎲 {player.name} бросает кубик…</Text>
          </View>
        ) : null}
      </View>

      <ActionBar state={state} onRoll={roll} onAction={onAction} onEndTurn={endTurn} busy={busy} />

      {modal?.type === 'tile' ? (
        <TileModal
          tileIndex={modal.tileIndex}
          state={state}
          onClose={() => setModal(null)}
          actions={tileActions}
          onMiniGame={(kind) => setModal({ type: 'minigame', kind })}
          onCasino={() => setModal({ type: 'casino' })}
          onEnter={enterBuilding}
        />
      ) : null}
      <CasinoModal
        visible={modal?.type === 'casino'}
        player={player}
        onClose={() => setModal(null)}
        onResult={(delta, note) => {
          apply((s) => G.casinoResult(s, delta, note));
          if (delta >= 0) sfx.win();
          else sfx.lose();
        }}
      />
      <CareerModal
        visible={modal?.type === 'career'}
        player={player}
        onClose={() => setModal(null)}
        actions={tileActions}
        onMiniGame={(kind) => setModal({ type: 'minigame', kind })}
      />
      <AssetsModal
        visible={modal?.type === 'assets'}
        player={player}
        state={state}
        onClose={() => setModal(null)}
        actions={tileActions}
      />
      <BankModal
        visible={modal?.type === 'bank' || modal?.type === 'invest'}
        player={player}
        state={state}
        onClose={() => setModal(null)}
        actions={tileActions}
      />
      <FamilyModal
        visible={modal?.type === 'family'}
        player={player}
        onClose={() => setModal(null)}
        actions={tileActions}
      />
      <PlayersModal visible={modal?.type === 'players'} state={state} onClose={() => setModal(null)} />
      <MiniGameModal
        visible={modal?.type === 'minigame'}
        kind={modal?.kind}
        player={player}
        onClose={() => setModal(null)}
        onFinish={miniGameFinish}
      />
      <LogModal visible={modal?.type === 'log'} state={state} onClose={() => setModal(null)} />
      <MenuModal
        visible={modal?.type === 'menu'}
        onClose={() => setModal(null)}
        onSave={() => {
          onSave();
          setModal(null);
        }}
        onExit={() => {
          setModal(null);
          onExit();
        }}
        onNewGame={() => {
          setModal(null);
          onRestart();
        }}
        audio={audio}
        music={music}
        onToggleAudio={onToggleAudio}
        onToggleMusic={onToggleMusic}
        cameraMode={cameraMode}
        onCameraMode={setCameraMode}
        state={state}
      />
      <GameOverModal
        visible={state.phase === 'gameover'}
        state={state}
        onRestart={onRestart}
        onClose={() => setModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070b16' },
  sceneWrap: { flex: 1, overflow: 'hidden' },
  sceneOverlay: { ...StyleSheet.absoluteFillObject, paddingTop: 34 },
  busy: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(10,14,26,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.45)',
  },
  busyText: { color: '#ffd166', fontSize: 12, fontWeight: '800' },
});
