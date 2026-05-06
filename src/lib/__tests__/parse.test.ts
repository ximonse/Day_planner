import { describe, it, expect } from 'vitest';
import { parseSource } from '../parse';

describe('parseSource', () => {
  it('parses block with start time', () => {
    const [b] = parseSource('#Morgon 06:05\nVakna\n');
    expect(b.title).toBe('Morgon');
    expect(b.startMin).toBe(365);
  });

  it('sets endMin from next block startMin', () => {
    const [a, b] = parseSource('#A 06:00\nDel\n\n#B 06:30\nDel\n');
    expect(a.endMin).toBe(390);
    expect(b.startMin).toBe(390);
  });

  it('defaults endMin to startMin + 60 for last block', () => {
    const [a] = parseSource('#A 08:00\nDel\n');
    expect(a.endMin).toBe(540);
  });

  it('respects explicit HH:MM-HH:MM', () => {
    const [b] = parseSource('#Start 07:45-08:00\nDel\n');
    expect(b.startMin).toBe(465);
    expect(b.endMin).toBe(480);
  });

  it('parses pinned part minutes', () => {
    const [b] = parseSource('#A 06:00\nPacka 10m\n');
    expect(b.parts[0].title).toBe('Packa');
    expect(b.parts[0].minutes).toBe(10);
    expect(b.parts[0].pinned).toBe(true);
  });

  it('auto-distributes minutes among unpinned parts', () => {
    const [b] = parseSource('#A 06:00-06:30\nDel1\nDel2\n');
    expect(b.parts[0].minutes).toBe(15);
    expect(b.parts[1].minutes).toBe(15);
  });

  it('parses note lines', () => {
    const [b] = parseSource('#A 06:00\nDel\n- anteckning\n');
    expect(b.parts[0].note).toBe('anteckning');
  });

  it('gives unique ids to parts', () => {
    const [b] = parseSource('#A 06:00\nDel1\nDel2\n');
    expect(b.parts[0].id).not.toBe(b.parts[1].id);
  });
});
