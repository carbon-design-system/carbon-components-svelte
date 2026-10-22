import { fireEvent, render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import ButtonEscape from "./Button.escape.test.svelte";
import ButtonInModal from "./ButtonInModal.test.svelte";

function pressEscape(init: KeyboardEventInit = {}) {
  return fireEvent.keyDown(document.activeElement ?? document.body, {
    key: "Escape",
    ...init,
  });
}

describe.each([
  { mode: "inline", portalTooltip: false },
  { mode: "portal", portalTooltip: true },
])("Button icon-only $mode tooltip and Escape", ({ portalTooltip }) => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const onParentKeydown = vi.fn();
    render(ButtonEscape, { props: { portalTooltip, onParentKeydown } });
    const button = screen.getByTestId("button");
    // Inline, CSS shows the tooltip on hover or focus unless the
    // `bx--tooltip--hidden` class holds it back.
    const shown = () =>
      portalTooltip
        ? openTooltips().length === 1
        : button.classList.contains("bx--tooltip__trigger") &&
          !button.classList.contains("bx--tooltip--hidden");
    return { button, shown, onParentKeydown };
  }

  it("hides a focused tooltip, keeps focus, and stops the key there", async () => {
    const { button, shown, onParentKeydown } = setup();

    button.focus();
    await vi.advanceTimersByTimeAsync(0);
    expect(shown()).toBe(true);

    await pressEscape();
    expect(shown()).toBe(false);
    expect(button).toHaveFocus();
    expect(onParentKeydown).not.toHaveBeenCalled();

    // With nothing left to dismiss, Escape reaches ancestors.
    await pressEscape();
    expect(onParentKeydown).toHaveBeenCalledTimes(1);
  });

  it("hides a hovered tooltip while focus is elsewhere", async () => {
    const { button, shown, onParentKeydown } = setup();

    screen.getByLabelText("Other control").focus();
    await fireEvent.mouseEnter(button);
    await vi.advanceTimersByTimeAsync(100);
    expect(shown()).toBe(true);

    await pressEscape();
    expect(shown()).toBe(false);
    expect(onParentKeydown).not.toHaveBeenCalled();
  });

  it("shows the tooltip again on the next pointer enter or focus", async () => {
    const { button, shown } = setup();

    button.focus();
    await vi.advanceTimersByTimeAsync(0);
    await pressEscape();
    expect(shown()).toBe(false);

    await fireEvent.mouseEnter(button);
    await vi.advanceTimersByTimeAsync(100);
    expect(shown()).toBe(true);

    await pressEscape();
    expect(shown()).toBe(false);
    // Still hovered and focused: the tooltip stays hidden.
    await vi.advanceTimersByTimeAsync(1000);
    expect(shown()).toBe(false);

    button.blur();
    button.focus();
    await vi.advanceTimersByTimeAsync(0);
    expect(shown()).toBe(true);
  });

  it.each([{ init: { isComposing: true } }, { init: { keyCode: 229 } }])(
    "ignores Escape during IME composition ($init)",
    async ({ init }) => {
      const { button, shown, onParentKeydown } = setup();

      button.focus();
      await vi.advanceTimersByTimeAsync(0);
      await pressEscape(init);
      expect(shown()).toBe(true);
      expect(onParentKeydown).toHaveBeenCalledTimes(1);
    },
  );
});

describe("Button icon-only tooltip in a Modal", () => {
  it("hides the tooltip on the first Escape and closes the Modal on the second", async () => {
    vi.useFakeTimers();
    try {
      render(ButtonInModal, { props: { modalOpen: true } });
      const modal = document.querySelector(".bx--modal");
      const button = screen.getByTestId("btn-icon-modal");

      button.focus();
      await vi.advanceTimersByTimeAsync(0);
      expect(openTooltips()).toHaveLength(1);

      await pressEscape();
      expect(openTooltips()).toHaveLength(0);
      expect(modal).toHaveClass("is-visible");

      await pressEscape();
      expect(modal).not.toHaveClass("is-visible");
    } finally {
      vi.useRealTimers();
    }
  });
});
