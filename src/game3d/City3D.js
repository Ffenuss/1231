// GLView wrapper: boots the Three.js city and drives its render loop.
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import { CityScene } from './CityScene';

export default function City3D({ players, activeIndex, activeTile, cameraMode, onReady, style }) {
  const sceneRef = useRef(null);
  const rafRef = useRef(null);
  const glRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const gesture = useRef({ lastX: 0, startDist: 0 });
  const latest = useRef({ players, activeIndex, activeTile, cameraMode });
  useEffect(() => {
    latest.current = { players, activeIndex, activeTile, cameraMode };
  }, [players, activeIndex, activeTile, cameraMode]);

  // Drag to orbit, pinch to zoom — keeps the 3D city interactive on touch screens.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
        onPanResponderGrant: (e) => {
          gesture.current.lastX = e.nativeEvent.pageX;
          gesture.current.startDist = 0;
        },
        onPanResponderMove: (e) => {
          const scene = sceneRef.current;
          if (!scene) return;
          const touches = e.nativeEvent.touches || [];
          if (touches.length >= 2) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (gesture.current.startDist) {
              const factor = gesture.current.startDist / Math.max(1, dist);
              scene.zoomCamera(Math.pow(factor, 0.35));
            }
            gesture.current.startDist = dist;
          } else {
            const px = e.nativeEvent.pageX;
            const delta = (px - gesture.current.lastX) * 0.0075;
            gesture.current.lastX = px;
            scene.rotateCamera(delta);
            gesture.current.startDist = 0;
          }
        },
      }),
    []
  );

  const onContextCreate = useCallback(
    (gl) => {
      glRef.current = gl;
      const scene = new CityScene(gl, { quality: 'high' });
      sceneRef.current = scene;
      if (latest.current.players) scene.setPlayers(latest.current.players);
      scene.setActivePlayer(latest.current.activeIndex || 0);
      scene.setCameraMode(latest.current.cameraMode || 'orbit');
      if (onReady) onReady(scene);

      let stopped = false;
      const loop = () => {
        if (stopped) return;
        rafRef.current = requestAnimationFrame(loop);
        try {
          scene.update(1 / 60);
          scene.render();
          gl.endFrameEXP();
        } catch (e) {
          console.warn('render error', e);
        }
      };
      loop();
      sceneRef.current.__stop = () => {
        stopped = true;
      };
    },
    [onReady]
  );

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width < 2 || height < 2) return;
    sizeRef.current = { w: width, h: height };
    const gl = glRef.current;
    if (!gl) return;
    const dpr = 1;
    gl.setNativeProps({ width: Math.round(width * dpr), height: Math.round(height * dpr) });
    const scene = sceneRef.current;
    if (scene) scene.resize(Math.round(width * dpr), Math.round(height * dpr));
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (players) scene.setPlayers(players);
    scene.setActivePlayer(activeIndex || 0);
    if (typeof activeTile === 'number') {
      scene.activeTile = activeTile;
      scene.focusTile(activeTile);
    }
  }, [players, activeIndex, activeTile]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (scene && cameraMode) scene.setCameraMode(cameraMode);
  }, [cameraMode]);

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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', backgroundColor: '#0b1020' },
  gl: { flex: 1 },
});
