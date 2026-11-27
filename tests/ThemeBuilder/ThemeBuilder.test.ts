import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ThemeBuilder from "./ThemeBuilder.test.svelte";

const tokens = () => JSON.parse(screen.getByTestId("tokens").textContent ?? "");
const resolved = () =>
  JSON.parse(screen.getByTestId("resolved").textContent ?? "");
const field = (token: string) => screen.getByRole("textbox", { name: token });
const zone = () =>
  document.querySelector<HTMLElement>(
    ".bx--theme-builder__preview .bx--theme-zone",
  ) as HTMLElement;

async function setToken(token: string, value: string) {
  const input = field(token);
  await user.clear(input);
  if (value) await user.type(input, value);
}

describe("ThemeBuilder", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
  });

  it("opens the interactive group first", () => {
    render(ThemeBuilder);
    expect(field("button-primary")).toHaveValue("#0f62fe");
    expect(screen.getByRole("button", { name: "Layer (38)" })).toBeVisible();
  });

  it("applies an edit to the preview zone and not the page", async () => {
    render(ThemeBuilder);
    await setToken("button-primary", "#8a3ffc");
    expect(tokens()).toEqual({ "button-primary": "#8a3ffc" });
    expect(zone().getAttribute("style")).toMatch(
      /--cds-button-primary:\s*#8a3ffc/,
    );
    expect(
      document.documentElement.style.getPropertyValue("--cds-button-primary"),
    ).toBe("");
    expect(zone()).toHaveClass("bx--white");
  });

  it("derives related tokens and marks them", async () => {
    render(ThemeBuilder);
    await setToken("button-primary", "#8a3ffc");
    expect(resolved()["button-primary-hover"]).toMatch(/^#[0-9a-f]{6}$/);
    expect(resolved()["button-primary-hover"]).not.toBe("#0050e6");
    // The swatch of a derived token follows it, too.
    expect(screen.getByLabelText("link-primary color picker")).toHaveValue(
      resolved()["link-primary"],
    );
    // Only the edited token is stored as an override.
    expect(Object.keys(tokens())).toEqual(["button-primary"]);
    expect(field("button-primary-hover")).toHaveValue(
      resolved()["button-primary-hover"],
    );
    expect(
      within(
        field("button-primary-hover").closest(
          ".bx--theme-builder__token",
        ) as HTMLElement,
      ).getByText("Derived"),
    ).toBeVisible();
  });

  it("turns derivation off", async () => {
    render(ThemeBuilder);
    await user.click(
      screen.getByRole("switch", { name: "Derive related tokens" }),
    );
    await setToken("button-primary", "#8a3ffc");
    expect(resolved()).toEqual({ "button-primary": "#8a3ffc" });
  });

  it("does not commit a value it cannot use", async () => {
    render(ThemeBuilder);
    await setToken("button-primary", "red; background: url(x)");
    expect(tokens()).toEqual({});
    expect(field("button-primary")).toBeInvalid();
    expect(zone().getAttribute("style") ?? "").not.toContain("url");
  });

  it("resets one token and all tokens", async () => {
    render(ThemeBuilder);
    await setToken("button-primary", "#8a3ffc");
    await user.click(
      screen.getByRole("button", { name: "Reset button-primary" }),
    );
    expect(tokens()).toEqual({});
    expect(field("button-primary")).toHaveValue("#0f62fe");

    await setToken("button-primary", "#8a3ffc");
    await user.click(screen.getByRole("button", { name: "Reset all" }));
    expect(tokens()).toEqual({});
    expect(resolved()).toEqual({});
  });

  it("changes the base theme and keeps the overrides", async () => {
    render(ThemeBuilder);
    await setToken("button-primary", "#8a3ffc");
    await user.selectOptions(screen.getByLabelText("Base theme"), "g100");
    expect(screen.getByTestId("base")).toHaveTextContent("g100");
    expect(zone()).toHaveClass("bx--g100");
    expect(tokens()).toEqual({ "button-primary": "#8a3ffc" });
  });

  it("finds a token by name across groups", async () => {
    render(ThemeBuilder);
    await user.type(
      screen.getByRole("textbox", { name: "Filter tokens" }),
      "tag-hover-re",
    );
    expect(field("tag-hover-red")).toBeVisible();
    await user.clear(screen.getByRole("textbox", { name: "Filter tokens" }));
    await user.type(
      screen.getByRole("textbox", { name: "Filter tokens" }),
      "zzz",
    );
    expect(screen.getByText('No token matches "zzz".')).toBeVisible();
  });

  it("imports CSS and keeps only what a person set", async () => {
    render(ThemeBuilder);
    await user.click(screen.getByRole("tab", { name: "Import" }));
    await fireEvent.input(
      screen.getByLabelText("Paste CSS custom properties or JSON"),
      {
        target: {
          value:
            ":root { --cds-button-primary: #8a3ffc; --cds-nope: #fff; --cds-layer-01: #eef3ff; }",
        },
      },
    );
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(tokens()).toEqual({
      "button-primary": "#8a3ffc",
      "layer-01": "#eef3ff",
    });
    expect(screen.getByText(/named no token/)).toBeVisible();
  });

  it("exports CSS for the resolved theme", async () => {
    render(ThemeBuilder);
    await setToken("button-primary", "#8a3ffc");
    const code = screen.getByRole("tabpanel", { name: "CSS" });
    await waitFor(() =>
      expect(code).toHaveTextContent("--cds-button-primary: #8a3ffc;"),
    );
    expect(code).toHaveTextContent("--cds-button-primary-hover:");
  });

  it("shows a share link of the overrides", async () => {
    render(ThemeBuilder);
    await setToken("button-primary", "#8a3ffc");
    expect(screen.getByLabelText("Share link")).toHaveValue(
      `${window.location.origin}${window.location.pathname}#b=white&button-primary=8a3ffc`,
    );
  });

  it("reads a share link from the hash on mount", async () => {
    window.location.hash = "#b=g90&layer-01=1b2a4a&bad=fff&interactive=red";
    render(ThemeBuilder, { props: { readHash: true } });
    await tick();
    expect(screen.getByTestId("base")).toHaveTextContent("g90");
    expect(tokens()).toEqual({ "layer-01": "#1b2a4a" });
  });

  it("persists to local storage and restores", async () => {
    const { unmount } = render(ThemeBuilder, { props: { persist: true } });
    await tick();
    await setToken("button-primary", "#8a3ffc");
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem("test-theme-builder") ?? "{}").tokens,
      ).toEqual({
        "button-primary": "#8a3ffc",
      }),
    );
    unmount();

    render(ThemeBuilder, { props: { persist: true } });
    await waitFor(() =>
      expect(tokens()).toEqual({ "button-primary": "#8a3ffc" }),
    );
  });

  it("drops an unsafe stored value", async () => {
    localStorage.setItem(
      "test-theme-builder",
      JSON.stringify({
        base: "g100",
        tokens: { "layer-01": "red; x: y", interactive: "#abc" },
      }),
    );
    render(ThemeBuilder, { props: { persist: true } });
    await waitFor(() => expect(tokens()).toEqual({ interactive: "#abc" }));
    expect(screen.getByTestId("base")).toHaveTextContent("g100");
  });

  it("hands the style to a custom preview", async () => {
    render(ThemeBuilder, { props: { custom: true } });
    await setToken("button-primary", "#8a3ffc");
    expect(screen.getByTestId("custom-zone").getAttribute("style")).toMatch(
      /--cds-button-primary:\s*#8a3ffc/,
    );
  });

  it("names a new contrast failure in the status, after the throttle", async () => {
    render(ThemeBuilder);
    const summary = () =>
      document.querySelector(".bx--theme-builder__summary") as HTMLElement;
    expect(summary()).toHaveAttribute("role", "status");
    expect(summary()).toHaveTextContent("1 already fails in White");
    await setToken("button-primary", "#f1c21b");
    await waitFor(() => expect(summary()).toHaveTextContent(/pairs? fail/), {
      timeout: 3000,
    });
    expect(
      screen.getByRole("row", { name: /^text-on-color on button-primary \d/ }),
    ).toHaveTextContent("Fail");
  });

  it("forwards aria attributes to the root group", () => {
    render(ThemeBuilder);
    expect(screen.getByRole("group", { name: "Theme builder" })).toBeVisible();
  });
});
