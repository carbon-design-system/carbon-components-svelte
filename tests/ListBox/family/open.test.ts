import { screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../../utils/user";
import { caseRows, field, renderCase } from "./cases";

describe.each(caseRows)("%s open event", (_, c) => {
  const setup = (open = false) => {
    const onOpen = vi.fn();
    const result = renderCase(c, {}, { open, onOpen });
    return { ...result, onOpen };
  };

  const expectOpenedBy = (
    onOpen: ReturnType<typeof vi.fn>,
    trigger: string,
  ) => {
    expect(field()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger });
  };

  it('dispatches open with trigger "click" when the field is clicked', async () => {
    const { onOpen } = setup();

    await user.click(field());

    expectOpenedBy(onOpen, "click");
  });

  it.each(c.openKeys)(
    'dispatches open with trigger "keydown" on %s',
    async (key) => {
      const { onOpen } = setup();

      field().focus();
      await user.keyboard(key);

      expectOpenedBy(onOpen, "keydown");
    },
  );

  it.runIf(c.opensOnInput)(
    'dispatches open with trigger "input" when typing',
    async () => {
      const { onOpen } = setup();

      field().focus();
      await user.keyboard("Em");

      expectOpenedBy(onOpen, "input");
    },
  );

  describe.runIf(c.opensOnFocus)("openOnFocus", () => {
    it('dispatches open with trigger "focus" when focus arrives', async () => {
      const onOpen = vi.fn();
      renderCase(c, { openOnFocus: true }, { onOpen });

      await user.tab();

      expectOpenedBy(onOpen, "focus");
    });

    it("leaves the menu closed on focus by default", async () => {
      const { onOpen } = setup();

      await user.tab();

      expect(field()).toHaveFocus();
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(onOpen).not.toHaveBeenCalled();
    });

    it("leaves the menu closed when focus moves in from inside", async () => {
      const onOpen = vi.fn();
      renderCase(c, { openOnFocus: true, ...c.preselect("0") }, { onOpen });

      // The clear button sits inside the list box.
      const box = field().closest(".bx--list-box");
      const clear = screen
        .getAllByRole("button")
        .find(
          (button) =>
            button !== field() && button.closest(".bx--list-box") === box,
        );
      assert(clear);
      clear.focus();
      field().focus();
      await tick();

      expect(field()).toHaveFocus();
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  it('dispatches open with trigger "programmatic" when `open` is set', async () => {
    const { onOpen, rerender } = setup();

    await rerender({ open: true });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "programmatic" });
  });

  it("does not dispatch open when mounted open", () => {
    const { onOpen } = setup(true);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("dispatches open once per open transition", async () => {
    const { onOpen } = setup();

    await user.click(field());
    await user.keyboard("{ArrowDown}{ArrowDown}{Escape}");
    await user.click(field());

    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});
