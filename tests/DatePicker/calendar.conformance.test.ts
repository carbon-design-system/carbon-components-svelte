import flatpickr from "flatpickr";
import { German } from "flatpickr/dist/l10n/de";
import { english } from "flatpickr/dist/l10n/default";
import {
  type CalendarOptions,
  createCalendarEngine,
} from "../../src/DatePicker/calendar.js";

// The engine claims to be a drop-in for flatpickr 4.6.13. Each test runs the
// same input through both and compares the results.

type Instance = {
  formatDate(date: Date, format: string): string;
  parseDate(value: unknown, format?: string): Date | undefined;
  isEnabled(date: Date): boolean;
  setDate(date: unknown, triggerChange?: boolean): void;
  open(): void;
  destroy(): void;
  calendarContainer: HTMLElement;
};

const created: Instance[] = [];

afterEach(() => {
  for (const instance of created.splice(0)) instance.destroy();
  document.body.replaceChildren();
});

function both(options: Record<string, unknown> = {}) {
  const config = { errorHandler: () => {}, ...options };
  const input = () => {
    const element = document.createElement("input");
    document.body.append(element);
    return element;
  };
  const reference = flatpickr(input(), config) as unknown as Instance;
  const engine = createCalendarEngine(
    input(),
    config as CalendarOptions,
  ) as unknown as Instance;
  created.push(reference, engine);
  return { reference, engine };
}

/** Deterministic dates at local midnight, so a failure always reproduces. */
function sampleDates(count: number, seed = 1) {
  let state = seed;
  const next = () => {
    state = (state * 1_103_515_245 + 12_345) % 2 ** 31;
    return state / 2 ** 31;
  };
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const year = 1950 + Math.floor(next() * 130);
    const month = Math.floor(next() * 12);
    const day = 1 + Math.floor(next() * 28);
    dates.push(new Date(year, month, day));
  }
  // ISO week and year edges.
  for (const year of [2015, 2020, 2021, 2026, 2027]) {
    for (let day = 26; day <= 31; day++)
      dates.push(new Date(year - 1, 11, day));
    for (let day = 1; day <= 5; day++) dates.push(new Date(year, 0, day));
  }
  dates.push(new Date(2024, 1, 29), new Date(2000, 1, 29));
  return dates;
}

const DATE_FORMATS = [
  "d",
  "D",
  "l",
  "j",
  "J",
  "w",
  "W",
  "F",
  "m",
  "n",
  "M",
  "U",
  "u",
  "y",
  "Y",
  "Z",
  "Y-m-d",
  "m/d/Y",
  "d.m.Y",
  "F j, Y",
  "l, F J, Y",
  "D M j y",
  "\\W\\e\\e\\k W, Y",
];

describe("formatDate matches flatpickr", () => {
  for (const [name, locale] of [
    ["English", english],
    ["German", German],
  ] as const) {
    it(`formats every date token (${name})`, () => {
      const { reference, engine } = both({ locale });
      const mismatches: string[] = [];
      for (const date of sampleDates(200)) {
        for (const format of DATE_FORMATS) {
          const expected = reference.formatDate(date, format);
          const actual = engine.formatDate(date, format);
          if (actual !== expected) {
            mismatches.push(
              `${format} ${date.toDateString()}: ${actual} != ${expected}`,
            );
          }
        }
      }
      expect(mismatches.slice(0, 10)).toEqual([]);
    });
  }

  it("formats time tokens as midnight, like a date-only flatpickr", () => {
    const { reference, engine } = both();
    const date = new Date(2024, 2, 5);
    for (const format of ["Y-m-d H:i", "h:i K", "G:i:S", "Y-m-d H:i:s"]) {
      expect(engine.formatDate(date, format)).toBe(
        reference.formatDate(date, format),
      );
    }
  });

  it("parses time tokens the same way", () => {
    const { reference, engine } = both();
    for (const [text, format] of [
      ["2024-03-05 14:30", "Y-m-d H:i"],
      ["2024-03-05 2:30:15", "Y-m-d h:i:S"],
      ["2024-03-05 00:00", "Y-m-d H:i"],
    ]) {
      expect(engine.parseDate(text, format)?.getTime()).toBe(
        reference.parseDate(text, format)?.getTime(),
      );
    }
  });
});

describe("parseDate matches flatpickr", () => {
  const PARSE_FORMATS = [
    "Y-m-d",
    "m/d/Y",
    "d.m.Y",
    "F j, Y",
    "j M Y",
    "M j, Y",
    "d/m/y",
    "Ymd",
    "U",
  ];

  it("round-trips formatted dates", () => {
    const { reference, engine } = both();
    const mismatches: string[] = [];
    for (const date of sampleDates(150, 7)) {
      for (const format of PARSE_FORMATS) {
        const text = reference.formatDate(date, format);
        const expected = reference.parseDate(text, format)?.getTime();
        const actual = engine.parseDate(text, format)?.getTime();
        if (expected === undefined)
          mismatches.push(`${format} "${text}": unparsed`);
        if (actual !== expected) {
          mismatches.push(`${format} "${text}": ${actual} != ${expected}`);
        }
      }
    }
    expect(mismatches.slice(0, 10)).toEqual([]);
  });

  it.each([
    ["", "Y-m-d"],
    ["2024-13-45", "Y-m-d"],
    ["02/30/2024", "m/d/Y"],
    ["abc", "Y-m-d"],
    ["2024-2-5", "Y-m-d"],
    [" 2024-02-05 ", "Y-m-d"],
    ["2024-02-05T10:00", "Y-m-d"],
    ["5 Mar 2024", "j M Y"],
    ["March 5, 2024", "F j, Y"],
    ["today", "Y-m-d"],
  ])("parses %j with %s the same way", (text, format) => {
    const { reference, engine } = both();
    const expected = reference.parseDate(text, format);
    const actual = engine.parseDate(text, format);
    if (text === "today") {
      // Both resolve "today" to the current day.
      expect(actual?.toDateString()).toBe(expected?.toDateString());
      return;
    }
    expect(actual?.getTime()).toBe(expected?.getTime());
  });
});

describe("isEnabled matches flatpickr", () => {
  const configs: Array<[string, Record<string, unknown>]> = [
    ["minDate and maxDate", { minDate: "2024-03-05", maxDate: "2024-04-20" }],
    ["disabled dates", { disable: ["2024-03-10", new Date(2024, 2, 12)] }],
    [
      "disabled ranges",
      { disable: [{ from: "2024-03-08", to: "2024-03-14" }] },
    ],
    [
      "disabled weekends",
      { disable: [(date: Date) => date.getDay() === 0 || date.getDay() === 6] },
    ],
    [
      "enabled dates and ranges",
      {
        enable: [
          "2024-03-03",
          { from: "2024-03-20", to: "2024-03-25" },
          (date: Date) => date.getDate() === 1,
        ],
      },
    ],
    [
      "bounds with rules",
      {
        minDate: "2024-03-02",
        maxDate: "2024-04-28",
        disable: [{ from: "2024-04-01", to: "2024-04-07" }],
      },
    ],
  ];

  it.each(configs)("%s", (_, options) => {
    const { reference, engine } = both({ dateFormat: "Y-m-d", ...options });
    const mismatches: string[] = [];
    for (let day = 0; day < 90; day++) {
      const date = new Date(2024, 1, 15 + day);
      if (engine.isEnabled(date) !== reference.isEnabled(date)) {
        mismatches.push(date.toDateString());
      }
    }
    expect(mismatches).toEqual([]);
  });
});

describe("rendered day cells match flatpickr", () => {
  /** Day cells as text, flatpickr classes (Carbon's are the engine's own), and label. */
  const cells = (instance: Instance) =>
    [
      ...instance.calendarContainer.querySelectorAll<HTMLElement>(
        ".dayContainer .flatpickr-day",
      ),
    ].map((cell) =>
      [
        cell.textContent,
        [...cell.classList]
          .filter((name) => !name.startsWith("bx--"))
          .sort()
          .join("."),
        cell.getAttribute("aria-label"),
      ].join(" | "),
    );

  const configs: Array<[string, Record<string, unknown>, unknown?]> = [
    ["single", { defaultDate: "2024-03-15" }],
    [
      "bounds and rules",
      {
        defaultDate: "2024-03-15",
        minDate: "2024-03-04",
        maxDate: "2024-03-27",
        disable: ["2024-03-12", { from: "2024-03-20", to: "2024-03-22" }],
      },
    ],
    ["multiple", { mode: "multiple" }, ["2024-03-04", "2024-03-18"]],
    ["range", { mode: "range" }, ["2024-03-06", "2024-03-14"]],
    ["two months", { showMonths: 2, defaultDate: "2024-03-15" }],
    ["German", { locale: German, defaultDate: "2024-03-15" }],
  ];

  it.each(configs)("%s", (_, options, dates) => {
    const { reference, engine } = both({
      dateFormat: "Y-m-d",
      now: new Date(2024, 2, 9),
      ...options,
    });
    if (dates) {
      reference.setDate(dates);
      engine.setDate(dates);
    }
    reference.open();
    engine.open();

    expect(cells(reference).length).toBeGreaterThanOrEqual(35);
    expect(cells(engine)).toEqual(cells(reference));
  });
});
