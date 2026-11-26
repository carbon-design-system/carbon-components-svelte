// @vitest-environment node

import AddressForm from "carbon-components-svelte/AddressForm/AddressForm.svelte";
import { renderRaw } from "../utils/ssr";

describe("AddressForm server render", () => {
  const props = {
    id: "ship",
    value: { country: "GB", lines: ["10 Downing St"], postalCode: "SW1A 2AA" },
  };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(AddressForm, props)).toBe(renderRaw(AddressForm, props));
  });

  it("derives every field id from the id", () => {
    const html = renderRaw(AddressForm, props);

    for (const key of ["country", "line1", "line2", "locality", "postalCode"]) {
      expect(html).toContain(`id="ship-${key}"`);
    }
    expect(html).not.toContain('id="ship-region"');
  });

  it("renders the country's fields, with their values and autofill tokens", () => {
    const html = renderRaw(AddressForm, props);

    expect(html).toContain("Postcode");
    expect(html).toContain('autocomplete="postal-code"');
    expect(html).toContain('autocomplete="address-line1"');
    expect(html).toContain('value="10 Downing St"');
    expect(html).toContain('value="SW1A 2AA"');
  });

  it("names the countries in the locale it is given, not the server's", () => {
    expect(renderRaw(AddressForm, { ...props, locale: "de" })).toContain(
      "Deutschland",
    );
  });

  it("renders no error before a field is touched", () => {
    const html = renderRaw(AddressForm, {
      id: "ship",
      value: { country: "US" },
    });

    expect(html).not.toContain("is required");
    expect(html).not.toContain("aria-invalid");
  });
});
