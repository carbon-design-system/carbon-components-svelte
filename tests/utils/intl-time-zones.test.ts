// @vitest-environment node
import { matchesTokens, parseQuery } from "../../src/utils/intl-search.js";
import {
  browserTimeZone,
  canonicalTimeZone,
  createTimeZoneSource,
  formatOffset,
  listTimeZones,
  parseOffsetName,
  splitTimeZone,
} from "../../src/utils/intl-time-zones.js";

const winter = new Date("2026-01-15T12:00:00Z");
const summer = new Date("2026-07-15T12:00:00Z");

describe("parseOffsetName", () => {
  it.each([
    ["GMT+05:30", 330],
    ["GMT-08:00", -480],
    ["GMT+9", 540],
    ["GMT", 0],
    ["UTC", 0],
  ])("%s is %i minutes", (name, minutes) => {
    expect(parseOffsetName(name)).toBe(minutes);
  });

  it("rejects an abbreviation", () => {
    expect(parseOffsetName("PST")).toBeNull();
  });
});

describe("formatOffset", () => {
  it.each([
    [0, "UTC+00:00"],
    [330, "UTC+05:30"],
    [-480, "UTC-08:00"],
    [765, "UTC+12:45"],
  ])("%i is %s", (minutes, text) => {
    expect(formatOffset(minutes)).toBe(text);
  });
});

describe("splitTimeZone", () => {
  it.each([
    ["America/Los_Angeles", "America", "Los Angeles"],
    ["America/Argentina/Buenos_Aires", "America", "Buenos Aires"],
    ["Asia/Calcutta", "Asia", "Kolkata"],
    ["Europe/Kiev", "Europe", "Kyiv"],
    ["UTC", "", "UTC"],
  ])("%s", (zone, area, city) => {
    expect(splitTimeZone(zone)).toEqual({ area, city });
  });
});

describe("a name that is a property of Object", () => {
  it("is not a renamed city or an area with a heading", () => {
    expect(splitTimeZone("__proto__/constructor")).toEqual({
      area: "__proto__",
      city: "constructor",
    });
    expect(splitTimeZone("constructor")).toEqual({
      area: "",
      city: "constructor",
    });
    expect(
      createTimeZoneSource({
        locale: "en",
        values: ["__proto__", "constructor/toString", "Europe/Paris"],
      }).items.map((item) => item.id),
    ).toEqual(["Europe/Paris"]);
  });
});

describe("zone names", () => {
  it("lists UTC, which the engine leaves out of supportedValuesOf", () => {
    expect(Intl.supportedValuesOf("timeZone")).not.toContain("UTC");
    expect(listTimeZones()[0]).toBe("UTC");
  });

  it("spells an alias the way the engine does", () => {
    expect(canonicalTimeZone("Asia/Kolkata")).toBe(
      canonicalTimeZone("Asia/Calcutta"),
    );
    expect(canonicalTimeZone("Etc/UTC")).toBe("UTC");
    expect(canonicalTimeZone("Not/AZone")).toBe("");
  });

  it("reads the browser's zone", () => {
    expect(browserTimeZone()).not.toBe("");
  });

  it("lists nothing where the engine has no supportedValuesOf", () => {
    const original = Intl.supportedValuesOf;
    // @ts-expect-error an older engine
    Intl.supportedValuesOf = undefined;
    try {
      expect(listTimeZones()).toEqual([]);
      const source = createTimeZoneSource({ locale: "en" });
      expect(source.items.map((item) => item.id)).toContain("UTC");
      expect(source.items.map((item) => item.id)).toContain(browserTimeZone());
    } finally {
      Intl.supportedValuesOf = original;
    }
  });
});

describe("createTimeZoneSource", () => {
  const source = createTimeZoneSource({ locale: "en", date: winter });

  it("lists every zone with UTC first and the rest by area, then city", () => {
    expect(source.items.length).toBeGreaterThan(400);
    expect(source.items[0]).toMatchObject({ id: "UTC", group: undefined });
    const keys = source.items
      .slice(1)
      .map((item) => `${item.area}/${item.text}`);
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b, "en")));
  });

  it("builds the list without a formatter", () => {
    const fresh = vi.spyOn(Intl, "DateTimeFormat");
    createTimeZoneSource({ locale: "en", date: winter });
    const zoneFormatters = fresh.mock.calls.filter(
      ([, options]) => options?.timeZone,
    );
    fresh.mockRestore();
    // Only canonicalizing a caller's list builds one. The default list does not.
    expect(zoneFormatters).toHaveLength(0);
  });

  it("keeps a caller's list in the caller's order and drops what the engine rejects", () => {
    const own = createTimeZoneSource({
      locale: "en",
      values: ["Europe/Paris", "Nope/Nowhere", "Africa/Cairo", "Europe/Paris"],
    });

    expect(own.items.map((item) => item.id)).toEqual([
      "Europe/Paris",
      "Africa/Cairo",
    ]);
  });

  it("names the area in the UI locale where a region has its name", () => {
    const de = createTimeZoneSource({
      locale: "de",
      values: ["Europe/Paris", "Atlantic/Azores"],
      regionName: (code) =>
        new Intl.DisplayNames("de", { type: "region" }).of(code),
    });

    expect(de.items.map((item) => item.group)).toEqual(["Europa", "Atlantic"]);
  });

  it("lets a caller rename an area", () => {
    const own = createTimeZoneSource({
      locale: "en",
      values: ["Europe/Paris"],
      groupText: (area, label) => `${area}: ${label}`,
    });

    expect(own.items[0].group).toBe("Europe: Europe");
  });

  describe("detail", () => {
    it("reads the offset and name at the date", () => {
      expect(source.detail("America/Los_Angeles")).toMatchObject({
        city: "Los Angeles",
        area: "America",
        name: "Pacific Time",
        offset: -480,
        offsetText: "UTC-08:00",
        observesDst: true,
        dst: false,
      });
    });

    it("is in daylight time in July, and not in a zone with no daylight time", () => {
      const julySource = createTimeZoneSource({ locale: "en", date: summer });

      expect(julySource.detail("America/Los_Angeles")).toMatchObject({
        offsetText: "UTC-07:00",
        dst: true,
      });
      expect(julySource.detail("Asia/Calcutta")).toMatchObject({
        offsetText: "UTC+05:30",
        observesDst: false,
        dst: false,
      });
    });

    it("sees daylight time as the southern summer, in January", () => {
      expect(source.detail("Australia/Sydney")).toMatchObject({
        offsetText: "UTC+11:00",
        dst: true,
      });
    });

    it("names the zone in the UI locale, and has no name for UTC's offset form", () => {
      const fr = createTimeZoneSource({ locale: "fr", date: winter });

      expect(fr.detail("Europe/Paris").name).toBe("heure d’Europe centrale");
      expect(source.detail("UTC").name).toBe("Coordinated Universal Time");
      expect(source.detail("Asia/Tokyo").name).not.toMatch(/\d/);
    });

    it("reads offsets again a minute later, not before", () => {
      const clock = vi.useFakeTimers();
      clock.setSystemTime(new Date("2026-03-08T09:59:30Z"));
      const live = createTimeZoneSource({ locale: "en" });
      // New York springs forward at 07:00 UTC on 2026-03-08.
      expect(live.detail("America/New_York").offsetText).toBe("UTC-04:00");
      clock.setSystemTime(new Date("2026-03-08T05:00:00Z"));
      expect(live.detail("America/New_York").offsetText).toBe("UTC-05:00");
      vi.useRealTimers();
    });
  });

  describe("search", () => {
    const search = (query: string, which = source) => {
      which.ensure();
      const tokens = parseQuery(query);
      return which.items
        .filter((item) => matchesTokens(item.search, tokens))
        .map((item) => item.text);
    };

    it("finds a city, an old name and the area", () => {
      expect(search("tokyo")).toEqual(["Tokyo"]);
      expect(search("calcutta")).toEqual(["Kolkata"]);
      expect(search("kolkata")).toEqual(["Kolkata"]);
      expect(search("europe/par")).toEqual(["Paris"]);
    });

    it("finds an offset in any spelling, with or without the minutes", () => {
      expect(search("+5:30")).toEqual(["Colombo", "Kolkata"]);
      expect(search("utc+0530")).toEqual(["Colombo", "Kolkata"]);
      expect(search("gmt+9")).toContain("Tokyo");
      expect(search("+1")).toContain("Paris");
      expect(search("+1")).not.toContain("Sydney");
    });

    it("finds an abbreviation, standard or daylight, whatever the date", () => {
      for (const date of [winter, summer]) {
        const dated = createTimeZoneSource({ locale: "en", date });
        expect(search("pst", dated)).toContain("Los Angeles");
        expect(search("pdt", dated)).toContain("Los Angeles");
        expect(search("cet", dated)).toContain("Paris");
        expect(search("aest", dated)).toContain("Sydney");
      }
    });

    it("finds both of a zone's offsets, since it changes with the season", () => {
      expect(search("-8")).toContain("Los Angeles");
      expect(search("-7")).toContain("Los Angeles");
    });

    it("finds the generic name in the UI locale", () => {
      expect(search("pacific")).toContain("Los Angeles");
      const fr = createTimeZoneSource({ locale: "fr", date: winter });
      expect(search("europe centrale", fr)).toContain("Paris");
    });

    it("matches whole words from the start, so 'ist' is not Boa Vista", () => {
      expect(search("ist")).toContain("Istanbul");
      expect(search("ist")).not.toContain("Boa Vista");
    });

    it("builds the search text in slices that add up to ensure()", () => {
      const sliced = createTimeZoneSource({ locale: "en", date: winter });
      const before = sliced.items[1].search;
      let slices = 0;
      while (!sliced.warm(performance.now() + 2)) slices++;

      expect(slices).toBeGreaterThan(0);
      expect(sliced.items[1].search).not.toBe(before);
      const whole = createTimeZoneSource({ locale: "en", date: winter });
      whole.ensure();
      expect(sliced.items.map((item) => item.search)).toEqual(
        whole.items.map((item) => item.search),
      );
    });
  });

  describe("resolve", () => {
    it("maps an alias to the zone the list holds, and leaves the rest", () => {
      expect(source.resolve("Asia/Kolkata")).toBe(
        canonicalTimeZone("Asia/Kolkata"),
      );
      expect(source.resolve("Europe/Paris")).toBe("Europe/Paris");
      expect(source.resolve("Nope/Nowhere")).toBe("Nope/Nowhere");
    });
  });
});
