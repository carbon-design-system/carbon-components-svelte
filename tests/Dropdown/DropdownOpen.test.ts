import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DropdownOpen from "./DropdownOpen.test.svelte";

describe("Dropdown open event", () => {
  it('dispatches open with trigger "click" when the field is clicked', async () => {
    const onOpen = vi.fn();
    render(DropdownOpen, { props: { onOpen } });

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "click" });
  });

  it.each(["{ArrowDown}", "{Enter}"])(
    'dispatches open with trigger "keydown" on %s',
    async (key) => {
      const onOpen = vi.fn();
      render(DropdownOpen, { props: { onOpen } });

      screen.getByRole("combobox").focus();
      await user.keyboard(key);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "keydown" });
    },
  );

  it('dispatches open with trigger "programmatic" when `open` is set', async () => {
    const onOpen = vi.fn();
    const { rerender } = render(DropdownOpen, { props: { onOpen } });

    await rerender({ open: true });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "programmatic" });
  });

  it("does not dispatch open when mounted open", () => {
    const onOpen = vi.fn();
    render(DropdownOpen, { props: { open: true, onOpen } });

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("dispatches open once per open transition", async () => {
    const onOpen = vi.fn();
    render(DropdownOpen, { props: { onOpen } });

    const field = screen.getByRole("combobox");
    await user.click(field);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.click(field);
    await user.click(field);

    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});
