import {
  bollinger,
  ema,
  macd,
  rsi,
  sma,
} from "../../../src/viz/utils/indicators.js";

const closes = [44, 44.5, 44.2, 44.8, 45.1, 44.9, 45.4, 45.9, 45.6, 46.2];

describe("indicators", () => {
  it("warm up with nulls and then follow the window", () => {
    const simple = sma(closes, 3);
    expect(simple.slice(0, 2)).toEqual([null, null]);
    expect(simple[2]).toBeCloseTo(44.2333, 3);
    expect(simple[3]).toBeCloseTo(44.5, 3);
    expect(ema(closes, 3)[2]).toBeCloseTo(44.2333, 3);
    expect(ema(closes, 3)[3]).toBeCloseTo(44.5167, 3);
    const bands = bollinger(closes, 3, 2);
    expect(bands.upper[3]).toBeGreaterThan(bands.middle[3] as number);
    expect(bands.lower[3]).toBeLessThan(bands.middle[3] as number);
    const strength = rsi(closes, 3);
    expect(strength.slice(0, 3)).toEqual([null, null, null]);
    for (const value of strength.slice(3)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    const out = macd(closes, 2, 4, 2);
    expect(out.macd[2]).toBeNull();
    expect(out.macd[3]).not.toBeNull();
    expect(out.histogram[4]).toBeCloseTo(
      (out.macd[4] as number) - (out.signal[4] as number),
      10,
    );
  });
});
