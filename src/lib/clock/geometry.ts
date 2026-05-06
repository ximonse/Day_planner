export const CX = 200;
export const CY = 200;
export const R  = 180;   // ytterradie
export const Ri = 90;    // innerradie (donut-hål)

export function degreesToPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function arcPath(cx: number, cy: number, r: number, ri: number, startDeg: number, endDeg: number): string {
  // Normalisera: aldrig exakt 360 (skapar osynlig path)
  const span = ((endDeg - startDeg) + 360) % 360 || 359.999;
  const end = startDeg + span;
  const large = span > 180 ? 1 : 0;
  const o1 = degreesToPoint(cx, cy, r,  startDeg);
  const o2 = degreesToPoint(cx, cy, r,  end);
  const i1 = degreesToPoint(cx, cy, ri, startDeg);
  const i2 = degreesToPoint(cx, cy, ri, end);
  return `M ${o1.x} ${o1.y} A ${r} ${r} 0 ${large} 1 ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${ri} ${ri} 0 ${large} 0 ${i1.x} ${i1.y} Z`;
}

export function angleFor1h(minutesPastHour: number): number {
  return (minutesPastHour / 60) * 360;
}

export function angleFor12h(minutesSinceMidnight: number): number {
  const normalized = minutesSinceMidnight % 720;
  // Om vi är exakt på 720 (12h), returnera 360 istället för 0
  return normalized === 0 && minutesSinceMidnight > 0 ? 360 : (normalized / 720) * 360;
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function handPath(cx: number, cy: number, r: number, deg: number): string {
  const tip   = degreesToPoint(cx, cy, r,    deg);
  const left  = degreesToPoint(cx, cy, 8,    deg - 90);
  const right = degreesToPoint(cx, cy, 8,    deg + 90);
  const base  = degreesToPoint(cx, cy, 18,   deg + 180);
  return `M ${left.x} ${left.y} L ${tip.x} ${tip.y} L ${right.x} ${right.y} L ${base.x} ${base.y} Z`;
}
