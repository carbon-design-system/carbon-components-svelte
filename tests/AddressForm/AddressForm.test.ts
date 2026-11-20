import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import AddressForm from "./AddressForm.test.svelte";

const labels = () =>
  within(screen.getByRole("group"))
    .getAllByText(/./, { selector: "label" })
    .map((label) => label.textContent?.trim());

const bound = () => JSON.parse(screen.getByTestId("value").textContent ?? "{}");

const field = (name: RegExp | string) => screen.getByLabelText(name);

/** What a browser's autofill does to a control: set it, then fire the events. */
async function autofill(control: HTMLElement, text: string) {
  const proto =
    control instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(control, text);
  control.dispatchEvent(new Event("input", { bubbles: true }));
  control.dispatchEvent(new Event("change", { bubbles: true }));
  // A browser runs microtasks between the fields it fills.
  await tick();
}

describe("AddressForm", () => {
  describe("layout by country", () => {
    it("asks a US address for the street, city, state and ZIP code", () => {
      render(AddressForm, { value: { country: "US" } });

      expect(labels()).toEqual([
        "Country",
        "Address line 1",
        "Address line 2 (optional)",
        "City",
        "State",
        "ZIP code",
      ]);
      expect(field("State").tagName).toBe("SELECT");
      expect(
        screen.getByRole("group", { name: "Shipping address" }),
      ).toBeTruthy();
    });

    it("asks a UK address for a postcode and no state", () => {
      render(AddressForm, { value: { country: "GB" } });

      expect(labels()).toEqual([
        "Country",
        "Address line 1",
        "Address line 2 (optional)",
        "Town/City",
        "Postcode",
      ]);
    });

    it("puts the PLZ before the city in Germany", () => {
      render(AddressForm, { value: { country: "DE" } });

      expect(labels().slice(-2)).toEqual(["PLZ", "City"]);
    });

    it("asks a Canadian address for a province", () => {
      render(AddressForm, { value: { country: "CA" } });

      expect(labels().slice(-3)).toEqual(["City", "Province", "Postal code"]);
    });

    it("asks a Brazilian address for the CEP and the bairro", () => {
      render(AddressForm, { value: { country: "BR" } });

      expect(labels().slice(2)).toEqual([
        "Address line 2 (optional)",
        "Bairro (optional)",
        "City",
        "State",
        "CEP",
      ]);
    });

    it("puts the postal code first in Japan, and the name last", () => {
      render(AddressForm, {
        value: { country: "JP" },
        include: ["name", "organization"],
      });

      expect(labels()).toEqual([
        "Country",
        "Postal code",
        "Prefecture",
        "City",
        "Address line 1",
        "Address line 2 (optional)",
        "Company (optional)",
        "Full name (optional)",
      ]);
    });

    it("follows the romanized order of Japan when asked", () => {
      render(AddressForm, {
        value: { country: "JP" },
        script: "latin",
        include: ["name"],
      });

      expect(labels()).toEqual([
        "Country",
        "Full name (optional)",
        "Address line 1",
        "Address line 2 (optional)",
        "City",
        "Prefecture",
        "Postal code",
      ]);
    });

    it("falls back to a generic form for a country the table lacks", () => {
      render(AddressForm, { value: { country: "IS" } });

      expect(labels()).toEqual([
        "Country",
        "Address line 1",
        "Address line 2 (optional)",
        "City",
      ]);
    });

    it("asks for one street line when set to", () => {
      render(AddressForm, { value: { country: "US" }, addressLines: 1 });

      expect(labels().filter((text) => text?.startsWith("Address"))).toEqual([
        "Address line 1",
      ]);
    });

    it("takes the labels a caller supplies", () => {
      render(AddressForm, {
        value: { country: "DE" },
        labels: { postalCode: "Postleitzahl", locality: "Ort" },
      });

      expect(labels().slice(-2)).toEqual(["Postleitzahl", "Ort"]);
    });
  });

  describe("autofill tokens", () => {
    it("names every field so a browser fills it", () => {
      render(AddressForm, {
        value: { country: "US" },
        include: ["name", "organization"],
      });

      const tokens = [
        ["Country", "country"],
        [/Full name/, "name"],
        [/Company/, "organization"],
        ["Address line 1", "address-line1"],
        [/Address line 2/, "address-line2"],
        [/City/, "address-level2"],
        [/State/, "address-level1"],
        [/ZIP code/, "postal-code"],
      ] as const;
      for (const [label, token] of tokens) {
        expect(field(label)).toHaveAttribute("autocomplete", token);
      }
    });

    it("scopes the tokens to shipping or billing", () => {
      render(AddressForm, {
        value: { country: "US" },
        autocompletePrefix: "shipping",
      });

      expect(field(/ZIP code/)).toHaveAttribute(
        "autocomplete",
        "shipping postal-code",
      );
      expect(field("Country")).toHaveAttribute(
        "autocomplete",
        "shipping country",
      );
    });

    it("fills the fields as a browser does, country first", async () => {
      render(AddressForm, { value: {} });

      // Chrome fills in document order: the country, then the fields it
      // brought into the form.
      await autofill(field("Country"), "GB");
      await autofill(field("Address line 1"), "10 Downing St");
      await autofill(field(/Town\/City/), "London");
      await autofill(field(/Postcode/), "sw1a2aa");

      expect(bound()).toEqual({
        country: "GB",
        lines: ["10 Downing St"],
        locality: "London",
        postalCode: "SW1A 2AA",
      });
    });

    it("fills a state by its name into the list of codes", async () => {
      render(AddressForm, { value: { country: "US" } });

      await autofill(field(/State/), "TX");

      expect(bound().region).toBe("TX");
    });
  });

  describe("switching the country", () => {
    const filled = {
      country: "US",
      lines: ["1 Main St", "Apt 2"],
      locality: "Springfield",
      region: "IL",
      postalCode: "62704",
    };

    it("keeps what fits and clears what does not", async () => {
      render(AddressForm, { value: filled });

      await user.selectOptions(field("Country"), "GB");

      expect(bound()).toEqual({
        country: "GB",
        lines: ["1 Main St", "Apt 2"],
        locality: "Springfield",
      });
      expect(field(/Postcode/)).toHaveValue("");
    });

    it("keeps the element of a field the new country also has", async () => {
      render(AddressForm, { value: filled });
      const line = field("Address line 1");
      const city = field(/City/);

      await user.selectOptions(field("Country"), "DE");

      expect(field("Address line 1")).toBe(line);
      expect(field(/City/)).toBe(city);
      // The ZIP code fits a PLZ, so it stays.
      expect(field(/PLZ/)).toHaveValue("62704");
    });

    it("leaves focus on the country", async () => {
      render(AddressForm, { value: filled });
      const country = field("Country");

      await user.click(country);
      await user.selectOptions(country, "JP");

      expect(country).toHaveFocus();
    });

    it("announces the change and what it cleared", async () => {
      render(AddressForm, { value: filled });

      await user.selectOptions(field("Country"), "GB");

      expect(screen.getByRole("status")).toHaveTextContent(
        "Address fields changed for United Kingdom. Cleared: State, ZIP code.",
      );
    });

    it("tells the owner what changed", async () => {
      const onCountryChange = vi.fn();
      render(AddressForm, { value: filled, onCountryChange });

      await user.selectOptions(field("Country"), "GB");

      expect(onCountryChange).toHaveBeenCalledWith({
        from: "US",
        to: "GB",
        cleared: ["region", "postalCode"],
        value: {
          country: "GB",
          lines: ["1 Main St", "Apt 2"],
          locality: "Springfield",
        },
      });
    });

    it("survives a trip through ten countries with partial data", async () => {
      render(AddressForm, {
        value: { country: "US", lines: ["1 Main St"], locality: "Town" },
      });

      for (const code of "GB DE FR JP CA BR AU AE IN US".split(" ")) {
        // eslint-disable-next-line no-await-in-loop -- each switch builds on the last
        await user.selectOptions(field("Country"), code);
        expect(bound().country).toBe(code);
        expect(bound().lines).toEqual(["1 Main St"]);
      }
      expect(field("Address line 1")).toHaveValue("1 Main St");
    });
  });

  describe("validation", () => {
    it("shows a required field's error once it has been left", async () => {
      render(AddressForm, { value: { country: "US" } });

      expect(screen.queryByText("City is required")).toBeNull();
      await user.click(field(/City/));
      await user.tab();

      expect(screen.getByText("City is required")).toBeVisible();
      expect(field(/City/)).toHaveAttribute("aria-invalid", "true");
    });

    it("checks the postal code against the country's pattern", async () => {
      render(AddressForm, { value: { country: "US" } });

      await user.type(field(/ZIP code/), "9501");
      await user.tab();

      expect(
        screen.getByText("Enter a valid ZIP code (for example 95014)"),
      ).toBeVisible();
    });

    it("writes the postal code the way the country does", async () => {
      render(AddressForm, { value: { country: "GB" } });

      await user.type(field(/Postcode/), "sw1a1aa");
      await user.tab();

      expect(field(/Postcode/)).toHaveValue("SW1A 1AA");
      expect(bound().postalCode).toBe("SW1A 1AA");
    });

    it("inserts the space of a Canadian postal code", async () => {
      render(AddressForm, { value: { country: "CA" } });

      await user.type(field(/Postal code/), "k1a0b1");
      await user.tab();

      expect(field(/Postal code/)).toHaveValue("K1A 0B1");
    });

    it("shows every error and focuses the first on validate()", async () => {
      const { component } = render(AddressForm, { value: { country: "US" } });

      const result = component.validate();
      await tick();
      await tick();

      expect(result.valid).toBe(false);
      expect(screen.getByText("Address line 1 is required")).toBeVisible();
      expect(screen.getByText("State is required")).toBeVisible();
      expect(field("Address line 1")).toHaveFocus();
    });

    it("requires the country first", async () => {
      const { component } = render(AddressForm, { value: {} });

      component.validate();
      await tick();

      expect(screen.getByText("Select a country")).toBeVisible();
    });

    it("requires a field the caller names", () => {
      const { component } = render(AddressForm, {
        value: { country: "GB" },
        include: ["name"],
        requiredFields: ["name"],
      });

      expect(field(/Full name/).hasAttribute("required")).toBe(true);
      expect(component.validate().errors.name).toBe("required");
    });

    it("takes the error text a caller supplies", async () => {
      const { component } = render(AddressForm, {
        value: { country: "GB" },
        errorText: (name: string, error: string) => `${name}:${error}`,
      });

      component.validate();
      await tick();

      expect(screen.getByText("locality:required")).toBeVisible();
    });
  });

  describe("form integration", () => {
    it("names the fields under a prefix", () => {
      render(AddressForm, { value: { country: "US" }, name: "shipping" });

      const names = [
        ...new FormData(screen.getByTestId("form") as HTMLFormElement).keys(),
      ];
      expect(names).toEqual([
        "shipping.country",
        "shipping.line1",
        "shipping.line2",
        "shipping.locality",
        "shipping.region",
        "shipping.postalCode",
      ]);
    });

    it("restores the starting value on reset", async () => {
      render(AddressForm, {
        value: { country: "US", lines: ["1 Main St"] },
      });

      await user.type(field(/City/), "Austin");
      await user.selectOptions(field("Country"), "DE");
      await user.click(screen.getByRole("button", { name: "Reset" }));
      await new Promise((resolve) => setTimeout(resolve));
      await tick();

      expect(bound()).toEqual({ country: "US", lines: ["1 Main St"] });
      expect(field("Country")).toHaveValue("US");
      expect(field(/City/)).toHaveValue("");
      expect(field("Address line 1")).toHaveValue("1 Main St");
    });

    it("disables every field with the fieldset", () => {
      render(AddressForm, { value: { country: "US" }, disabled: true });

      for (const control of screen.getAllByRole("textbox")) {
        expect(control).toBeDisabled();
      }
      expect(field("Country")).toBeDisabled();
    });

    it("follows a country set from outside", async () => {
      const { rerender } = render(AddressForm, { value: { country: "US" } });

      await rerender({ value: { country: "GB" } });

      expect(labels()).toContain("Postcode");
    });
  });
});
