// ==== ./src/storage.js ====
import { STORAGE_KEYS, CACHE_TTL } from './constants.js';

export function getEncryptedData() {
  return localStorage.getItem(STORAGE_KEYS.ENCRYPTED_DATA);
}

export function saveEncryptedData(data) {
  localStorage.setItem(STORAGE_KEYS.ENCRYPTED_DATA, data);
}

export function removeEncryptedData() {
  localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_DATA);
}

export function getCachedPasskey() {
  const ttl = sessionStorage.getItem(STORAGE_KEYS.PASSKEY_TTL);
  const passkey = sessionStorage.getItem(STORAGE_KEYS.PASSKEY);
  
  if (ttl && parseInt(ttl) >= Date.now() && passkey) {
    return passkey;
  }
  
  return null;
}

export function cachePasskey(passkey) {
  sessionStorage.setItem(STORAGE_KEYS.PASSKEY_TTL, Date.now() + CACHE_TTL);
  sessionStorage.setItem(STORAGE_KEYS.PASSKEY, passkey);
}

export function clearCachedPasskey() {
  sessionStorage.removeItem(STORAGE_KEYS.PASSKEY);
  sessionStorage.removeItem(STORAGE_KEYS.PASSKEY_TTL);
}
