// GLView wrapper for the walkable interior: renders the room and feeds joystick input.
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import { InteriorScene } from './InteriorScene';
import { sfx } from '../game/audio';

export default function Interior3D({ roomType, onInteract, onExit, onNearest, onNpcTalk, style }) {
  const sceneRef = useRef(null);
  const rafRef = useRef(null);
  const glRef = useRef(null);
  const padRef = useRef({ x: 0, y: 0, r: 60 });
  const joyRef = useRef(null);
  const handlers = useRef({ onInteract, onExit, onNearest, onNpcTalk });
  useEffect(() => {
    handlers.current = { onInteract, onExit, onNearest, onNpcTalk };
  }, [onInteract, onExit, onNearest, onNpcTalk]);

  const onContextCreate = useCallback(
    (gl) => {
      glRef.current = gl;
      const scene = new InteriorScene(gl, {
        roomType,
        onInteract: (label, npcIndex) =>
          handlers.current.onInteract && handlers.current.onInteract(label, npcIndex),
        onStep: () => sfx.footstep(),
        onNpcTalk: (line, name) => {
          sfx.voice(0.8 + Math.random() * 0.6);
          if (handlers.current.onNpcTalk) handlers.current.onNpcTalk(line, name);
        },
      });
      sceneRef.current = scene;
      let stopped = false;
      const loop = () => {
        if (stopped) return;
        rafRef.current = requestAnimationFrame(loop);
        try {
          scene.update(1 / 60);
          scene.render();
          gl.endFrameEXP();
          if (handlers.current.onNearest) {
            handlers.current.onNearest(scene.nearest ? scene.nearest.label : null);
          }
        } catch (e) {
          console.warn('interior render error', e);
        }
      };
      loop();
      scene.__stop = () => {
        stopped = true;
      };
    },
    [roomType]
  );

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width < 2 || height < 2) return;
    const gl = glRef.current;
    if (gl) gl.setNativeProps({ width: Math.round(width), height: Math.round(height) });
    if (sceneRef.current) sceneRef.current.resize(Math.round(width), Math.round(height));
  }, []);

  // Left half of the screen = joystick; a tap on the character area = interact.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          padRef.current = { x: locationX, y: locationY, r: 70 };
          if (joyRef.current) {
            joyRef.current.setNativeProps({
              style: { left: locationX - 45, top: locationY - 45, opacity: 1 },
            });
          }
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          const dx = locationX - padRef.current.x;
          const dy = locationY - padRef.current.y;
          const dist = Math.hypot(dx, dy) || 1;
          const clamped = Math.min(1, dist / padRef.current.r);
          const nx = (dx / dist) * clamped;
          const ny = (dy / dist) * clamped;
          if (sceneRef.current) sceneRef.current.setJoystick(nx, ny);
          if (joyRef.current) {
            joyRef.current.setNativeProps({
              style: {
                left: padRef.current.x + nx * padRef.current.r - 45,
                top: padRef.current.y + ny * padRef.current.r - 45,
              },
            });
          }
        },
        onPanResponderRelease: () => {
          if (sceneRef.current) sceneRef.current.setJoystick(0, 0);
          if (joyRef.current) joyRef.current.setNativeProps({ style: { opacity: 0 } });
        },
      }),
    []
  );

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const scene = sceneRef.current;
      if (scene) {
        if (scene.__stop) scene.__stop();
        scene.dispose();
      }
      sceneRef.current = null;
    },
    []
  );

  return (
    <View style={[styles.wrap, style]} onLayout={onLayout} {...panResponder.panHandlers}>
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
      <View
        ref={joyRef}
        pointerEvents="none"
        style={[styles.joystick, { opacity: 0 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', backgroundColor: '#0a0f1c' },
  gl: { flex: 1 },
  joystick: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(77,210,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(77,210,255,0.7)',
  },
});
