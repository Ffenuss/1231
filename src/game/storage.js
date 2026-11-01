// Save / load helpers (AsyncStorage on native + web).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAVE_VERSION } from './state';

const KEY = 'lifebiz.save.v3';
const SETTINGS_KEY = 'lifebiz.settings.v1';

export async function saveGame(state) {
  try {
    const payload = JSON.stringify({ ...state, savedAt: Date.now(), version: SAVE_VERSION });
    await AsyncStorage.setItem(KEY, payload);
    return true;
  } catch (e) {
    console.warn('save failed', e);
    return false;
  }
}

export async function loadGame() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== SAVE_VERSION) return null;
    return data;
  } catch (e) {
    console.warn('load failed', e);
    return null;
  }
}

export async function hasSave() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return !!raw;
  } catch (e) {
    return false;
  }
}

export async function clearSave() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    /* ignore */
  }
}

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
