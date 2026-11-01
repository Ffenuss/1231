import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SetupScreen from './src/ui/SetupScreen';
import GameScreen from './src/ui/GameScreen';
import { createInitialState } from './src/game/state';
import { saveGame, loadGame, hasSave, clearSave } from './src/game/storage';
import { sfx, startMusic, stopMusic, setAudioEnabled, setMusicEnabled, resumeAudio } from './src/game/audio';
import { createMultiplayer, localIpHint, startHost, joinRoom, publishSnapshot, stopMultiplayer, publishLobby, startBroadcast, sendJoin, sendReady } from './src/game/multiplayer';
import { makeLobbyPlayer, lobbySummary } from './src/game/lobby';
import MultiplayerModal from './src/ui/MultiplayerModal';
import { autostartRequested } from './src/game/devtools';

let idSeq = 0;
const nextId = () => `p${Date.now().toString(36)}${(idSeq += 1)}`;

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [state, setState] = useState(null);
  const [saveExists, setSaveExists] = useState(false);
  const [audio, setAudio] = useState(true);
  const [music, setMusic] = useState(true);
  const [mpInfo, setMpInfo] = useState(null);
  const [mpStatus, setMpStatus] = useState(null);
  const [mpConnected, setMpConnected] = useState(false);
  const [showMp, setShowMp] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [mpRole, setMpRole] = useState(null);
  const mp = useRef(createMultiplayer()).current;
  const isHost = useRef(false);
  const myId = useRef(null);

  useEffect(() => {
    mp.onStatus = (s) => {
      setMpStatus(
        s === 'host-online'
          ? 'Вы хост: состояние игры транслируется в сеть.'
          : s === 'client-online'
          ? 'Подключено к игре хоста.'
          : 'Связь с ретранслятором потеряна.'
      );
      setMpConnected(s.endsWith('online'));
    };
    return () => stopMultiplayer(mp);
  }, [mp]);

  // host broadcasts every state change to the relay
  useEffect(() => {
    if (!state || !isHost.current) return;
    publishSnapshot(mp, state);
  }, [state, mp]);

  useEffect(() => {
    (async () => {
      const exists = await hasSave();
      setSaveExists(exists);
      if (autostartRequested()) {
        setState(
          createInitialState([
            { name: 'Алекс', avatar: '🧑‍💼', isBot: false },
            { name: 'Мария', avatar: '👩‍💼', isBot: true },
            { name: 'Тимур', avatar: '🧑‍🎤', isBot: true },
          ])
        );
        setScreen('game');
      }
    })();
  }, []);

  useEffect(() => {
    setAudioEnabled(audio);
    setMusicEnabled(music);
    if (music) startMusic();
    else stopMusic();
  }, [audio, music]);

  // autosave every 8 turns
  useEffect(() => {
    if (!state || screen !== 'game') return;
    if (state.turn % 8 === 0 && state.turn > 0) saveGame(state);
  }, [state, screen]);

  const startNew = useCallback((configs) => {
    resumeAudio();
    sfx.click();
    const fresh = createInitialState(configs);
    setState(fresh);
    setScreen('game');
  }, []);

  const continueGame = useCallback(async () => {
    const loaded = await loadGame();
    if (loaded) {
      setState(loaded);
      setScreen('game');
    } else {
      Alert.alert('Сохранение не найдено', 'Начните новую игру.');
    }
  }, []);

  const restart = useCallback(() => {
    setState((prev) => {
      const cfg = prev
        ? prev.players.map((p) => ({ name: p.name, avatar: p.avatar, isBot: p.isBot }))
        : [{ name: 'Алекс', avatar: '🧑‍💼', isBot: false }, { name: 'Мария', avatar: '👩‍💼', isBot: true }];
      return createInitialState(cfg);
    });
    setScreen('game');
  }, []);

  const exit = useCallback(() => {
    if (state) saveGame(state);
    setScreen('setup');
  }, [state]);

  const onMultiplayer = useCallback(() => {
    setMpInfo(localIpHint());
    setShowMp(true);
  }, []);

  const hostGame = useCallback(async () => {
    isHost.current = true;
    setMpRole('host');
    myId.current = nextId();
    const me = makeLobbyPlayer(myId.current, 'Вы (хост)', '🧑‍💼', true);
    setLobbyPlayers([me]);
    mp.onAction = (action) => {
      // remote clients drive the shared state through the host's reducer
      if (action && action.type === 'setState' && action.state) setState(action.state);
    };
    mp.onJoin = (msg) => {
      setLobbyPlayers((prev) => {
        if (prev.some((p) => p.id === msg.id)) return prev;
        const next = [...prev, makeLobbyPlayer(msg.id, msg.name || 'Гость', msg.avatar || '🙂', false)];
        publishLobby(mp, next);
        return next;
      });
    };
    mp.onReady = (msg) => {
      setLobbyPlayers((prev) => {
        const next = prev.map((p) => (p.id === msg.id ? { ...p, ready: !!msg.ready } : p));
        publishLobby(mp, next);
        return next;
      });
    };
    mp.onLeave = (msg) => {
      setLobbyPlayers((prev) => {
        const next = prev.filter((p) => p.id !== msg.id);
        publishLobby(mp, next);
        return next;
      });
    };
    await startHost(mp);
  }, [mp]);

  const startMultiplayerGame = useCallback(() => {
    const summary = lobbySummary(lobbyPlayers);
    if (!summary.canStart) {
      setMpStatus('Нужно минимум 2 игрока, и все должны быть готовы.');
      return;
    }
    const cfg = lobbyPlayers.map((p) => ({
      name: p.name,
      avatar: p.avatar,
      isBot: false,
    }));
    const fresh = createInitialState(cfg);
    fresh.multiplayer = true;
    setState(fresh);
    setScreen('game');
    setShowMp(false);
    startBroadcast(mp);
  }, [lobbyPlayers, mp]);

  const joinGame = useCallback(
    async (url) => {
      isHost.current = false;
      setMpRole('client');
      myId.current = nextId();
      mp.onLobby = (players) => setLobbyPlayers(players);
      mp.onStart = () => {
        setShowMp(false);
        setMpStatus('Игра началась — ждём состояния от хоста.');
      };
      const ok = await joinRoom(mp, url, (snapshot) => {
        if (snapshot) {
          setState(snapshot);
          setScreen('game');
        }
      });
      if (!ok) {
        setMpStatus('Не удалось подключиться — проверьте адрес и запущен ли сервер.');
        setMpRole(null);
        return;
      }
      // announce ourselves to the host
      sendJoin(mp, { id: myId.current, name: 'Гость', avatar: '🙂' });
      setLobbyPlayers([makeLobbyPlayer(myId.current, 'Гость', '🙂', false)]);
    },
    [mp]
  );

  const setReady = useCallback(
    (ready) => {
      sendReady(mp, ready);
      setLobbyPlayers((prev) => prev.map((p) => (p.id === myId.current ? { ...p, ready } : p)));
    },
    [mp]
  );

  if (screen === 'setup') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SetupScreen
          onStart={startNew}
          onContinue={continueGame}
          hasSave={saveExists}
          onMultiplayer={onMultiplayer}
          multiplayerInfo={mpInfo}
        />
        <MultiplayerModal
          visible={showMp}
          onClose={() => setShowMp(false)}
          onHost={hostGame}
          onJoin={joinGame}
          onReady={setReady}
          onStart={startMultiplayerGame}
          status={mpStatus}
          connected={mpConnected}
          role={mpRole}
          players={lobbyPlayers}
          youId={myId.current}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <GameScreen
        state={state}
        setState={setState}
        onExit={exit}
        onSave={() => saveGame(state)}
        onRestart={restart}
        audio={audio}
        music={music}
        onToggleAudio={() => setAudio((a) => !a)}
        onToggleMusic={() => setMusic((m) => !m)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070b16' },
});
