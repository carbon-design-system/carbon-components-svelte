// @vitest-environment node
import {
  autocompleteToken,
  countryFromLocale,
  countryName,
  formatAddress,
  getAddressFormat,
  normalizeAddress,
  normalizePostalCode,
  parseFormat,
  switchCountry,
  validateAddress,
} from "../../src/AddressForm/address-format.js";

describe("getAddressFormat", () => {
  it.each([
    ["US", [["locality", "region", "postalCode"]]],
    ["GB", [["locality"], ["postalCode"]]],
    ["DE", [["postalCode", "locality"]]],
    ["CA", [["locality", "region", "postalCode"]]],
    ["BR", [["dependentLocality"], ["locality", "region"], ["postalCode"]]],
    ["AE", [["region"]]],
  ])("keeps the order of %s's lines", (country, tail) => {
    const rows = getAddressFormat(country).rows;
    expect(rows.slice(-tail.length)).toEqual(tail);
  });

  it("puts the postal code first in Japan, and the name last", () => {
    expect(getAddressFormat("JP").rows).toEqual([
      ["postalCode"],
      ["region", "locality"],
      ["lines"],
      ["organization"],
      ["name"],
    ]);
  });

  it("reads the romanized order of Japan", () => {
    const latin = getAddressFormat("JP", { script: "latin" });
    expect(latin.rows).toEqual([
      ["name"],
      ["organization"],
      ["lines"],
      ["locality", "region"],
      ["postalCode"],
    ]);
    expect(latin.script).toBe("latin");
  });

  it("stays native for a country with no romanized format", () => {
    expect(getAddressFormat("DE", { script: "latin" }).script).toBe("native");
  });

  it("falls back to a generic format for a country the table lacks", () => {
    const format = getAddressFormat("IS");
    expect(format.known).toBe(false);
    expect(format.fields).toEqual([
      "name",
      "organization",
      "lines",
      "locality",
    ]);
    expect([...format.required]).toEqual(["lines", "locality"]);
  });

  it("takes a format the caller adds", () => {
    const format = getAddressFormat("IS", {
      formats: { IS: { fmt: "%N%n%A%n%Z %C", require: "ACZ", zip: "\\d{3}" } },
    });
    expect(format.known).toBe(true);
    expect(format.rows.at(-1)).toEqual(["postalCode", "locality"]);
    expect(format.postalPattern?.test("101")).toBe(true);
  });

  it("requires what each country requires", () => {
    expect([...getAddressFormat("US").required]).toEqual(
      expect.arrayContaining(["lines", "locality", "region", "postalCode"]),
    );
    // The UK has no region at all.
    expect(getAddressFormat("GB").fields).not.toContain("region");
    // Ireland's Eircode is optional in the table.
    expect(getAddressFormat("IE").required.has("postalCode")).toBe(false);
  });

  it("lists regions where the table holds them", () => {
    expect(getAddressFormat("US").regions?.[0]).toEqual({
      value: "AL",
      text: "Alabama",
    });
    expect(getAddressFormat("DE").regions).toBeNull();
  });

  it("names Japan's regions in Latin script when asked", () => {
    const native = getAddressFormat("JP").regions;
    const latin = getAddressFormat("JP", { script: "latin" }).regions;
    expect(native?.[12]).toEqual({ value: "東京都", text: "東京都" });
    expect(latin?.[12]).toEqual({ value: "東京都", text: "Tokyo" });
  });
});

describe("parseFormat", () => {
  it("drops a token it does not know, and its line", () => {
    expect(parseFormat("%A%n%T%n%C %Z")).toEqual([
      [{ field: "lines" }],
      [{ field: "locality" }, { text: " " }, { field: "postalCode" }],
    ]);
  });
});

describe("normalizePostalCode", () => {
  it.each([
    ["GB", "sw1a1aa", "SW1A 1AA"],
    ["GB", " m25bq ", "M2 5BQ"],
    ["GB", "gir0aa", "GIR 0AA"],
    ["CA", "k1a0b1", "K1A 0B1"],
    ["CA", "K1A-0B1", "K1A 0B1"],
    ["US", "95014", "95014"],
    ["US", "950141234", "95014-1234"],
    ["US", "95014 1234", "95014-1234"],
    ["JP", "1500002", "150-0002"],
    ["BR", "01310100", "01310-100"],
    ["NL", "1234ab", "1234 AB"],
    ["PL", "00950", "00-950"],
    ["IE", "a65f4e2", "A65 F4E2"],
  ])("writes %s %s as %s", (country, typed, written) => {
    expect(normalizePostalCode(country, typed)).toBe(written);
  });

  it("leaves a value that fits no pattern as typed, trimmed", () => {
    expect(normalizePostalCode("US", " 9501 ")).toBe("9501");
    expect(normalizePostalCode("GB", "hello  world")).toBe("HELLO WORLD");
  });

  it("changes nothing where the country has no pattern", () => {
    expect(normalizePostalCode("IS", " 101 ")).toBe("101");
  });
});

describe("validateAddress", () => {
  const us = {
    country: "US",
    lines: ["1 Infinite Loop"],
    locality: "Cupertino",
    region: "CA",
    postalCode: "95014",
  };

  it("accepts a complete address", () => {
    expect(validateAddress(us)).toEqual({ valid: true, errors: {} });
  });

  it("reports each missing required field", () => {
    expect(validateAddress({ country: "US" }).errors).toEqual({
      lines: "required",
      locality: "required",
      region: "required",
      postalCode: "required",
    });
  });

  it("needs a country", () => {
    expect(validateAddress({}).errors.country).toBe("required");
    expect(
      validateAddress({}, { countryRequired: false }).errors.country,
    ).toBeUndefined();
  });

  it("accepts a ZIP of 5 or 9 digits and nothing else", () => {
    const ok = (postalCode: string) =>
      validateAddress({ ...us, postalCode }).errors.postalCode;
    expect(ok("95014")).toBeUndefined();
    expect(ok("95014-1234")).toBeUndefined();
    expect(ok("950141234")).toBeUndefined();
    expect(ok("9501")).toBe("invalid");
    expect(ok("95014-12")).toBe("invalid");
    expect(ok("ABCDE")).toBe("invalid");
  });

  it("applies the UK pattern, in any case", () => {
    const gb = { country: "GB", lines: ["10 Downing St"], locality: "London" };
    const ok = (postalCode: string) =>
      validateAddress({ ...gb, postalCode }).errors.postalCode;
    expect(ok("SW1A 1AA")).toBeUndefined();
    expect(ok("sw1a1aa")).toBeUndefined();
    expect(ok("12345")).toBe("invalid");
    expect(ok("ZZ1 1ZZ")).toBe("invalid");
  });

  it("does not ask for a region where the country has none", () => {
    const { errors } = validateAddress({
      country: "GB",
      lines: ["10 Downing St"],
      locality: "London",
      postalCode: "SW1A 2AA",
    });
    expect(errors).toEqual({});
  });

  it("flags a region the list does not hold", () => {
    expect(validateAddress({ ...us, region: "ZZ" }).errors.region).toBe(
      "invalid",
    );
    expect(validateAddress({ ...us, region: "california" }).errors.region).toBe(
      undefined,
    );
  });

  it("adds a field the caller requires", () => {
    expect(
      validateAddress({ ...us, name: "Ada" }, { required: ["name"] }).errors
        .name,
    ).toBeUndefined();
    expect(
      validateAddress({ ...us, name: "" }, { required: ["name"] }).errors.name,
    ).toBe("required");
  });

  it("does not run a long text through the pattern", () => {
    expect(
      validateAddress({ ...us, postalCode: "9".repeat(5000) }).errors
        .postalCode,
    ).toBe("invalid");
  });
});

describe("normalizeAddress", () => {
  it("trims, writes the postal code and names the region by its code", () => {
    expect(
      normalizeAddress({
        country: "gb",
        lines: [" 10 Downing St ", ""],
        locality: " London ",
        postalCode: "sw1a2aa",
      }),
    ).toEqual({
      country: "GB",
      lines: ["10 Downing St", ""],
      locality: "London",
      postalCode: "SW1A 2AA",
    });
    expect(
      normalizeAddress({ country: "US", region: " california " }).region,
    ).toBe("CA");
  });
});

describe("switchCountry", () => {
  const us = {
    country: "US",
    name: "Ada",
    lines: ["1 Main St", "Apt 2"],
    locality: "Springfield",
    region: "IL",
    postalCode: "62704",
  };

  it("keeps what fits and clears what does not", () => {
    const { value, cleared } = switchCountry(us, "GB");
    expect(value).toEqual({
      country: "GB",
      name: "Ada",
      lines: ["1 Main St", "Apt 2"],
      locality: "Springfield",
    });
    expect(cleared).toEqual(["region", "postalCode"]);
  });

  it("keeps a postal code the new country also writes", () => {
    const { value, cleared } = switchCountry(us, "DE");
    expect(value.postalCode).toBe("62704");
    expect(cleared).toEqual(["region"]);
  });

  it("keeps a region only when the new list holds it", () => {
    const au = switchCountry({ ...us, region: "NSW" }, "AU");
    expect(au.value.region).toBe("NSW");
    const ca = switchCountry({ ...us, region: "ON" }, "CA");
    expect(ca.value.region).toBe("ON");
    // "IL" is no Canadian province.
    expect(switchCountry(us, "CA").cleared).toContain("region");
  });

  it("clears a listed region when the new country takes free text", () => {
    expect(switchCountry(us, "ES").cleared).toContain("region");
  });

  it("clears the field a country does not have, for every pair", () => {
    const codes = ["US", "GB", "JP", "DE", "CA", "BR", "AU", "AE", "FR", "IN"];
    for (const from of codes) {
      for (const to of codes) {
        const { value } = switchCountry(
          {
            country: from,
            name: "Ada",
            lines: ["1 Main St"],
            locality: "Town",
            dependentLocality: "District",
            region: "X",
            postalCode: "12345",
          },
          to,
        );
        const fields = new Set(getAddressFormat(to).fields);
        expect(value.country).toBe(to);
        for (const field of [
          "locality",
          "dependentLocality",
          "region",
          "postalCode",
        ] as const) {
          if (!fields.has(field)) expect(value[field]).toBeUndefined();
        }
      }
    }
  });
});

describe("formatAddress", () => {
  it.each([
    [
      "US",
      {
        name: "Jane Doe",
        lines: ["1 Infinite Loop"],
        locality: "Cupertino",
        region: "CA",
        postalCode: "95014",
      },
      ["Jane Doe", "1 Infinite Loop", "Cupertino, CA 95014", "United States"],
    ],
    [
      "GB",
      {
        organization: "Acme",
        lines: ["10 Downing St"],
        locality: "London",
        postalCode: "SW1A 2AA",
      },
      ["Acme", "10 Downing St", "London", "SW1A 2AA", "United Kingdom"],
    ],
    [
      "DE",
      {
        name: "Erika Mustermann",
        lines: ["Heidestr. 17"],
        locality: "Köln",
        postalCode: "51147",
      },
      ["Erika Mustermann", "Heidestr. 17", "51147 Köln", "Germany"],
    ],
    [
      "CA",
      {
        lines: ["80 Wellington St"],
        locality: "Ottawa",
        region: "ON",
        postalCode: "K1A 0A2",
      },
      ["80 Wellington St", "Ottawa ON K1A 0A2", "Canada"],
    ],
    [
      "BR",
      {
        lines: ["Av. Paulista, 1578"],
        dependentLocality: "Bela Vista",
        locality: "São Paulo",
        region: "SP",
        postalCode: "01310-200",
      },
      [
        "Av. Paulista, 1578",
        "Bela Vista",
        "São Paulo-SP",
        "01310-200",
        "Brazil",
      ],
    ],
    [
      "JP",
      {
        name: "Taro Yamada",
        lines: ["1-2-3 Jingumae"],
        locality: "Shibuya-ku",
        region: "東京都",
        postalCode: "150-0001",
      },
      [
        "〒150-0001",
        "東京都Shibuya-ku",
        "1-2-3 Jingumae",
        "Taro Yamada",
        "Japan",
      ],
    ],
    [
      "SG",
      { lines: ["1 Raffles Pl"], postalCode: "048616" },
      ["1 Raffles Pl", "SINGAPORE 048616", "Singapore"],
    ],
    [
      "CH",
      { lines: ["Bahnhofstrasse 1"], locality: "Zürich", postalCode: "8001" },
      ["Bahnhofstrasse 1", "CH-8001 Zürich", "Switzerland"],
    ],
    [
      "TR",
      {
        lines: ["Atatürk Cd. 5"],
        locality: "Kadıköy",
        region: "İstanbul",
        postalCode: "34710",
      },
      ["Atatürk Cd. 5", "34710 Kadıköy/İstanbul", "Türkiye"],
    ],
    [
      "AE",
      { lines: ["Sheikh Zayed Rd"], region: "Dubai" },
      ["Sheikh Zayed Rd", "Dubai", "United Arab Emirates"],
    ],
  ])("lays out %s", (country, fields, lines) => {
    expect(formatAddress({ country, ...fields })).toEqual(lines);
  });

  it("takes the punctuation of an empty field with it", () => {
    expect(
      formatAddress(
        {
          country: "US",
          lines: ["1 Main St"],
          locality: "Austin",
          postalCode: "78701",
        },
        { includeCountry: false },
      ),
    ).toEqual(["1 Main St", "Austin 78701"]);
    expect(
      formatAddress(
        {
          country: "US",
          lines: ["1 Main St"],
          region: "TX",
          postalCode: "78701",
        },
        { includeCountry: false },
      ),
    ).toEqual(["1 Main St", "TX 78701"]);
  });

  it("writes a postal label in capitals where the country does", () => {
    expect(
      formatAddress(
        {
          country: "US",
          lines: ["1 Main St"],
          locality: "Austin",
          region: "TX",
          postalCode: "78701",
        },
        { postal: true },
      ),
    ).toEqual(["1 Main St", "AUSTIN, TX 78701", "UNITED STATES"]);
  });

  it("names the country in the locale asked for", () => {
    expect(
      formatAddress(
        {
          country: "DE",
          lines: ["Heidestr. 17"],
          locality: "Köln",
          postalCode: "51147",
        },
        { locale: "de" },
      ).at(-1),
    ).toBe("Deutschland");
  });

  it("follows the romanized order", () => {
    expect(
      formatAddress(
        {
          country: "JP",
          name: "Taro Yamada",
          lines: ["1-2-3 Jingumae"],
          locality: "Shibuya-ku",
          region: "東京都",
          postalCode: "150-0001",
        },
        { script: "latin", includeCountry: false },
      ),
    ).toEqual([
      "Taro Yamada",
      "1-2-3 Jingumae",
      "Shibuya-ku, Tokyo",
      "150-0001",
    ]);
  });

  it("leaves a line with nothing on it out", () => {
    expect(formatAddress({ country: "GB" }, { includeCountry: false })).toEqual(
      [],
    );
  });
});

describe("helpers", () => {
  it("maps a field to its autocomplete token", () => {
    expect(autocompleteToken("lines", 0)).toBe("address-line1");
    expect(autocompleteToken("lines", 1)).toBe("address-line2");
    expect(autocompleteToken("locality")).toBe("address-level2");
    expect(autocompleteToken("region")).toBe("address-level1");
    expect(autocompleteToken("postalCode")).toBe("postal-code");
    expect(autocompleteToken("country")).toBe("country");
    expect(autocompleteToken("sortingCode")).toBeUndefined();
  });

  it("reads the country from a locale", () => {
    expect(countryFromLocale("en-GB")).toBe("GB");
    expect(countryFromLocale("de")).toBe("DE");
    expect(countryFromLocale("not a locale")).toBeUndefined();
  });

  it("names a country, falling back to its code", () => {
    expect(countryName("JP", "ja")).toBe("日本");
    expect(countryName("US", "not a locale")).toBe("US");
  });
});
