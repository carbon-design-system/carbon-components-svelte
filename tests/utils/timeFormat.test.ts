import {
  formatTime,
  getTimeInputPreset,
  isValidTime,
  parseTime,
} from "../../src/utils/timeFormat.js";

describe("getTimeInputPreset", () => {
  test("returns 12-hour defaults without seconds", () => {
    expect(getTimeInputPreset("12")).toEqual({
      pattern: "(0?[1-9]|1[012]):[0-5][0-9](\\s)?",
      placeholder: "hh:mm",
      maxlength: 5,
    });
  });

  test("returns 24-hour defaults without seconds", () => {
    expect(getTimeInputPreset("24")).toEqual({
      pattern: "([01]?[0-9]|2[0-3]):[0-5][0-9](\\s)?",
      placeholder: "hh:mm",
      maxlength: 5,
    });
  });

  test("extends maxlength and pattern when seconds are enabled", () => {
    expect(getTimeInputPreset("12", true)).toMatchObject({
      placeholder: "hh:mm:ss",
      maxlength: 8,
    });
    expect(getTimeInputPreset("24", true)).toMatchObject({
      placeholder: "hh:mm:ss",
      maxlength: 8,
    });
  });
});

describe("parseTime", () => {
  test("treats empty input as valid", () => {
    expect(parseTime("")).toEqual({
      valid: true,
      value: "",
      hours: null,
      minutes: null,
      seconds: null,
    });
  });

  test("parses 12-hour colon values", () => {
    expect(parseTime("9:30")).toEqual({
      valid: true,
      value: "09:30",
      hours: 9,
      minutes: 30,
      seconds: null,
    });
    expect(parseTime("12:00", { format: "12" }).valid).toBe(true);
  });

  test("parses 24-hour values including 14:30", () => {
    expect(parseTime("14:30", { format: "24" })).toEqual({
      valid: true,
      value: "14:30",
      hours: 14,
      minutes: 30,
      seconds: null,
    });
    expect(parseTime("00:00", { format: "24" }).valid).toBe(true);
    expect(parseTime("23:59", { format: "24" }).valid).toBe(true);
  });

  test("rejects out-of-range hours for each format", () => {
    expect(parseTime("0:30", { format: "12" }).valid).toBe(false);
    expect(parseTime("13:00", { format: "12" }).valid).toBe(false);
    expect(parseTime("24:00", { format: "24" }).valid).toBe(false);
  });

  test("normalizes compact digit strings", () => {
    expect(parseTime("930")).toEqual({
      valid: true,
      value: "09:30",
      hours: 9,
      minutes: 30,
      seconds: null,
    });
    expect(parseTime("0930")).toEqual({
      valid: true,
      value: "09:30",
      hours: 9,
      minutes: 30,
      seconds: null,
    });
    expect(parseTime("9")).toEqual({
      valid: true,
      value: "09:00",
      hours: 9,
      minutes: 0,
      seconds: null,
    });
  });

  test("parses seconds when enabled", () => {
    expect(parseTime("9:30:05", { format: "12", seconds: true })).toEqual({
      valid: true,
      value: "09:30:05",
      hours: 9,
      minutes: 30,
      seconds: 5,
    });
    expect(parseTime("93045", { format: "12", seconds: true })).toEqual({
      valid: true,
      value: "09:30:45",
      hours: 9,
      minutes: 30,
      seconds: 45,
    });
    expect(parseTime("14:30:00", { format: "24", seconds: true }).valid).toBe(
      true,
    );
  });

  test("rejects invalid characters and partial colon forms", () => {
    expect(parseTime("9:3a").valid).toBe(false);
    expect(parseTime("9:").valid).toBe(false);
    expect(parseTime(":30").valid).toBe(false);
    expect(parseTime("9:30:61", { seconds: true }).valid).toBe(false);
    expect(parseTime("930", { seconds: true }).valid).toBe(true);
  });

  test("leaves the original value when invalid", () => {
    expect(parseTime("abc").value).toBe("abc");
    expect(parseTime("99:99", { format: "24" }).value).toBe("99:99");
  });
});

describe("formatTime", () => {
  test("pads parts for display", () => {
    expect(formatTime(9, 5)).toBe("09:05");
    expect(formatTime(14, 30, { format: "24" })).toBe("14:30");
    expect(formatTime(9, 30, { seconds: 5 })).toBe("09:30:05");
  });

  test("returns null for out-of-range parts", () => {
    expect(formatTime(0, 30, { format: "12" })).toBe(null);
    expect(formatTime(24, 0, { format: "24" })).toBe(null);
    expect(formatTime(9, 60)).toBe(null);
  });
});

describe("isValidTime", () => {
  test("mirrors parseTime validity", () => {
    expect(isValidTime("14:30", { format: "24" })).toBe(true);
    expect(isValidTime("14:30", { format: "12" })).toBe(false);
    expect(isValidTime("")).toBe(true);
  });
});
