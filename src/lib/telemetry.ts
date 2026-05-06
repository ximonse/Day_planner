import type { SessionEvent } from './types';

const KEY = 'day_planner_session';

export function logEvent(event: Omit<SessionEvent, 'ts'>): void {
  const events = getEvents();
  events.push({ ...event, ts: Date.now() });
  try { sessionStorage.setItem(KEY, JSON.stringify(events)); }
  catch { /* fullt eller ej tillgängligt — ignorera */ }
}

export function getEvents(): SessionEvent[] {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

export function clearEvents(): void {
  sessionStorage.removeItem(KEY);
}
