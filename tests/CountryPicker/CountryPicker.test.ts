import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import CountryPicker from "./CountryPicker.test.svelte";

function getInput() {
  const input = screen.getByRole("combobox");
  assert(input instanceof HTMLInputElement);
  return input;
}

const values = ["US", "CH", "JP", "DE", "EG"];

async function open() {
  await user.click(getInput());
}

const optionNames = () =>
  screen
    .queryAllByRole("option")
    .map((o) => o.querySelector(".bx--intl-picker__text")?.textContent);

describe("CountryPicker", () => {
  it("shows the name of the value in the field", () => {
    render(CountryPicker, { props: { values, value: "CH" } });

    expect(getInput()).toHaveValue("Switzerland");
  });

  it("lists every country and territory the engine names when no list is given", async () => {
    render(CountryPicker, { props: { virtualize: false } });
    await open();

    expect(screen.getAllByRole("option").length).toBeGreaterThan(240);
    expect(
      screen.getByRole("option", { name: /Switzerland/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Unknown Region/ })).toBeNull();
    expect(screen.queryByRole("option", { name: /European Union/ })).toBeNull();
  });

  describe("flag", () => {
    it("draws the region's flag once the flags have loaded, and hides it from assistive technology", async () => {
      render(CountryPicker, { props: { values, flag: "auto" } });
      await open();

      const swiss = screen.getByRole("option", { name: /Switzerland/ });
      await waitFor(() =>
        expect(swiss.querySelector("svg.bx--flag")).not.toBeNull(),
      );
      expect(swiss.querySelector("svg.bx--flag")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      // Only the names are read.
      expect(
        screen.getByRole("option", { name: "Switzerland Schweiz" }),
      ).toBeInTheDocument();
    });

    it("shows the code in a box for the badge, and nothing for none", async () => {
      const { rerender } = render(CountryPicker, {
        props: { values, flag: "badge" },
      });
      await open();

      const badge = screen
        .getByRole("option", { name: /Switzerland/ })
        .querySelector(".bx--flag--badge");
      expect(badge).toHaveTextContent("CH");
      expect(badge).toHaveAttribute("aria-hidden", "true");

      await rerender({ flag: "none" });
      expect(document.querySelector(".bx--flag")).toBeNull();
    });
  });

  describe("names", () => {
    it("shows the name in the region's own language beside the UI name", async () => {
      render(CountryPicker, { props: { values } });
      await open();

      const swiss = screen.getByRole("option", { name: /Switzerland/ });
      expect(
        swiss.querySelector(".bx--intl-picker__secondary"),
      ).toHaveTextContent("Schweiz");
      const us = screen.getByRole("option", { name: /United States/ });
      expect(us.querySelector(".bx--intl-picker__secondary")).toBeNull();
    });

    it("renames the field and the menu when the locale changes", async () => {
      const { rerender } = render(CountryPicker, {
        props: { values, value: "DE", locale: "en" },
      });
      expect(getInput()).toHaveValue("Germany");

      await rerender({ locale: "ar" });

      expect(getInput()).toHaveValue("ألمانيا");
      await open();
      expect(optionNames()).toContain("ألمانيا");
      expect(optionNames()).not.toContain("Germany");
    });

    it("keeps the arabic names on the page's text direction, in their own language", async () => {
      render(CountryPicker, { props: { values, locale: "ar" } });
      await open();

      expect(
        screen
          .getAllByRole("option")[0]
          .querySelector(".bx--intl-picker__text"),
      ).toHaveAttribute("lang", "ar");
    });
  });

  describe("search", () => {
    const typed = async (query: string) => {
      await user.clear(getInput());
      await user.type(getInput(), query);
      return optionNames();
    };

    it("finds a country by its name, its code, its native name and its English name", async () => {
      render(CountryPicker, { props: { values, locale: "de" } });
      await open();

      expect(await typed("schwe")).toEqual(["Schweiz"]);
      expect(await typed("switz")).toEqual(["Schweiz"]);
      expect(await typed("jp")).toEqual(["Japan"]);
      expect(await typed("日本")).toEqual(["Japan"]);
      expect(await typed("ägypten")).toHaveLength(1);
      expect(await typed("agypten")).toHaveLength(1);
    });

    it("says so when nothing matches", async () => {
      render(CountryPicker, { props: { values, emptyText: "Nothing here" } });
      await open();
      await typed("zzzz");

      expect(screen.getByText("Nothing here")).toBeInTheDocument();
    });
  });

  describe("selection", () => {
    it("binds the code, dispatches change with the names, and posts the code", async () => {
      const onChange = vi.fn();
      render(CountryPicker, { props: { values, onChange, name: "country" } });
      await open();

      await user.click(screen.getByRole("option", { name: /Switzerland/ }));

      expect(getInput()).toHaveValue("Switzerland");
      expect(document.querySelector('input[name="country"]')).toHaveValue("CH");
      expect(screen.getByTestId("bound")).toHaveTextContent("CH");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toMatchObject({
        value: "CH",
        label: "Switzerland",
        name: "Switzerland",
        nativeName: "Schweiz",
      });
    });

    it("adds what `metadata` returns, which is where a calling code goes", async () => {
      const onChange = vi.fn();
      const callingCodes: Record<string, string> = { CH: "41" };
      render(CountryPicker, {
        props: {
          values,
          onChange,
          metadata: (code: string) => ({ calling: callingCodes[code] }),
        },
      });
      await open();

      await user.click(screen.getByRole("option", { name: /Switzerland/ }));

      expect(onChange.mock.calls[0][0].metadata).toEqual({ calling: "41" });
    });

    it("does not dispatch change when the value is set from outside", async () => {
      const onChange = vi.fn();
      const { rerender } = render(CountryPicker, {
        props: { values, onChange },
      });

      await rerender({ value: "JP" });
      await tick();

      expect(getInput()).toHaveValue("Japan");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("clears to an empty code, and says so", async () => {
      const onChange = vi.fn();
      render(CountryPicker, { props: { values, value: "JP", onChange } });

      await user.click(
        screen.getByRole("button", { name: "Clear selected item" }),
      );

      expect(getInput()).toHaveValue("");
      expect(screen.getByTestId("bound")).toHaveTextContent("");
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: "" }),
      );
    });
  });

  describe("detect", () => {
    it("fills an empty value with the region of the locale after mount, without a change event", async () => {
      const onChange = vi.fn();
      render(CountryPicker, {
        props: { detect: true, locale: "de", onChange },
      });

      await waitFor(() => expect(getInput()).toHaveValue("Deutschland"));
      expect(screen.getByTestId("bound")).toHaveTextContent("DE");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("leaves the field empty by default", async () => {
      render(CountryPicker, { props: { locale: "de" } });
      await tick();

      expect(getInput()).toHaveValue("");
    });
  });

  it("takes UN M.49 codes in a caller's list, with the code where there is no flag", async () => {
    render(CountryPicker, {
      props: { values: ["150", "019", "US"], flag: "auto" },
    });
    await open();

    expect(optionNames()).toEqual(["Europe", "Americas", "United States"]);
    const us = screen.getByRole("option", { name: /United States/ });
    await waitFor(() =>
      expect(us.querySelector("svg.bx--flag")).not.toBeNull(),
    );
    // The box is as large as a flag, so the names stay in line.
    const europe = screen.getByRole("option", { name: /Europe/ });
    expect(europe.querySelector(".bx--flag--badge")).toHaveTextContent("150");
    expect(europe.querySelector(".bx--flag--20")).not.toBeNull();
  });
});
