import type { Block } from '../types';
import { CX, CY } from './geometry';

function pointerAngle(e: PointerEvent, el: SVGElement): number {
  const rect = el.getBoundingClientRect();
  const scaleX = 400 / rect.width;
  const scaleY = 400 / rect.height;
  const x = (e.clientX - rect.left) * scaleX - CX;
  const y = (e.clientY - rect.top)  * scaleY - CY;
  let deg = (Math.atan2(y, x) * 180 / Math.PI) + 90;
  return ((deg % 360) + 360) % 360;
}

// 1h-drag: omfördelar tid mellan delar i ett block
export function make1hDrag(
  blocks: Block[],
  now: number,
  onUpdate: (source: string, blocks: Block[]) => void,
  toSource: (blocks: Block[]) => string,
) {
  let dragging: { blockIdx: number; boundaryIdx: number } | null = null;

  function down(e: PointerEvent, svgEl: SVGElement, blockIdx: number, boundaryIdx: number) {
    dragging = { blockIdx, boundaryIdx };
    svgEl.setPointerCapture(e.pointerId);
  }

  function move(e: PointerEvent, svgEl: SVGElement) {
    if (!dragging) return;
    const deg = pointerAngle(e, svgEl);
    const minsPastHour = (deg / 360) * 60;
    const block = blocks[dragging.blockIdx];
    const blockStartInHour = block.startMin % 60;
    const targetAbsMin = minsPastHour - blockStartInHour;

    // Beräkna ny fördelning
    const { boundaryIdx } = dragging;
    const left  = block.parts.slice(0, boundaryIdx + 1);
    const right = block.parts.slice(boundaryIdx + 1);
    const leftSum  = left.reduce((s, p) => s + p.minutes, 0);
    const rightSum = right.reduce((s, p) => s + p.minutes, 0);
    const total = leftSum + rightSum;
    const newLeft  = Math.max(1, Math.min(total - right.length, Math.round(targetAbsMin)));
    const newRight = total - newLeft;

    if (newLeft >= left.length && newRight >= right.length) {
      // Fördela jämnt inom varje sida
      const leftShare  = Math.floor(newLeft  / left.length);
      const rightShare = Math.floor(newRight / right.length);
      left.forEach(p  => { p.minutes = leftShare;  p.pinned = true; });
      right.forEach(p => { p.minutes = rightShare; p.pinned = true; });
      onUpdate(toSource(blocks), blocks);
    }
  }

  function up() { dragging = null; }

  return { down, move, up };
}

// 12h-drag: flyttar blockgränser i minuter
export function make12hDrag(
  blocks: Block[],
  onUpdate: (source: string, blocks: Block[]) => void,
  toSource: (blocks: Block[]) => string,
) {
  let dragging: { boundaryIdx: number } | null = null;

  function down(e: PointerEvent, svgEl: SVGElement, boundaryIdx: number) {
    dragging = { boundaryIdx };
    svgEl.setPointerCapture(e.pointerId);
  }

  function move(e: PointerEvent, svgEl: SVGElement) {
    if (!dragging) return;
    const deg = pointerAngle(e, svgEl);
    const nowH = Math.floor(Date.now() / 60000) % 720; // approximate hour base
    const minsPast12h = (deg / 360) * 720;
    const { boundaryIdx } = dragging;
    const newTime = Math.round(minsPast12h / 5) * 5; // snap to 5min

    const prev = blocks[boundaryIdx];
    const next = blocks[boundaryIdx + 1];
    if (!prev || !next) return;
    if (newTime <= prev.startMin + 5) return;
    if (newTime >= next.endMin - 5) return;

    prev.endMin  = newTime;
    next.startMin = newTime;
    onUpdate(toSource(blocks), blocks);
  }

  function up() { dragging = null; }

  return { down, move, up };
}
