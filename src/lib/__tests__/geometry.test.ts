import { describe, it, expect } from 'vitest';
import { degreesToPoint, arcPath, angleFor1h, angleFor12h, CX, CY, R, Ri } from '../clock/geometry';

describe('degreesToPoint', () => {
  it('ger toppen av cirkeln vid 0 grader', () => {
    const { x, y } = degreesToPoint(CX, CY, R, 0);
    expect(x).toBeCloseTo(200);
    expect(y).toBeCloseTo(20);
  });
  it('ger höger sida vid 90 grader', () => {
    const { x, y } = degreesToPoint(CX, CY, R, 90);
    expect(x).toBeCloseTo(380);
    expect(y).toBeCloseTo(200);
  });
});

describe('arcPath', () => {
  it('returnerar SVG path-sträng', () => {
    const path = arcPath(CX, CY, R, Ri, 0, 90);
    expect(path).toMatch(/^M/);
    expect(path).toContain('A');
    expect(path).toContain('Z');
  });
});

describe('angleFor1h', () => {
  it('0 minuter → 0 grader', () => expect(angleFor1h(0)).toBe(0));
  it('30 minuter → 180 grader', () => expect(angleFor1h(30)).toBe(180));
  it('60 minuter → 360 grader', () => expect(angleFor1h(60)).toBe(360));
});

describe('angleFor12h', () => {
  it('0 min → 0 grader', () => expect(angleFor12h(0)).toBe(0));
  it('6h (360min) → 180 grader', () => expect(angleFor12h(360)).toBe(180));
  it('12h (720min) → 360 grader', () => expect(angleFor12h(720)).toBe(360));
});
