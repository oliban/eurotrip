// Simple localStorage wrapper for API key management
const API_KEY_STORAGE_KEY = 'eurotrip_anthropic_key';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export function hasApiKey(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(API_KEY_STORAGE_KEY);
}
