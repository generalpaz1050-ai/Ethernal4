// Resolves cosmetic styles (frames/banners) by id. The catalog is fetched once
// from the backend (/api/shop/items) and cached in-memory + localStorage so that
// avatars across the app render the correct ring/banner without extra requests.
import { shopAPI } from './api';

const STORAGE_KEY = 'ethernal-cosmetics-catalog-v1';

let cache = null;
let inflight = null;

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.frames && parsed.banners) return parsed;
  } catch (e) { /* ignore */ }
  return null;
}

function saveToStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

export async function ensureCatalog() {
  if (cache) return cache;
  const stored = loadFromStorage();
  if (stored) cache = stored;
  if (!inflight) {
    inflight = shopAPI.items().then((res) => {
      cache = res.data;
      saveToStorage(cache);
      return cache;
    }).catch(() => cache).finally(() => { inflight = null; });
  }
  if (cache) return cache; // serve stale while revalidating in background
  return inflight;
}

function findItem(list, id) {
  if (!list) return null;
  for (const it of list) if (it.id === id) return it;
  return null;
}

export function getFrameRing(frameId) {
  const id = frameId || 'default';
  const item = findItem(cache?.frames, id);
  if (!item || !item.ring || item.ring === 'none') return null;
  return item.ring;
}

export function getBannerBackground(bannerId) {
  const id = bannerId || 'default';
  const item = findItem(cache?.banners, id);
  return item?.background || null;
}

export function getPet(petId) {
  const id = petId || 'none';
  return findItem(cache?.pets, id);
}

export function avatarRingStyle(frameId) {
  const ring = getFrameRing(frameId);
  return ring ? { boxShadow: ring } : {};
}
