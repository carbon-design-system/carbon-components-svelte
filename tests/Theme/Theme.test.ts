import { render, screen } from "@testing-library/svelte";
import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import Theme from "./Theme.test.svelte";
import ThemeSelect from "./ThemeSelect.test.svelte";
import ThemeSelectCustom from "./ThemeSelectCustom.test.svelte";
import ThemeToggle from "./ThemeToggle.test.svelte";
import ThemeToggleCustom from "./ThemeToggleCustom.test.svelte";

describe("Theme", () => {
  let documentMock: {
    setAttribute: ReturnType<typeof vi.spyOn>;
    style: { setProperty: ReturnType<typeof vi.spyOn> };
  };
  let consoleLog: Console["log"];
  let localStorageMock: Record<string, string>;
  let originalLocalStorage: Storage;

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
    consoleLog = vi.spyOn(console, "log");
    originalLocalStorage = global.localStorage;
    localStorageMock = {};

    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.localStorage = originalLocalStorage;
    localStorage.clear();
    localStorageMock = {};
  });

  it("should set default theme to white", () => {
    render(Theme);
    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "white");
  });

  it("should update theme attribute when theme changes", async () => {
    const { component } = render(Theme);

    component.$set({ theme: "g100" });
    await tick();

    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "g100");
    expect(consoleLog).toHaveBeenCalledWith("update", { theme: "g100" });
  });

  it("should apply custom tokens", async () => {
    const tokens = {
      "interactive-01": "#ff0000",
      "ui-background": "#ffffff",
    };

    render(Theme, { props: { tokens } });
    await tick();

    expect(documentMock.style.setProperty).toHaveBeenCalledWith(
      "--cds-interactive-01",
      "#ff0000",
    );
    expect(documentMock.style.setProperty).toHaveBeenCalledWith(
      "--cds-ui-background",
      "#ffffff",
    );
  });

  it("should persist theme in localStorage when persist is true", async () => {
    render(Theme, { props: { persist: true } });
    await tick();

    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "white");
  });

  it("should load persisted theme from localStorage", async () => {
    localStorageMock["theme"] = "g90";

    render(Theme, { props: { persist: true } });
    await tick();

    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "g90");
  });

  it("should warn on invalid theme", async () => {
    const consoleWarn = vi.spyOn(console, "warn");
    const { component } = render(Theme);

    component.$set({ theme: "invalid" as unknown as CarbonTheme });
    await tick();

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('invalid theme "invalid"'),
    );
  });

  it("should render toggle when render prop is set to toggle", async () => {
    render(ThemeToggle);

    const toggle = screen.getByLabelText("Dark mode");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("type", "checkbox");

    await user.click(toggle);
    expect(consoleLog).toHaveBeenCalledWith("update", { theme: "g100" });

    await user.click(toggle);
    expect(consoleLog).toHaveBeenCalledWith("update", { theme: "white" });
  });

  it("should render custom toggle when render prop is set to toggle and custom toggle options are provided", async () => {
    render(ThemeToggleCustom);

    const checkbox = screen.getByRole("switch");
    assert(checkbox);
    expect(checkbox).not.toBeChecked();

    const toggle = screen.getAllByText("Enable dark mode")[0];
    expect(toggle).toBeInTheDocument();

    await user.click(toggle);
    expect(consoleLog).toHaveBeenCalledWith("update", { theme: "g80" });
    expect(checkbox).toBeChecked();

    await user.click(toggle);
    expect(consoleLog).toHaveBeenCalledWith("update", { theme: "g10" });
    expect(checkbox).not.toBeChecked();
  });

  it("should render select when render prop is set to select", async () => {
    render(ThemeSelect);

    const select = screen.getByLabelText("Themes");
    expect(select).toBeInTheDocument();
    expect(select).toHaveTextContent("White");
    expect(select).toHaveValue("white");

    await user.selectOptions(select, "g100");
    expect(select).toHaveTextContent("Gray 100");
    expect(select).toHaveValue("g100");
    expect(consoleLog).toHaveBeenCalledWith("update", { theme: "g100" });

    await user.selectOptions(select, "white");
    expect(select).toHaveTextContent("White");
    expect(select).toHaveValue("white");
    expect(consoleLog).toHaveBeenCalledWith("update", { theme: "white" });
  });

  it("should render custom select when render prop is set to select and custom select options are provided", async () => {
    render(ThemeSelectCustom);

    const select = screen.getByLabelText("Select a theme");
    expect(select).toBeInTheDocument();
    expect(select).toHaveTextContent("White");
    expect(select).toHaveValue("white");

    await user.selectOptions(select, "g100");
    expect(select).toHaveTextContent("Gray 100");
    expect(select).toHaveValue("g100");
    expect(consoleLog).toHaveBeenCalledWith("update", { theme: "g100" });

    await user.selectOptions(select, "white");
    expect(select).toHaveTextContent("White");
    expect(select).toHaveValue("white");
    expect(consoleLog).toHaveBeenCalledWith("update", { theme: "white" });
  });
});
