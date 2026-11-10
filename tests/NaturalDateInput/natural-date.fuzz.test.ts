// @vitest-environment node
// @depends-on src/NaturalDateInput/**
import { readdirSync, readFileSync } from "node:fs";
import {
  NATURAL_DATE_EN,
  NATURAL_DATE_MAX_LENGTH,
  type NaturalDateOptions,
  parseNaturalDate,
} from "../../src/NaturalDateInput/natural-date.js";

// Parsing text a person typed must never throw, hang or return a date that
// is not one. These inputs are hostile on purpose.

const NOW = new Date("2026-11-12T15:30:00Z");

/** A seeded generator, so a failure repeats. */
function random(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LOCALES = [
  "en-US",
  "en-GB",
  "de",
  "ja",
  "ar-SA",
  "hu",
  "ru",
  "not a locale",
];
const ZONES = [
  "UTC",
  "America/New_York",
  "Asia/Kathmandu",
  "Australia/Lord_Howe",
  "Nowhere/Land",
];

/** Run `parse`, and fail with the input when it throws or is not well formed. */
function check(text: string, options: NaturalDateOptions) {
  let r: ReturnType<typeof parseNaturalDate>;
  try {
    r = parseNaturalDate(text, options);
  } catch (error) {
    throw new Error(`threw on ${JSON.stringify(text.slice(0, 200))}`, {
      cause: error,
    });
  }
  if (r.ok) {
    const ok =
      r.date instanceof Date &&
      Number.isFinite(r.date.getTime()) &&
      r.year >= 1000 &&
      r.year <= 9999 &&
      r.month >= 1 &&
      r.month <= 12 &&
      r.day >= 1 &&
      r.day <= 31 &&
      r.hour >= 0 &&
      r.hour <= 23 &&
      r.minute >= 0 &&
      r.minute <= 59 &&
      typeof r.hasTime === "boolean" &&
      r.ambiguous === (r.alternative !== null) &&
      (r.alternative === null || Number.isFinite(r.alternative.getTime()));
    if (!ok)
      throw new Error(
        `bad result for ${JSON.stringify(text)}: ${JSON.stringify(r)}`,
      );
  } else {
    const ok =
      typeof r.reason === "string" &&
      Number.isInteger(r.index) &&
      r.index >= 0 &&
      r.index <= NATURAL_DATE_MAX_LENGTH;
    if (!ok)
      throw new Error(
        `bad failure for ${JSON.stringify(text)}: ${JSON.stringify(r)}`,
      );
  }
  return r;
}

/** Fail when `run` takes longer than `ms`. */
function within(ms: number, label: string, run: () => void) {
  const start = performance.now();
  run();
  const took = performance.now() - start;
  if (took > ms)
    throw new Error(`${label} took ${Math.round(took)} ms, over ${ms} ms`);
}

const VOCAB = [
  ...Object.keys(NATURAL_DATE_EN.words),
  ..."monday tuesday friday sunday jan feb march dec december 2026 2027 15 3 12 31 0 99999 00 1st 2nd 3rd 15th".split(
    " ",
  ),
  "/",
  "-",
  ".",
  ":",
  ",",
  "3pm",
  "15:00",
  "3:30pm",
  "am",
  "pm",
  "a.m.",
  "p.m.",
  "3/12",
  "2026-12-03",
  "12.3.2026",
  "'",
  String.fromCharCode(0xa0),
  "\t",
];

/** Words, numbers and separators in any order. */
function soup(rand: () => number) {
  const n = 1 + Math.floor(rand() * 8);
  let out = "";
  for (let i = 0; i < n; i++) {
    out += VOCAB[Math.floor(rand() * VOCAB.length)];
    out += rand() < 0.7 ? " " : "";
  }
  return out;
}

/** Characters from every part of Unicode, lone surrogates included. */
function noise(rand: () => number) {
  const n = Math.floor(rand() * 60);
  let out = "";
  for (let i = 0; i < n; i++) {
    const pick = rand();
    out += String.fromCharCode(
      pick < 0.3
        ? 32 + Math.floor(rand() * 95)
        : pick < 0.5
          ? 0xd800 + Math.floor(rand() * 0x800)
          : Math.floor(rand() * 0xffff),
    );
  }
  return out;
}

function options(rand: () => number): NaturalDateOptions {
  return {
    now: NOW,
    locale: LOCALES[Math.floor(rand() * LOCALES.length)],
    timeZone: ZONES[Math.floor(rand() * ZONES.length)],
    prefer: (["future", "past", "nearest"] as const)[Math.floor(rand() * 3)],
  };
}

describe("fuzz", () => {
  it("never throws on 4,000 strings of words, numbers and separators", () => {
    const rand = random(1);
    within(4000, "soup", () => {
      for (let i = 0; i < 4000; i++) check(soup(rand), options(rand));
    });
  });

  it("never throws on 2,000 strings of random characters", () => {
    const rand = random(2);
    within(4000, "noise", () => {
      for (let i = 0; i < 2000; i++) check(noise(rand), options(rand));
    });
  });

  it("reads every prefix and suffix of a real sentence", () => {
    const samples = [
      "next Fri at 3:30 pm",
      "tomorrow 15:00",
      "in 2 weeks",
      "end of next month",
      "3rd of december 2027 at noon",
      "12.3.2026 14:15",
      "2026-12-03 09:00",
      "fri nov 20 eod",
      "2 hours ago",
      "dec. 3, 2027 3 p.m.",
    ];
    within(4000, "prefixes", () => {
      for (const text of samples) {
        for (let i = 0; i <= text.length; i++) {
          check(text.slice(0, i), { now: NOW, locale: "en-US" });
          check(text.slice(i), { now: NOW, locale: "en-GB" });
        }
      }
    });
  });

  it("finishes hostile shapes quickly", () => {
    const big = NATURAL_DATE_MAX_LENGTH * 4000;
    const shapes: Record<string, string> = {
      "100,000 spaces": " ".repeat(100_000),
      "100,000 digits": "1".repeat(100_000),
      "100,000 letters": "a".repeat(100_000),
      "100,000 dots": ".".repeat(100_000),
      "50,000 slashes": "3/".repeat(50_000),
      "one number and 100,000 spaces": `3${" ".repeat(100_000)}`,
      "a 500,000-character string": "tomorrow ".repeat(55_556),
      [`${big} characters`]: "x".repeat(big),
      "127 digits": "9".repeat(127),
      "127 dots after a digit": `1${".".repeat(126)}`,
      "dots between spaced digits": "1. ".repeat(42),
      "24 numbers": Array(24).fill("1").join("/"),
      "40 'in'": "in ".repeat(40),
      "25 'next'": "next ".repeat(25),
      colons: ":".repeat(127),
      dashes: "-".repeat(127),
      decimals: "3.".repeat(63),
      "letters with dots": "p.".repeat(63),
      "combining marks": `e${String.fromCharCode(0x301).repeat(126)}`,
      emoji: String.fromCodePoint(0x1f600).repeat(63),
      "lone surrogates": "\ud800".repeat(127),
      "right-to-left marks": String.fromCharCode(0x200f).repeat(127),
    };
    for (const [label, text] of Object.entries(shapes)) {
      within(50, label, () => {
        for (let i = 0; i < 20; i++) check(text, { now: NOW, locale: "de" });
      });
    }
  });

  it("stops a string over the limit before reading it", () => {
    const text = `tomorrow${" ".repeat(NATURAL_DATE_MAX_LENGTH)}`;
    expect(check(text, { now: NOW })).toMatchObject({ reason: "too-long" });
  });

  it("answers the same twice", () => {
    const rand = random(3);
    for (let i = 0; i < 500; i++) {
      const text = soup(rand);
      const o = options(rand);
      expect(parseNaturalDate(text, o)).toEqual(parseNaturalDate(text, o));
    }
  });

  it("does not read words from the prototype", () => {
    for (const word of [
      "constructor",
      "__proto__",
      "toString",
      "hasOwnProperty",
      "valueOf",
    ]) {
      expect(check(`${word} tomorrow`, { now: NOW })).toMatchObject({
        ok: false,
      });
      expect(check(word, { now: NOW })).toMatchObject({ ok: false });
    }
  });

  it("agrees with the calendar on every ISO date it is given", () => {
    const rand = random(4);
    for (let i = 0; i < 3000; i++) {
      const year = 1000 + Math.floor(rand() * 9000);
      const month = Math.floor(rand() * 14);
      const day = Math.floor(rand() * 34);
      const text = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const probe = new Date(0);
      probe.setUTCFullYear(year, month - 1, day);
      const real =
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        probe.getUTCFullYear() === year &&
        probe.getUTCMonth() === month - 1 &&
        probe.getUTCDate() === day;
      const r = check(text, { now: NOW, timeZone: "UTC", locale: "en-US" });
      expect([text, r.ok && [r.year, r.month, r.day].join("-")]).toEqual([
        text,
        real ? [year, month, day].join("-") : false,
      ]);
    }
  });

  it("agrees with Intl on every numeric date in the locale's own order", () => {
    const rand = random(5);
    const lost: string[] = [];
    for (const locale of [
      "en-US",
      "en-GB",
      "de",
      "fr",
      "nl",
      "it",
      "es",
      "pl",
      "sv",
      "hu",
      "ja",
      "ko",
    ]) {
      const numeric = new Intl.DateTimeFormat(locale, {
        timeZone: "UTC",
        calendar: "gregory",
        numberingSystem: "latn",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      for (let i = 0; i < 100; i++) {
        const when = Date.UTC(
          2000 + Math.floor(rand() * 90),
          Math.floor(rand() * 12),
          1 + Math.floor(rand() * 28),
        );
        const text = numeric.format(when);
        const r = check(text, { now: NOW, locale, timeZone: "UTC" });
        if (!r.ok || r.date.getTime() !== when) lost.push(`${locale} ${text}`);
      }
    }
    // Korean writes "2026. 12. 3." and Hungarian "2026. 12. 03.": the dots
    // between spaced numbers are separators. Both are read.
    expect(lost).toEqual([]);
  });
});

describe("what the code is allowed to do", () => {
  const dir = new URL("../../src/NaturalDateInput/", import.meta.url);
  const files = readdirSync(dir).filter((name) => /\.(js|svelte)$/.test(name));

  it("has files to read", () => {
    expect(files).toContain("natural-date.js");
    expect(files).toContain("NaturalDateInput.svelte");
  });

  it.each(files)(
    "%s has no eval, Function, import() or RegExp from text",
    (name) => {
      const source = readFileSync(new URL(name, dir), "utf8")
        // Comments may name them.
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(source).not.toMatch(/\beval\s*\(/);
      expect(source).not.toMatch(/\bnew\s+Function\b|\bFunction\s*\(/);
      expect(source).not.toMatch(/\bimport\s*\(/);
      expect(source).not.toMatch(/\bnew\s+RegExp\b|\bRegExp\s*\(/);
      expect(source).not.toMatch(/\bwith\s*\(/);
      expect(source).not.toMatch(/\{@html\b/);
    },
  );

  it("the parser sets no timer and reads no global", () => {
    const source = readFileSync(new URL("natural-date.js", dir), "utf8");
    expect(source).not.toMatch(
      /\b(setTimeout|setInterval|requestAnimationFrame|window|document|navigator)\b/,
    );
  });
});
