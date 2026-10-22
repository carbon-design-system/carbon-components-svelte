import { fireEvent, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import { caseRows, field, renderCase } from "./cases";

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
    description: "Shift+Tab",
    act: () => user.keyboard("{Shift>}{Tab}{/Shift}"),
    trigger: "escape-key",
  },
  {
    description: "an outside click",
    act: () => user.click(document.body),
    trigger: "outside-click",
  },
];

describe.each(caseRows)("%s close event", (_, c) => {
  const setup = () => {
    const onClose = vi.fn();
    renderCase(c, {}, { onClose });
    return onClose;
  };

  it.each(triggers)(
    'dispatches close with trigger "$trigger" on $description',
    async ({ act, trigger }) => {
      const onClose = setup();

      await user.click(field());
      expect(field()).toHaveAttribute("aria-expanded", "true");

      await act();
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose.mock.calls[0][0].detail).toEqual({ trigger });
    },
  );

  it.each(triggers)(
    "does not dispatch close on $description while collapsed",
    async ({ act }) => {
      const onClose = setup();

      field().focus();
      await act();

      expect(onClose).not.toHaveBeenCalled();
    },
  );

  // Only a text input composes; button fields never see IME keys.
  it.runIf(c.opensOnInput).each(
    ["Escape", "Enter", "ArrowDown"].flatMap((key) => [
      { key, isComposing: true },
      { key, keyCode: 229 },
    ]),
  )(
    "keeps the menu, text and highlight on an IME composition key (%o)",
    async (init) => {
      const onClose = setup();

      await user.type(field(), "a");
      expect(field()).toHaveAttribute("aria-expanded", "true");
      const highlight = field().getAttribute("aria-activedescendant");

      await fireEvent.keyDown(field(), init);
      expect(field()).toHaveAttribute("aria-expanded", "true");
      expect(field()).toHaveValue("a");
      expect(field().getAttribute("aria-activedescendant")).toBe(highlight);
      expect(onClose).not.toHaveBeenCalled();
    },
  );

  it.runIf(c.selectCloses)(
    'dispatches close with trigger "select" when an option is clicked',
    async () => {
      const onClose = setup();

      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Email" }));

      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
    },
  );

  it.skipIf(c.selectCloses)(
    "stays open without dispatching close when an option is clicked",
    async () => {
      const onClose = setup();

      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Email" }));

      expect(field()).toHaveAttribute("aria-expanded", "true");
      expect(onClose).not.toHaveBeenCalled();
    },
  );
});
