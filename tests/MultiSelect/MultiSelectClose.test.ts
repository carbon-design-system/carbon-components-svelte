import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSelectClose from "./MultiSelectClose.test.svelte";

describe("MultiSelect close event", () => {
  const triggers = [
    {
      description: "Escape",
      act: () => user.keyboard("{Escape}"),
      trigger: "escape-key",
    },
    {
      description: "Alt+ArrowUp",
      act: () => user.keyboard("{Alt>}{ArrowUp}{/Alt}"),
      trigger: "escape-key",
    },
    {
      description: "Tab",
      act: () => user.keyboard("{Tab}"),
      trigger: "escape-key",
    },
    {
      description: "an outside click",
      act: () => user.click(screen.getByRole("button", { name: "Outside" })),
      trigger: "outside-click",
    },
  ];

  it.each(triggers)(
    'dispatches close with trigger "$trigger" on $description',
    async ({ act, trigger }) => {
      const onClose = vi.fn();
      render(MultiSelectClose, { props: { onClose } });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      expect(combobox).toHaveAttribute("aria-expanded", "true");

      await act();
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose.mock.calls[0][0].detail).toEqual({ trigger });
    },
  );

  it('filterable: dispatches close with trigger "escape-key" on Tab', async () => {
    const onClose = vi.fn();
    render(MultiSelectClose, { props: { onClose, filterable: true } });

    const input = screen.getByPlaceholderText("Filter contacts");
    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Tab}");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it("does not dispatch close on Tab while collapsed", async () => {
    const onClose = vi.fn();
    render(MultiSelectClose, { props: { onClose } });

    const combobox = screen.getByRole("combobox");
    combobox.focus();
    await user.keyboard("{Tab}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not dispatch close when selecting an item (menu stays open)", async () => {
    const onClose = vi.fn();
    render(MultiSelectClose, { props: { onClose } });

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    expect(combobox).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("option", { name: "Email" }));
    expect(combobox).toHaveAttribute("aria-expanded", "true");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not dispatch close on outside clicks while collapsed", async () => {
    const onClose = vi.fn();
    render(MultiSelectClose, { props: { onClose } });

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
