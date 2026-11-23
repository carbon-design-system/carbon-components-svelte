// @vitest-environment node
import {
  createLogBuffer,
  formatLogTime,
  logRowText,
  normalizeLevel,
  parseLogLine,
} from "../../src/utils/log-lines.js";

const ESC = "\u001b";

describe("parseLogLine", () => {
  it.each([
    [
      "2026-10-27T09:41:07.123Z ERROR failed to connect",
      {
        text: "failed to connect",
        level: "error",
        time: "2026-10-27T09:41:07.123Z",
      },
    ],
    ["[warn] disk almost full", { text: "disk almost full", level: "warn" }],
    ["error: no such file", { text: "no such file", level: "error" }],
    ["WARNING slow query", { text: "slow query", level: "warn" }],
    [
      "2026-10-27 09:41:07 info started",
      { text: "started", level: "info", time: "2026-10-27 09:41:07" },
    ],
  ])("splits %j", (line, expected) => {
    expect(parseLogLine(line)).toEqual(expected);
  });

  it("does not read a sentence that opens with a level word", () => {
    expect(parseLogLine("Info about the build")).toEqual({
      text: "Info about the build",
    });
    expect(parseLogLine("error handling is hard")).toEqual({
      text: "error handling is hard",
    });
  });

  it("finds a logfmt level without changing the text", () => {
    expect(parseLogLine('ts=1 level=warn msg="slow"')).toEqual({
      text: 'ts=1 level=warn msg="slow"',
      level: "warn",
    });
  });

  it("finds a level inside a color and leaves it in the text", () => {
    expect(
      parseLogLine(`2026-10-27T09:41:07Z ${ESC}[31mERROR${ESC}[0m boom`),
    ).toEqual({
      text: `${ESC}[31mERROR${ESC}[0m boom`,
      level: "error",
      time: "2026-10-27T09:41:07Z",
    });
  });

  it("takes the prefix off a line whose color starts after it", () => {
    expect(parseLogLine(`INFO ${ESC}[32mdone${ESC}[0m`)).toEqual({
      text: `${ESC}[32mdone${ESC}[0m`,
      level: "info",
    });
  });
});

describe("normalizeLevel", () => {
  it("maps aliases onto the four levels", () => {
    expect(
      ["TRACE", "Verbose", "notice", "Warning", "FATAL", "panic"].map(
        normalizeLevel,
      ),
    ).toEqual(["debug", "debug", "info", "warn", "error", "error"]);
    expect(normalizeLevel("loud")).toBeUndefined();
    expect(normalizeLevel(3)).toBeUndefined();
  });
});

describe("formatLogTime", () => {
  it("shows the time of day", () => {
    expect(formatLogTime("2026-10-27T09:41:07.123Z")).toBe("09:41:07.123");
    expect(formatLogTime(Date.UTC(2026, 9, 27, 9, 41, 7, 5))).toBe(
      "09:41:07.005",
    );
    expect(formatLogTime(new Date(Date.UTC(2026, 9, 27, 23, 0, 0)))).toBe(
      "23:00:00.000",
    );
    expect(formatLogTime("noon")).toBe("noon");
    expect(formatLogTime(undefined)).toBe("");
    expect(formatLogTime(Number.NaN)).toBe("");
  });
});

describe("createLogBuffer", () => {
  it("numbers lines in arrival order and counts their levels", () => {
    const buffer = createLogBuffer();
    buffer.append(["ERROR a", "plain", { text: "b", level: "warn" }]);

    expect(buffer.rows.map((row) => row.id)).toEqual([0, 1, 2]);
    expect(buffer.counts).toEqual({ debug: 0, info: 1, warn: 1, error: 1 });
    expect(buffer.nextId).toBe(3);
  });

  it("splits a chunk at newlines and keeps the last redraw of a progress line", () => {
    const buffer = createLogBuffer({ parse: null });
    buffer.append("one\r\ntwo\n");
    buffer.append("10%\r50%\r100%");

    expect(buffer.rows.map((row) => row.text)).toEqual(["one", "two", "100%"]);
  });

  it("keeps the text and the escape-free text apart", () => {
    const buffer = createLogBuffer();
    buffer.append(`${ESC}[32mok${ESC}[0m`);

    expect(buffer.rows[0].text).toBe(`${ESC}[32mok${ESC}[0m`);
    expect(buffer.rows[0].plain).toBe("ok");
  });

  it("drops the oldest lines past maxLines and reports how many", () => {
    const buffer = createLogBuffer({ maxLines: 3, parse: null });
    buffer.append(["a", "b"]);
    const before = buffer.rows;
    const result = buffer.append(["c", "d", "e"]);

    expect(result).toEqual({ added: 3, dropped: 2 });
    expect(buffer.rows.map((row) => row.text)).toEqual(["c", "d", "e"]);
    expect(buffer.rows[0].id).toBe(2);
    expect(buffer.rows).not.toBe(before);
  });

  it("appends in place while under maxLines, so a large buffer is not copied", () => {
    const buffer = createLogBuffer({ maxLines: 10, parse: null });
    buffer.append("a");
    const rows = buffer.rows;
    buffer.append("b");

    expect(buffer.rows).toBe(rows);
  });

  it("counts only the lines that are kept", () => {
    const buffer = createLogBuffer({ maxLines: 1 });
    buffer.append(["ERROR a", "WARN b"]);

    expect(buffer.counts).toEqual({ debug: 0, info: 0, warn: 1, error: 0 });
  });

  it("filters by level as lines arrive and as lines are dropped", () => {
    const buffer = createLogBuffer({ maxLines: 4 });
    buffer.append(["ERROR a", "INFO b", "ERROR c"]);
    buffer.setLevels(new Set(["error"]));
    expect(buffer.view.map((row) => row.text)).toEqual(["a", "c"]);

    buffer.append(["WARN d", "ERROR e", "INFO f"]);
    expect(buffer.rows.map((row) => row.text)).toEqual(["c", "d", "e", "f"]);
    expect(buffer.view.map((row) => row.text)).toEqual(["c", "e"]);
  });

  it("shows a line with no level as info", () => {
    const buffer = createLogBuffer();
    buffer.append(["plain", "ERROR x"]);
    buffer.setLevels(new Set(["info"]));

    expect(buffer.view.map((row) => row.text)).toEqual(["plain"]);
  });

  it("is unfiltered, and shares its array, when every level is shown", () => {
    const buffer = createLogBuffer();
    buffer.append("ERROR a");
    buffer.setLevels(new Set(["error"]));
    expect(buffer.view).not.toBe(buffer.rows);

    buffer.setLevels(new Set(["debug", "info", "warn", "error"]));
    expect(buffer.view).toBe(buffer.rows);
  });

  it("builds copy text from an object line's time and level", () => {
    const buffer = createLogBuffer();
    buffer.append({
      text: `${ESC}[1mgo${ESC}[0m`,
      level: "warn",
      time: "2026-10-27T09:41:07Z",
    });

    expect(logRowText(buffer.rows[0])).toBe("2026-10-27T09:41:07Z WARN go");
  });

  it("empties on clear and numbers from the start again", () => {
    const buffer = createLogBuffer();
    buffer.append(["ERROR a", "b"]);
    buffer.clear();
    buffer.append("c");

    expect(buffer.rows.map((row) => row.id)).toEqual([0]);
    expect(buffer.counts).toEqual({ debug: 0, info: 1, warn: 0, error: 0 });
    expect(buffer.leveled).toBe(false);
  });

  it("trims to a lower maxLines", () => {
    const buffer = createLogBuffer({ parse: null });
    buffer.append(["a", "b", "c"]);

    expect(buffer.setMaxLines(1)).toBe(2);
    expect(buffer.rows.map((row) => row.text)).toEqual(["c"]);
  });
});
