import type { Block, Part } from './types';

function parseTime(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function parseSource(source: string): Block[] {
  const lines = source.split('\n');
  const blocks: Block[] = [];
  let current: Block | null = null;
  let lastPart: Part | null = null;
  const explicitEnd = new Set<string>();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#')) {
      const m = line.match(/^#(.+?)\s+(\d{2}:\d{2})(?:-(\d{2}:\d{2}))?$/);
      if (!m) continue;
      const id = uid();
      current = {
        id,
        title: m[1].trim(),
        startMin: parseTime(m[2]),
        endMin: m[3] ? parseTime(m[3]) : parseTime(m[2]) + 60,
        parts: [],
      };
      if (m[3]) explicitEnd.add(id);
      blocks.push(current);
      lastPart = null;
      continue;
    }

    if (!current) continue;

    if (line.startsWith('- ')) {
      if (lastPart) lastPart.note = line.slice(2).trim();
      continue;
    }

    const minuteMatch = line.match(/^(.+?)\s+(\d+)m$/);
    const part: Part = {
      id: uid(),
      title: minuteMatch ? minuteMatch[1].trim() : line,
      minutes: minuteMatch ? parseInt(minuteMatch[2]) : 0,
      pinned: !!minuteMatch,
      note: '',
      warning: false,
    };
    current.parts.push(part);
    lastPart = part;
  }

  // Sätt endMin från nästa blocks startMin (om inte explicit)
  for (let i = 0; i < blocks.length - 1; i++) {
    if (!explicitEnd.has(blocks[i].id)) {
      blocks[i].endMin = blocks[i + 1].startMin;
    }
  }

  // Auto-fördela minuter bland unpinned parts
  for (const block of blocks) {
    const total = block.endMin - block.startMin;
    const pinnedSum = block.parts.filter(p => p.pinned).reduce((s, p) => s + p.minutes, 0);
    const unpinned = block.parts.filter(p => !p.pinned);
    const each = unpinned.length > 0 ? Math.max(1, Math.floor((total - pinnedSum) / unpinned.length)) : 0;
    for (const p of unpinned) p.minutes = each;
  }

  return blocks;
}
