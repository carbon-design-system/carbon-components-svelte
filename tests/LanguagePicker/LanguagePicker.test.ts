import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import LanguagePicker from "./LanguagePicker.test.svelte";

function getInput() {
  const input = screen.getByRole("combobox");
  assert(input instanceof HTMLInputElement);
  return input;
}

const values = ["en", "fr", "ar", "he", "pt-BR", "ja"];

const open = () => user.click(getInput());

const optionNames = () =>
  screen
    .queryAllByRole("option")
    .map((o) => o.querySelector(".bx--intl-picker__text")?.textContent);

describe("LanguagePicker", () => {
  it("shows the name of the value in the field", () => {
    render(LanguagePicker, { props: { values, value: "fr" } });

    expect(getInput()).toHaveValue("French");
  });

  it("shows each language in the UI locale and in itself, in its own language and direction", async () => {
    render(LanguagePicker, { props: { values } });
    await open();

    const french = screen.getByRole("option", { name: /French/ });
    const endonym = french.querySelector(".bx--intl-picker__secondary");
    expect(endonym).toHaveTextContent("français");
    expect(endonym).toHaveAttribute("lang", "fr");
    expect(endonym).toHaveAttribute("dir", "ltr");

    const arabic = screen
      .getByRole("option", { name: /Arabic/ })
      .querySelector(".bx--intl-picker__secondary");
    expect(arabic).toHaveTextContent("العربية");
    expect(arabic).toHaveAttribute("dir", "rtl");
    expect(
      screen
        .getByRole("option", { name: /Hebrew/ })
        .querySelector(".bx--intl-picker__secondary"),
    ).toHaveAttribute("dir", "rtl");
  });

  it("shows no endonym where it is the UI name, and hides the tag from assistive technology", async () => {
    render(LanguagePicker, { props: { values } });
    await open();

    const english = screen.getByRole("option", { name: /English/ });
    expect(english.querySelector(".bx--intl-picker__secondary")).toBeNull();
    const code = english.querySelector(".bx--intl-picker__trailing");
    expect(code).toHaveTextContent("en");
    expect(code).toHaveAttribute("aria-hidden", "true");
    expect(code?.querySelector("bdi")).toHaveAttribute("dir", "ltr");
  });

  it("names the languages in the UI locale, in the caller's order", async () => {
    render(LanguagePicker, { props: { values, locale: "fr" } });
    await open();

    expect(optionNames()).toEqual([
      "anglais",
      "français",
      "arabe",
      "hébreu",
      "portugais (Brésil)",
      "japonais",
    ]);
  });

  it("renames the field when the locale changes", async () => {
    const { rerender } = render(LanguagePicker, {
      props: { values, value: "ja", locale: "en" },
    });
    expect(getInput()).toHaveValue("Japanese");

    await rerender({ locale: "he" });

    expect(getInput()).toHaveValue("יפנית");
  });

  describe("variants", () => {
    it("adds script and region variants beside the language", async () => {
      render(LanguagePicker, { props: { variants: true, virtualize: false } });
      await open();

      const names = optionNames();
      const at = names.indexOf("Chinese");
      expect(names.slice(at, at + 3)).toEqual([
        "Chinese",
        "Chinese (Hong Kong SAR China)",
        "Chinese (Simplified)",
      ]);
      expect(names).toContain("Portuguese (Brazil)");
    });

    it("names variants as dialects when asked", () => {
      render(LanguagePicker, {
        props: { variants: true, languageDisplay: "dialect", value: "pt-BR" },
      });

      expect(getInput()).toHaveValue("Brazilian Portuguese");
    });

    it("leaves them out by default", async () => {
      render(LanguagePicker, { props: { virtualize: false } });
      await open();

      expect(optionNames()).not.toContain("Portuguese (Brazil)");
      expect(optionNames()).toContain("Portuguese");
    });
  });

  describe("search", () => {
    const typed = async (query: string) => {
      await user.clear(getInput());
      await user.type(getInput(), query);
      return optionNames();
    };

    it("finds a language by its name, tag or endonym", async () => {
      render(LanguagePicker, { props: { values } });
      await open();

      expect(await typed("fren")).toEqual(["French"]);
      expect(await typed("fran")).toEqual(["French"]);
      expect(await typed("日本語")).toEqual(["Japanese"]);
      expect(await typed("pt-br")).toEqual(["Portuguese (Brazil)"]);
      expect(await typed("עברית")).toEqual(["Hebrew"]);
    });

    it("finds a language by its English name from another locale", async () => {
      render(LanguagePicker, { props: { values, locale: "ja" } });
      await open();

      expect(await typed("hebrew")).toHaveLength(1);
    });
  });

  describe("selection", () => {
    it("binds the tag, dispatches change with the names and direction, and posts the tag", async () => {
      const onChange = vi.fn();
      render(LanguagePicker, { props: { values, onChange, name: "lang" } });
      await open();

      await user.click(screen.getByRole("option", { name: /Arabic/ }));

      expect(getInput()).toHaveValue("Arabic");
      expect(document.querySelector('input[name="lang"]')).toHaveValue("ar");
      expect(screen.getByTestId("bound")).toHaveTextContent("ar");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toMatchObject({
        value: "ar",
        label: "Arabic",
        name: "Arabic",
        endonym: "العربية",
        dir: "rtl",
      });
    });

    it("selects the language for a deprecated tag", () => {
      render(LanguagePicker, { props: { values: ["he", "en"], value: "iw" } });

      expect(getInput()).toHaveValue("Hebrew");
    });

    it("does not dispatch change when the value is set from outside", async () => {
      const onChange = vi.fn();
      const { rerender } = render(LanguagePicker, {
        props: { values, onChange },
      });

      await rerender({ value: "ja" });
      await tick();

      expect(getInput()).toHaveValue("Japanese");
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("detect", () => {
    it("fills an empty value with the browser's best language once mounted", async () => {
      vi.spyOn(navigator, "languages", "get").mockReturnValue(["fr-CA", "en"]);
      render(LanguagePicker, { props: { values, detect: true } });

      await waitFor(() => expect(getInput()).toHaveValue("French"));
      expect(screen.getByTestId("bound")).toHaveTextContent("fr");
      vi.restoreAllMocks();
    });
  });
});
