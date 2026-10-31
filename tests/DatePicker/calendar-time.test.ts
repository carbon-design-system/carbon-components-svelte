import {
  clampTime,
  effectiveDateFormat,
  resolveHourCycle,
  widestValueLength,
} from "../../src/DatePicker/calendar-time.js";

describe("resolveHourCycle", () => {
  it("follows a time in dateFormat, else the locale's clock", () => {
    expect(resolveHourCycle("auto", "m/d/Y H:i", "en")).toBe("24");
    expect(resolveHourCycle("auto", "d.m.Y h:i K", "de")).toBe("12");
    expect(resolveHourCycle("auto", "m/d/Y", "en")).toBe("12");
    expect(resolveHourCycle("auto", "d.m.Y", "de")).toBe("24");
    expect(resolveHourCycle("24", "m/d/Y h:i K", "en")).toBe("24");
  });
});

describe("effectiveDateFormat", () => {
  it("adds a time only when dateFormat has none", () => {
    expect(effectiveDateFormat("m/d/Y", "minute", "12")).toBe("m/d/Y h:i K");
    expect(effectiveDateFormat("Y-m-d", "second", "24")).toBe("Y-m-d H:i:S");
    expect(effectiveDateFormat("Y-m-d \\a\\t H:i", "minute", "12")).toBe(
      "Y-m-d \\a\\t H:i",
    );
    expect(effectiveDateFormat("m/d/Y", undefined, "12")).toBe("m/d/Y");
  });
});

describe("widestValueLength", () => {
  it("counts the widest date and time the format writes, wide letters twice", () => {
    expect(widestValueLength("m/d/Y h:i K", "en")).toBe(19);
    expect(widestValueLength("m/d/Y h:i:S K", "en")).toBe(22);
    expect(widestValueLength("m/d/Y H:i", "en")).toBe(16);
    expect(widestValueLength("m/d/Y h:i K", "ko")).toBeGreaterThan(19);
  });
});

describe("clampTime", () => {
  const at = (hours: number) => ({ hours, minutes: 0, seconds: 0 });
  const hour = 3600;

  it("moves a time to the nearer edge of the same day", () => {
    const window = { min: 8 * hour, max: 18 * hour };
    expect(clampTime(at(0), window)).toEqual(at(8));
    expect(clampTime(at(23), window)).toEqual(at(18));
  });

  it("measures across midnight for a window that wraps it", () => {
    const window = { min: 22 * hour, max: 6 * hour };
    expect(clampTime(at(12), window)).toEqual(at(6));
    expect(clampTime(at(15), window)).toEqual(at(22));
  });

  it("keeps a minDate's day from starting before its time", () => {
    const window = { min: 8 * hour, max: 18 * hour, from: 13 * hour };
    expect(clampTime(at(0), window)).toEqual(at(13));
  });
});
