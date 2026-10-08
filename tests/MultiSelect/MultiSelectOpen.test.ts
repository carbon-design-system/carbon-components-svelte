import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSelectOpen from "./MultiSelectOpen.test.svelte";

describe("MultiSelect open event", () => {
  it.each([false, true])(
    'dispatches open with trigger "click" (filterable: %s)',
    async (filterable) => {
      const onOpen = vi.fn();
      render(MultiSelectOpen, { props: { filterable, onOpen } });

      await user.click(screen.getByRole("combobox"));

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "click" });
    },
  );

  it.each(["{ArrowDown}", "{Enter}"])(
    'dispatches open with trigger "keydown" on %s',
    async (key) => {
      const onOpen = vi.fn();
      render(MultiSelectOpen, { props: { onOpen } });

      screen.getByRole("combobox").focus();
      await user.keyboard(key);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "keydown" });
    },
  );

  it('dispatches open with trigger "input" when typing a filter', async () => {
    const onOpen = vi.fn();
    render(MultiSelectOpen, { props: { filterable: true, onOpen } });

    screen.getByRole("combobox").focus();
    await user.keyboard("Em");

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "input" });
  });

  it('dispatches open with trigger "programmatic" when `open` is set', async () => {
    const onOpen = vi.fn();
    const { rerender } = render(MultiSelectOpen, { props: { onOpen } });

    await rerender({ open: true });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "programmatic" });
  });

  it("does not dispatch open when mounted open", () => {
    const onOpen = vi.fn();
    render(MultiSelectOpen, { props: { open: true, onOpen } });

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
