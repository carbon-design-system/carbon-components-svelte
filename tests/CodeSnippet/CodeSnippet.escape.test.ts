import { fireEvent, render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { pressEscape } from "../utils/tooltip-escape";
import CodeSnippetInlineInModal from "./CodeSnippetInlineInModal.test.svelte";
import { mockClipboard, removeFloatingPortals } from "./helpers";

describe.each([
  { mode: "inline", portalTooltip: false },
  { mode: "portal", portalTooltip: true },
])("Inline CodeSnippet $mode copy feedback and Escape", ({ portalTooltip }) => {
  beforeEach(() => {
    mockClipboard();
  });

  afterEach(removeFloatingPortals);

  async function setup() {
    render(CodeSnippetInlineInModal, {
      props: { modalOpen: true, portalTooltip },
    });
    const modal = document.querySelector(".bx--modal");
    const button = screen.getByRole("button", { name: "Copy code" });
    const shown = () =>
      portalTooltip
        ? openTooltips().length === 1
        : button.classList.contains("bx--copy-btn--animating");

    button.focus();
    await fireEvent.click(button);
    await Promise.resolve();
    expect(shown()).toBe(true);
    return { modal, button, shown };
  }

  it("hides the feedback, keeps focus, and leaves the Modal open", async () => {
    const { modal, button, shown } = await setup();

    await pressEscape();
    expect(shown()).toBe(false);
    expect(button).toHaveFocus();
    expect(modal).toHaveClass("is-visible");

    await pressEscape();
    expect(modal).not.toHaveClass("is-visible");
  });

  it.each([{ init: { isComposing: true } }, { init: { keyCode: 229 } }])(
    "ignores Escape during IME composition ($init)",
    async ({ init }) => {
      const { shown } = await setup();

      await pressEscape(init);
      expect(shown()).toBe(true);
    },
  );
});
