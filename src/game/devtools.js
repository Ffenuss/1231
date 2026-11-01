// Dev-only deep link: ?autostart=1 jumps straight into a running game (used for preview checks).
// It never activates in production builds.
import { Platform } from 'react-native';

export function autostartRequested() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) return false;
  try {
    const params = new URLSearchParams(window.location.search || '');
    return params.get('autostart') === '1' || params.get('screen') === 'game';
  } catch (e) {
    return false;
  }
}

// ?room=bank opens a building interior directly (preview/debug only).
export function roomRequested() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) return null;
  try {
    const params = new URLSearchParams(window.location.search || '');
    return params.get('room');
  } catch (e) {
    return null;
  }
}
