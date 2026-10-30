import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ColorPicker from "./ColorPicker.test.svelte";

const area = () =>
  screen.getByRole("slider", { name: "Saturation and brightness" });
const hue = () => screen.getByRole("slider", { name: "Hue" });
const alphaSlider = () => screen.getByRole("slider", { name: "Alpha" });
const value = () => screen.getByTestId("value").textContent;
const swatchOptions = (name = "Preset colors") =>
  within(screen.getByRole("listbox", { name })).getAllByRole("option");

const swatches = [
  { value: "#da1e28", label: "Red" },
  { value: "#24a148", label: "Green" },
  { value: "#0f62fe", label: "Blue" },
  { value: "#f1c21b", label: "Yellow" },
];

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  Reflect.deleteProperty(window, "EyeDropper");
});

describe("ColorPicker", () => {
  it("names the group, the area and the hue slider", () => {
    render(ColorPicker, { value: "#0f62fe" });

    expect(screen.getByRole("group", { name: "Color picker" })).toBeVisible();
    expect(area()).toHaveAttribute("aria-roledescription", "2D slider");
    expect(area()).toHaveAttribute(
      "aria-valuetext",
      "Saturation 94%, brightness 100%, blue",
    );
    expect(hue()).toHaveAttribute("aria-valuetext", "219 degrees, blue");
    expect(hue()).toHaveAttribute("aria-valuemax", "360");
  });

  it("moves saturation and brightness with the arrow keys", async () => {
    const { component } = render(ColorPicker, { value: "#ff0000" });
    area().focus();

    await user.keyboard("{ArrowLeft}");
    expect(area()).toHaveAttribute(
      "aria-valuetext",
      "Saturation 99%, brightness 100%, red",
    );
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(area()).toHaveAttribute(
      "aria-valuetext",
      "Saturation 99%, brightness 90%, red",
    );
    expect(value()).toMatch(/^#e6[0-9a-f]{2}[0-9a-f]{2}$/);
    // One `input` and one `change` for each key.
    expect(component.inputs).toHaveLength(2);
    expect(component.changes).toHaveLength(2);
  });

  it("swaps the horizontal arrows in a right-to-left layout", async () => {
    document.documentElement.dir = "rtl";
    render(ColorPicker, { value: "#ff0000" });
    area().focus();

    await user.keyboard("{ArrowRight}");
    expect(area()).toHaveAttribute("aria-valuenow", "99");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(area()).toHaveAttribute("aria-valuenow", "100");
  });

  it("keeps the hue when brightness reaches zero", async () => {
    render(ColorPicker, { value: "#0f62fe" });
    area().focus();

    for (let i = 0; i < 10; i += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: keys go in order
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    }
    expect(value()).toBe("#000000");
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    const [, r, , b] = /^#(..)(..)(..)$/.exec(value() ?? "") ?? [];
    expect(Number.parseInt(b, 16)).toBeGreaterThan(Number.parseInt(r, 16));
  });

  it("moves the hue and clamps it with Home and End", async () => {
    render(ColorPicker, { value: "#ff0000" });
    hue().focus();

    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(hue()).toHaveAttribute("aria-valuenow", "10");
    expect(value()).toBe("#ff2a00");
    await user.keyboard("{End}");
    expect(hue()).toHaveAttribute("aria-valuenow", "360");
    await user.keyboard("{Home}");
    expect(hue()).toHaveAttribute("aria-valuenow", "0");
  });

  it("follows a value set from outside, without echoing it back", async () => {
    const { component, rerender } = render(ColorPicker, { value: "#0f62fe" });

    await rerender({ value: "rgb(218, 30, 40)" });

    expect(area()).toHaveAttribute(
      "aria-valuetext",
      "Saturation 86%, brightness 85%, red",
    );
    expect(component.inputs).toEqual([]);
    expect(value()).toBe("rgb(218, 30, 40)");
  });

  it("ignores a value it cannot parse", async () => {
    const { rerender } = render(ColorPicker, { value: "#0f62fe" });

    await rerender({ value: "not a color" });

    expect(area()).toHaveAttribute("aria-valuenow", "94");
  });

  it("sets the color from pointer position, and mirrors it in RTL", async () => {
    document.documentElement.dir = "rtl";
    render(ColorPicker, { value: "#ff0000" });
    const box = area().parentElement as HTMLElement;
    box.getBoundingClientRect = () =>
      ({
        left: 0,
        right: 200,
        top: 0,
        bottom: 100,
        width: 200,
        height: 100,
      }) as DOMRect;

    await fireEvent.pointerDown(box, {
      clientX: 150,
      clientY: 25,
      pointerId: 1,
      button: 0,
    });
    await fireEvent.pointerUp(box, { pointerId: 1 });

    // 150 of 200 from the left is 25% from the inline start in RTL.
    expect(area()).toHaveAttribute("aria-valuenow", "25");
    expect(area()).toHaveFocus();
    expect(value()).toMatch(/^#[0-9a-f]{6}$/);
  });

  describe("text fields", () => {
    it("commits a hex value on change", async () => {
      render(ColorPicker, { value: "#0f62fe" });
      const field = screen.getByRole("textbox", { name: "Hex" });

      await user.clear(field);
      await user.type(field, "da1e28{Tab}");

      expect(value()).toBe("#da1e28");
      expect(field).toHaveValue("#da1e28");
    });

    it("marks an unreadable hex value invalid and keeps the color", async () => {
      render(ColorPicker, { value: "#0f62fe" });
      const field = screen.getByRole("textbox", { name: "Hex" });

      await user.clear(field);
      await user.type(field, "nope{Tab}");

      expect(field).toBeInvalid();
      expect(screen.getByText("Enter a color such as #0f62fe")).toBeVisible();
      expect(value()).toBe("#0f62fe");
    });

    it("clears the error as soon as the typed value reads", async () => {
      render(ColorPicker, { value: "#0f62fe" });
      const field = screen.getByRole("textbox", { name: "Hex" });

      await user.clear(field);
      await user.type(field, "nope{Tab}");
      expect(field).toBeInvalid();

      await user.clear(field);
      await user.type(field, "#d");
      expect(field).toBeInvalid();
      await user.type(field, "a1e28");
      expect(field).not.toBeInvalid();
      // The color changes on commit, not on each key.
      expect(value()).toBe("#0f62fe");
    });

    it("switches the format and rewrites the value", async () => {
      render(ColorPicker, { value: "#0f62fe" });

      await user.selectOptions(
        screen.getByRole("combobox", { name: "Color format" }),
        "rgb",
      );

      expect(screen.getByTestId("format")).toHaveTextContent("rgb");
      expect(value()).toBe("rgb(15, 98, 254)");
      expect(screen.getByRole("spinbutton", { name: "Red" })).toHaveValue(15);
      expect(screen.getByRole("spinbutton", { name: "Blue" })).toHaveValue(254);

      await user.selectOptions(
        screen.getByRole("combobox", { name: "Color format" }),
        "hsl",
      );
      expect(value()).toBe("hsl(219, 99%, 53%)");
    });

    it("clamps a channel typed past its range", async () => {
      render(ColorPicker, { value: "rgb(15, 98, 254)", format: "rgb" });
      const red = screen.getByRole("spinbutton", { name: "Red" });

      await user.clear(red);
      await user.type(red, "300{Tab}");

      expect(value()).toBe("rgb(255, 98, 254)");
      expect(red).toHaveValue(255);
    });

    it("hides the fields with hideInputs", () => {
      render(ColorPicker, { hideInputs: true });

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });
  });

  describe("alpha", () => {
    it("adds no alpha slider by default, and writes an opaque value", async () => {
      render(ColorPicker, { value: "#0f62fe80" });

      expect(
        screen.queryByRole("slider", { name: "Alpha" }),
      ).not.toBeInTheDocument();
      area().focus();
      await user.keyboard("{ArrowLeft}");
      expect(value()).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("adds an alpha slider and field, and writes alpha into the value", async () => {
      render(ColorPicker, { value: "#0f62fe", alpha: true });
      expect(alphaSlider()).toHaveAttribute("aria-valuetext", "100%");

      alphaSlider().focus();
      await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");

      expect(alphaSlider()).toHaveAttribute("aria-valuenow", "90");
      expect(value()).toBe("#0f62fee6");
    });

    it("reads alpha from the value", () => {
      render(ColorPicker, { value: "rgba(15, 98, 254, 0.5)", alpha: true });

      expect(alphaSlider()).toHaveAttribute("aria-valuenow", "50");
    });
  });

  describe("swatches", () => {
    it("shows a listbox of named swatches and marks the current color", () => {
      render(ColorPicker, { value: "#24a148", swatches });

      const list = screen.getByRole("listbox", { name: "Preset colors" });
      const options = swatchOptions();
      expect(list).toBeVisible();
      expect(
        options.map((option) => option.getAttribute("aria-label")),
      ).toEqual(["Red", "Green", "Blue", "Yellow"]);
      expect(
        options.map((option) => option.getAttribute("aria-selected")),
      ).toEqual(["false", "true", "false", "false"]);
    });

    it("chooses a swatch by click", async () => {
      const { component } = render(ColorPicker, { value: "#0f62fe", swatches });

      await user.click(screen.getByRole("option", { name: "Red" }));

      expect(value()).toBe("#da1e28");
      expect(component.changes).toEqual(["#da1e28"]);
    });

    it("moves focus with the arrow keys and chooses on Enter", async () => {
      render(ColorPicker, { value: "#0f62fe", swatches });
      const [red, green, blue] = swatchOptions();

      // One tab stop: the chosen swatch.
      expect(blue).toHaveAttribute("tabindex", "0");
      expect(red).toHaveAttribute("tabindex", "-1");

      blue.focus();
      await user.keyboard("{ArrowLeft}");
      expect(green).toHaveFocus();
      // Moving did not pick: the arrow keys never change the color.
      expect(value()).toBe("#0f62fe");

      await user.keyboard("{Home}");
      expect(red).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(value()).toBe("#da1e28");
    });

    it("moves a row with Up and Down", async () => {
      render(ColorPicker, { value: "#0f62fe", swatches, swatchColumns: 2 });
      const options = swatchOptions();

      options[0].focus();
      await user.keyboard("{ArrowDown}");
      expect(options[2]).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(options[0]).toHaveFocus();
    });

    it("swaps Left and Right in a right-to-left layout", async () => {
      document.documentElement.dir = "rtl";
      render(ColorPicker, { value: "#0f62fe", swatches });
      const options = swatchOptions();

      options[0].focus();
      await user.keyboard("{ArrowLeft}");

      expect(options[1]).toHaveFocus();
    });
  });

  describe("recent colors", () => {
    it("lists a picked color, newest first, without duplicates", async () => {
      render(ColorPicker, { value: "#0f62fe", swatches });
      expect(
        screen.queryByRole("listbox", { name: "Recent colors" }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("option", { name: "Red" }));
      await user.click(screen.getByRole("option", { name: "Green" }));
      await user.click(screen.getByRole("option", { name: "Red" }));

      expect(screen.getByTestId("recent")).toHaveTextContent("#da1e28 #24a148");
      expect(
        screen.getByRole("listbox", { name: "Recent colors" }),
      ).toBeVisible();
    });

    it("keeps at most recentLimit colors", async () => {
      render(ColorPicker, { value: "#0f62fe", swatches, recentLimit: 2 });

      for (const name of ["Red", "Green", "Yellow"]) {
        // biome-ignore lint/performance/noAwaitInLoops: clicks go in order
        await user.click(screen.getByRole("option", { name }));
      }

      expect(screen.getByTestId("recent")).toHaveTextContent("#f1c21b #24a148");
    });

    it("adds a keyboard change when focus leaves the control", async () => {
      render(ColorPicker, { value: "#0f62fe" });
      area().focus();

      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(screen.getByTestId("recent")).toHaveTextContent("");
      await user.tab();

      expect(screen.getByTestId("recent").textContent).toMatch(
        /^#[0-9a-f]{6}$/,
      );
    });
  });

  describe("contrast", () => {
    it("warns when the color is too close to the background", () => {
      render(ColorPicker, { value: "#f1c21b", background: "#ffffff" });

      expect(screen.getByRole("status")).toHaveTextContent(
        "Contrast with the background is below 4.5:1",
      );
      expect(area()).toHaveAccessibleDescription(
        "Contrast with the background is below 4.5:1",
      );
    });

    it("keeps an empty status region when the color reads", () => {
      render(ColorPicker, { value: "#161616", background: "#ffffff" });

      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      expect(area()).not.toHaveAccessibleDescription();
    });

    it("uses minContrast as the threshold", () => {
      render(ColorPicker, {
        value: "#8d8d8d",
        background: "#ffffff",
        minContrast: 3,
      });

      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    it("shows no status region without a background", () => {
      render(ColorPicker);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("eyedropper", () => {
    it("is absent where the browser has no EyeDropper", () => {
      render(ColorPicker);

      expect(
        screen.queryByRole("button", { name: "Pick a color from the screen" }),
      ).not.toBeInTheDocument();
    });

    it("picks a color from the screen and keeps the alpha", async () => {
      const open = vi.fn().mockResolvedValue({ sRGBHex: "#da1e28" });
      // @ts-expect-error a minimal EyeDropper
      window.EyeDropper = class {
        open = open;
      };
      render(ColorPicker, { value: "rgba(15, 98, 254, 0.5)", alpha: true });

      await user.click(
        await screen.findByRole("button", {
          name: "Pick a color from the screen",
        }),
      );

      expect(open).toHaveBeenCalledOnce();
      await vi.waitFor(() => expect(value()).toBe("#da1e2880"));
    });

    it("leaves the color when the pick is cancelled", async () => {
      // @ts-expect-error a minimal EyeDropper
      window.EyeDropper = class {
        open = () => Promise.reject(new DOMException("", "AbortError"));
      };
      render(ColorPicker, { value: "#0f62fe" });

      await user.click(
        await screen.findByRole("button", {
          name: "Pick a color from the screen",
        }),
      );

      expect(value()).toBe("#0f62fe");
    });

    it("hides with hideEyeDropper", async () => {
      // @ts-expect-error a minimal EyeDropper
      window.EyeDropper = class {};
      render(ColorPicker, { hideEyeDropper: true });
      await tick();

      expect(
        screen.queryByRole("button", { name: "Pick a color from the screen" }),
      ).not.toBeInTheDocument();
    });
  });

  it("takes the thumbs and fields out of the tab order when disabled", () => {
    render(ColorPicker, { disabled: true, swatches });

    expect(area()).not.toHaveAttribute("tabindex");
    expect(hue()).not.toHaveAttribute("tabindex");
    expect(screen.getByRole("textbox", { name: "Hex" })).toBeDisabled();
    for (const option of swatchOptions()) {
      expect(option).toBeDisabled();
    }
  });

  it("keeps the color but stays focusable when read-only", async () => {
    (window as unknown as { EyeDropper: unknown }).EyeDropper = class {};
    render(ColorPicker, { value: "#0f62fe", readonly: true, swatches });
    await tick();

    expect(area()).toHaveAttribute("tabindex", "0");
    expect(area()).toHaveAttribute("aria-readonly", "true");
    expect(area()).toHaveAccessibleDescription("Read-only");
    expect(hue()).toHaveAccessibleDescription("Read-only");

    await user.click(area());
    await user.keyboard("{ArrowLeft}{Home}");
    hue().focus();
    await user.keyboard("{End}");
    await user.click(swatchOptions()[0]);

    expect(value()).toBe("#0f62fe");
    expect(screen.getByRole("textbox", { name: "Hex" })).toHaveAttribute(
      "readonly",
    );
    expect(
      screen.getByRole("listbox", { name: "Preset colors" }),
    ).toHaveAttribute("aria-readonly", "true");
    expect(
      screen.queryByRole("button", { name: "Pick a color from the screen" }),
    ).not.toBeInTheDocument();
  });
});
