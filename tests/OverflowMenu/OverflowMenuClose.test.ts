import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import OverflowMenu from "./OverflowMenu.test.svelte";
import { closeDetails, openMenu } from "./helpers";

describe("OverflowMenu close event trigger", () => {
  it('dispatches close with trigger "escape-key" when Escape is pressed on the trigger', async () => {
    const onClose = vi.fn();
    render(OverflowMenu, { props: { onClose, open: true } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    menuButton.focus();
    expect(menuButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
    expect(closeDetails(onClose)).toEqual([{ trigger: "escape-key" }]);
  });

  it.each([false, true])(
    'closes with trigger "escape-key" when Tab leaves the menu (portalMenu=%s)',
    async (portalMenu) => {
      const onClose = vi.fn();
      render(OverflowMenu, {
        props: { onClose, portalMenu, withNextField: true },
      });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);
      await user.tab();

      expect(menuButton).toHaveAttribute("aria-expanded", "false");
      expect(closeDetails(onClose)).toEqual([{ trigger: "escape-key" }]);
      expect(screen.getByRole("textbox", { name: "Next field" })).toHaveFocus();
    },
  );

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(OverflowMenu, { props: { onClose } });

    const { menuButton } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(document.body);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(closeDetails(onClose)).toEqual([{ trigger: "outside-click" }]);
  });

  it('dispatches close with trigger "toggle" when the trigger click closes an open menu', async () => {
    const onClose = vi.fn();
    render(OverflowMenu, { props: { onClose } });

    const { menuButton } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(closeDetails(onClose)).toEqual([{ trigger: "toggle" }]);
  });

  it("preventDefault on the close event cancels the close (cancelable contract)", async () => {
    const onClose = vi.fn();
    render(OverflowMenu, { props: { onClose, cancelClose: true } });

    const { menuButton } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(closeDetails(onClose)).toEqual([{ trigger: "escape-key" }]);
    // Close was canceled: the menu stays open.
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  it.each([
    ["toggle", async (button: HTMLElement) => user.click(button)],
    ["outside-click", async () => user.click(document.body)],
    ["item-select", async () => user.click(screen.getAllByRole("menuitem")[0])],
  ] as const)(
    "keeps the menu open when the %s close is canceled",
    async (trigger, act) => {
      const onClose = vi.fn();
      render(OverflowMenu, { props: { onClose, cancelClose: true } });

      const { menuButton } = await openMenu();
      await act(menuButton);

      expect(closeDetails(onClose)).toEqual([
        expect.objectContaining({ trigger }),
      ]);
      expect(menuButton).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("menu")).toBeInTheDocument();
    },
  );

  it("leaves focus where an item click handler moved it", async () => {
    const onItemClick = vi.fn(() => elsewhere.focus());
    const { container } = render(OverflowMenu, { props: { onItemClick } });
    const menuButton = screen.getByRole("button");
    const elsewhere = container.appendChild(document.createElement("button"));

    const { items } = await openMenu(menuButton);
    await user.click(items[0]);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(elsewhere).toHaveFocus();
  });
});
