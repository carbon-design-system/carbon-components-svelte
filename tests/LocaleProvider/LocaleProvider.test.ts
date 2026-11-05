import { render, screen } from "@testing-library/svelte";
import LocaleProvider from "./LocaleProvider.test.svelte";

const context = (id: string) =>
  JSON.parse(screen.getByTestId(id).textContent ?? "{}");

describe("LocaleProvider", () => {
  it("holds nothing outside a provider", () => {
    render(LocaleProvider, { props: { outside: true } });
    expect(context("outside")).toEqual({});
  });

  it("renders no element without dir", () => {
    const { container } = render(LocaleProvider, {
      props: { provider: { locale: "de-CH" } },
    });
    expect(container.querySelector("[dir]")).toBeNull();
    expect(context("outer").locale).toBe("de-CH");
    expect(context("outer").dir).toBeUndefined();
  });

  it("writes the unicode extension keys into the locale tag", () => {
    render(LocaleProvider, {
      props: {
        provider: {
          locale: "de-CH",
          hourCycle: "h12",
          numberingSystem: "arab",
          calendar: "buddhist",
          timeZone: "Europe/Zurich",
          weekStart: 6,
        },
      },
    });
    expect(context("outer")).toMatchObject({
      baseLocale: "de-CH",
      locale: "de-CH-u-ca-buddhist-hc-h12-nu-arab",
      timeZone: "Europe/Zurich",
      weekStart: 6,
    });
  });

  it("keeps an invalid tag as it was given", () => {
    render(LocaleProvider, {
      props: { provider: { locale: "not_a_tag", hourCycle: "h23" } },
    });
    expect(context("outer").locale).toBe("not_a_tag");
  });

  it("follows a locale change", async () => {
    const { rerender } = render(LocaleProvider, {
      props: { provider: { locale: "de-DE" } },
    });
    await rerender({ provider: { locale: "ja-JP" } });
    expect(context("outer").locale).toBe("ja-JP");
  });

  describe("nesting", () => {
    it("overrides the fields it sets and keeps the rest", () => {
      render(LocaleProvider, {
        props: {
          provider: {
            locale: "de-CH",
            timeZone: "UTC",
            numberingSystem: "arab",
          },
          nested: { locale: "fr-CH" },
        },
      });
      expect(context("outer").locale).toBe("de-CH-u-nu-arab");
      expect(context("inner")).toMatchObject({
        baseLocale: "fr-CH",
        locale: "fr-CH-u-nu-arab",
        timeZone: "UTC",
      });
    });

    it("inherits the locale when it sets another field", () => {
      render(LocaleProvider, {
        props: {
          provider: { locale: "en-US" },
          nested: { hourCycle: "h23" },
        },
      });
      expect(context("inner").locale).toBe("en-US-u-hc-h23");
      expect(context("outer").locale).toBe("en-US");
    });
  });

  describe("dir", () => {
    it.each([
      ["ar-EG", "rtl"],
      ["he", "rtl"],
      ["de-CH", "ltr"],
      ["ja-JP", "ltr"],
    ])("auto reads %s as %s", (locale, dir) => {
      render(LocaleProvider, { props: { provider: { locale, dir: "auto" } } });
      const element = screen.getByTestId("wrapper-outer");
      expect(element).toHaveAttribute("dir", dir);
      expect(element).toHaveAttribute("lang", locale);
      expect(context("outer").dir).toBe(dir);
    });

    it("sets the direction that components read, and a plain dir wins", () => {
      render(LocaleProvider, {
        props: {
          provider: { locale: "ar", dir: "auto" },
          nested: { dir: "ltr" },
        },
      });
      expect(context("outer").dir).toBe("rtl");
      expect(screen.getByTestId("wrapper-inner")).toHaveAttribute("dir", "ltr");
      expect(context("inner").dir).toBe("ltr");
    });

    it("re-reads auto when the locale changes", async () => {
      const { rerender } = render(LocaleProvider, {
        props: { provider: { locale: "en-US", dir: "auto" } },
      });
      await rerender({ provider: { locale: "ar-EG", dir: "auto" } });
      expect(screen.getByTestId("wrapper-outer")).toHaveAttribute("dir", "rtl");
    });

    it("reads auto from the locale above when it sets none", () => {
      render(LocaleProvider, {
        props: {
          provider: { locale: "he" },
          nested: { dir: "auto" },
        },
      });
      expect(screen.getByTestId("wrapper-inner")).toHaveAttribute("dir", "rtl");
    });
  });

  describe("translate", () => {
    const translated = (id: string) =>
      screen.getByTestId(id).getAttribute("data-translated");

    it("answers through the translate context", () => {
      render(LocaleProvider, {
        props: {
          provider: { translate: (id: string) => ({ greeting: "Hallo" })[id] },
        },
      });
      expect(translated("outer")).toBe("Hallo");
    });

    it("leaves a missing id to the component's English text", () => {
      render(LocaleProvider, { props: { provider: { locale: "de-DE" } } });
      expect(translated("outer")).toBeNull();
    });

    it("asks a nested provider first, then the one above", () => {
      render(LocaleProvider, {
        props: {
          provider: { translate: () => "outer" },
          nested: {
            translate: (id: string) => (id === "other" ? "x" : undefined),
          },
        },
      });
      expect(translated("inner")).toBe("outer");
    });
  });
});
