import { render, screen, within } from "@testing-library/svelte";
import type {
  CarbonTheme,
  CarbonToken,
} from "carbon-components-svelte/Theme/Theme.svelte";
import ThemeComponent, {
  themes,
} from "carbon-components-svelte/Theme/Theme.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { setupStorageEventMock } from "../utils/storage-mocks";
import { user } from "../utils/user";
import Theme from "./Theme.test.svelte";

describe("Theme", () => {
  let documentMock: {
    setAttribute: ReturnType<typeof vi.spyOn>;
    style: { setProperty: ReturnType<typeof vi.spyOn> };
  };
  const { setMockItem } = setupStorageEventMock();

  beforeEach(() => {
    documentMock = {
      setAttribute: vi.spyOn(
        document.documentElement,
        "setAttribute",
      ) as unknown as ReturnType<typeof vi.spyOn>,
      style: {
        setProperty: vi.spyOn(
          document.documentElement.style,
          "setProperty",
        ) as unknown as ReturnType<typeof vi.spyOn>,
      },
    };
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2530
  it("does not fire update event on initial render", () => {
    const onUpdate = vi.fn();
    render(Theme, { props: { onUpdate } });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("should set default theme to white", () => {
    render(Theme);
    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "white");
  });

  it.each<[CarbonTheme, "light" | "dark"]>([
    ["white", "light"],
    ["g10", "light"],
    ["g80", "dark"],
    ["g90", "dark"],
    ["g100", "dark"],
  ])("when theme is %s, should set color-scheme to %s", (theme, expected) => {
    render(Theme, { props: { theme } });
    expect(documentMock.style.setProperty).toHaveBeenCalledWith(
      "color-scheme",
      expected,
    );
  });

  it("should update theme attribute and color-scheme when theme changes", async () => {
    const onUpdate = vi.fn();
    const { rerender } = render(Theme, { props: { onUpdate } });

    expect(documentMock.style.setProperty).toHaveBeenCalledWith(
      "color-scheme",
      "light",
    );

    await rerender({ theme: "g100" });
    await tick();

    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "g100");
    expect(documentMock.style.setProperty).toHaveBeenCalledWith(
      "color-scheme",
      "dark",
    );
    expect(onUpdate).toHaveBeenCalledWith({ theme: "g100" });
  });

  it("should apply custom tokens", async () => {
    const tokens = {
      "button-primary": "#ff0000",
      background: "#ffffff",
    };

    render(Theme, { props: { tokens } });
    await tick();

    expect(documentMock.style.setProperty).toHaveBeenCalledWith(
      "--cds-button-primary",
      "#ff0000",
    );
    expect(documentMock.style.setProperty).toHaveBeenCalledWith(
      "--cds-background",
      "#ffffff",
    );
  });

  it("removes a token dropped from tokens", async () => {
    const { rerender } = render(Theme, {
      props: { tokens: { "button-primary": "#ff0000", background: "#fff" } },
    });
    await tick();

    await rerender({ tokens: { background: "#fff" } });
    await tick();

    const { style } = document.documentElement;
    expect(style.getPropertyValue("--cds-button-primary")).toBe("");
    expect(style.getPropertyValue("--cds-background")).toBe("#fff");
  });

  it("should persist theme in localStorage when persist is true", async () => {
    render(Theme, { props: { persist: true } });
    await tick();

    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "white");
  });

  it("does not fire update event when loading a persisted theme on mount", async () => {
    setMockItem("theme", "g90");
    const onUpdate = vi.fn();

    render(Theme, { props: { persist: true, onUpdate } });
    await tick();

    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "g90");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("should warn on invalid theme", async () => {
    const consoleWarn = vi.spyOn(console, "warn");
    const { rerender } = render(Theme);

    await rerender({ theme: "invalid" as unknown as CarbonTheme });
    await tick();

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('invalid theme "invalid"'),
    );
    expect(consoleWarn).not.toHaveBeenCalledWith(
      expect.stringContaining('"system" prop'),
    );
  });

  // `theme="system"` is a CSS-only theme for <html>. The `theme` prop holds
  // a concrete theme, so it points to the `system` prop instead.
  it("points a system theme to the system prop", async () => {
    const consoleWarn = vi.spyOn(console, "warn");
    const { rerender } = render(Theme);

    await rerender({ theme: "system" as unknown as CarbonTheme });
    await tick();

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Set the "system" prop'),
    );
    expect(documentMock.setAttribute).not.toHaveBeenCalledWith(
      "theme",
      "system",
    );
  });

  describe.each<{
    name: string;
    props: Partial<ComponentProps<Theme>>;
    getControl: () => HTMLElement;
    /** Picks `theme` through the control (toggle ignores it and flips). */
    pick: (control: HTMLElement, theme: CarbonTheme) => Promise<void>;
    /** Asserts the control reflects `theme`. */
    expectShows: (control: HTMLElement, theme: CarbonTheme) => void;
    /** The themes picked in order, starting from "white". */
    picks: [CarbonTheme, CarbonTheme];
    /** Reads the rendered options, when the render mode lists them. */
    readOptions?: (control: HTMLElement) => string[] | Promise<string[]>;
    expectedOptions?: string[];
  }>([
    {
      name: "toggle",
      props: { render: "toggle" },
      getControl: () => screen.getByLabelText("Dark mode"),
      pick: (control) => user.click(control),
      expectShows: (control, theme) =>
        theme === "g100"
          ? expect(control).toBeChecked()
          : expect(control).not.toBeChecked(),
      picks: ["g100", "white"],
    },
    {
      name: "custom toggle",
      props: {
        render: "toggle",
        toggle: {
          themes: ["g10", "g80"],
          labelA: "Enable dark mode",
          labelB: "Enable dark mode",
          hideLabel: true,
          size: "sm",
        },
      },
      getControl: () => screen.getByRole("switch"),
      pick: () => user.click(screen.getAllByText("Enable dark mode")[0]),
      expectShows: (control, theme) =>
        theme === "g80"
          ? expect(control).toBeChecked()
          : expect(control).not.toBeChecked(),
      picks: ["g80", "g10"],
    },
    {
      name: "select",
      props: { render: "select" },
      getControl: () => screen.getByLabelText("Themes"),
      pick: (control, theme) => user.selectOptions(control, theme),
      expectShows: (control, theme) => expect(control).toHaveValue(theme),
      picks: ["g100", "white"],
    },
    {
      name: "custom select",
      props: {
        render: "select",
        select: {
          themes: ["white", "g90", "g100"],
          labelText: "Select a theme",
          inline: true,
        },
      },
      getControl: () => screen.getByLabelText("Select a theme"),
      pick: (control, theme) => user.selectOptions(control, theme),
      expectShows: (control, theme) => expect(control).toHaveValue(theme),
      picks: ["g100", "white"],
      readOptions: (control) =>
        within(control)
          .getAllByRole("option")
          .map((option) => option.getAttribute("value") ?? ""),
      expectedOptions: ["white", "g90", "g100"],
    },
    {
      name: "dropdown",
      props: { render: "dropdown" },
      getControl: () => screen.getByLabelText("Themes"),
      pick: async (control, theme) => {
        await user.click(control);
        await user.click(screen.getByText(themes[theme]));
      },
      expectShows: (control, theme) =>
        expect(control).toHaveTextContent(themes[theme]),
      picks: ["g100", "white"],
    },
    {
      name: "custom dropdown",
      props: {
        render: "dropdown",
        dropdown: {
          themes: ["white", "g90", "g100"],
          labelText: "Select a theme",
          type: "inline",
        },
      },
      getControl: () => screen.getByLabelText("Select a theme"),
      pick: async (control, theme) => {
        await user.click(control);
        await user.click(screen.getByText(themes[theme]));
      },
      expectShows: (control, theme) =>
        expect(control).toHaveTextContent(themes[theme]),
      picks: ["g100", "white"],
      readOptions: async (control) => {
        await user.click(control);
        const options = screen
          .getAllByRole("option")
          .map((option) => option.textContent?.trim() ?? "");
        await user.click(control);
        return options;
      },
      expectedOptions: ["White", "Gray 90", "Gray 100"],
    },
  ])(
    "render $name",
    ({
      props,
      getControl,
      pick,
      expectShows,
      picks,
      readOptions,
      expectedOptions,
    }) => {
      it("switches the theme through the control", async () => {
        const onUpdate = vi.fn();
        render(Theme, { props: { ...props, onUpdate } });

        const control = getControl();
        expectShows(control, "white");
        if (readOptions) {
          expect(await readOptions(control)).toEqual(expectedOptions);
        }

        const step = async (theme: CarbonTheme) => {
          await pick(control, theme);
          expectShows(control, theme);
          expect(onUpdate).toHaveBeenLastCalledWith({ theme });
        };
        await step(picks[0]);
        await step(picks[1]);
      });
    },
  );

  it("should allow using exported themes const to build custom select", async () => {
    const customThemeKeys = Object.keys(themes) as CarbonTheme[];

    render(Theme, {
      props: {
        render: "select",
        select: { themes: customThemeKeys, labelText: "Available themes" },
      },
    });

    const select = screen.getByLabelText("Available themes");

    await Object.entries(themes).reduce(async (promise, [key, label]) => {
      await promise;
      const themeKey = key as CarbonTheme;
      await user.selectOptions(select, themeKey);
      expect(select).toHaveValue(themeKey);
      expect(
        within(select).getByRole("option", { selected: true }),
      ).toHaveTextContent(label);
    }, Promise.resolve());
  });

  it("should allow using subset of exported themes", async () => {
    const lightThemes = (Object.keys(themes) as CarbonTheme[]).filter((theme) =>
      ["white", "g10"].includes(theme),
    );

    render(Theme, {
      props: {
        render: "select",
        select: { themes: lightThemes, labelText: "Light themes" },
      },
    });

    const select = screen.getByLabelText("Light themes");

    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.getAttribute("value")),
    ).toEqual(["white", "g10"]);

    await user.selectOptions(select, "g10");
    expect(select).toHaveValue("g10");
    expect(
      within(select).getByRole("option", { selected: true }),
    ).toHaveTextContent(themes.g10);
  });

  it.each([
    {
      mode: "toggle",
      check: (el: HTMLElement) => expect(el).toBeChecked(),
      label: "Dark mode",
    },
    {
      mode: "select",
      check: (el: HTMLElement) => expect(el).toHaveValue("g100"),
      label: "Themes",
    },
    {
      mode: "dropdown",
      check: (el: HTMLElement) => expect(el).toHaveTextContent("Gray 100"),
      label: "Themes",
    },
  ] as const)(
    "reflects a programmatic theme change in the $mode control",
    async ({ mode, check, label }) => {
      const { component } = render(Theme, { props: { render: mode } });

      component.theme = "g100";
      await tick();

      check(screen.getByLabelText(label));
    },
  );

  it("passes the current theme to the default slot", async () => {
    const { component } = render(Theme, { props: { theme: "g10" } });
    expect(screen.getByTestId("slot-theme")).toHaveTextContent("g10");

    component.theme = "g90";
    await tick();

    expect(screen.getByTestId("slot-theme")).toHaveTextContent("g90");
  });

  it.each([
    { mode: "toggle", check: (el: HTMLElement) => expect(el).toBeChecked() },
    {
      mode: "select",
      check: (el: HTMLElement) => expect(el).toHaveValue("g100"),
    },
    {
      mode: "dropdown",
      check: (el: HTMLElement) => expect(el).toHaveTextContent("Gray 100"),
    },
  ] as const)(
    "uses the default themes when $mode props omit them",
    ({ mode, check }) => {
      render(ThemeComponent, {
        props: { theme: "g100", render: mode, [mode]: { labelText: "Theme" } },
      });

      check(screen.getByLabelText("Theme", { exact: false }));
    },
  );

  describe("Token types", () => {
    type Tokens = ComponentProps<ThemeComponent>["tokens"];

    it("types tokens by Carbon v11 token name", () => {
      expectTypeOf<Tokens>().toEqualTypeOf<
        Partial<Record<CarbonToken, string>> | undefined
      >();
      expectTypeOf<"button-primary">().toExtend<CarbonToken>();
      expectTypeOf<"layer-03">().toExtend<CarbonToken>();
    });

    it("rejects v10 token names", () => {
      const tokens: Tokens = {
        "button-primary": "#d02670",
        // @ts-expect-error: v10 name, use "text-primary"
        "text-01": "#ffffff",
      };
      expect(tokens).toBeDefined();
    });
  });
});
