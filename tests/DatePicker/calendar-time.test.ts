import {
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
