import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderNavContent from "./HeaderNavContent.test.svelte";
import HeaderNavMenuInsert from "./HeaderNavMenuInsert.test.svelte";
import HeaderNavMenuTextSlot from "./HeaderNavMenuTextSlot.test.svelte";
import Menubar from "./HeaderNavMenubar.test.svelte";

const item = (name: string) => screen.getByRole("menuitem", { name });

describe("HeaderNavMenu close event", () => {
  const items = [
    { text: "Outside Link" },
    {
      text: "Menu",
      items: [{ text: "Menu Item 1" }, { text: "Menu Item 2" }],
    },
  ];
  const defaults = { items, after: "button" } as const;

  it('dispatches close with trigger "escape-key" from the trigger', async () => {
    const onClose = vi.fn();
    render(Menubar, { props: { ...defaults, onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    await user.click(menuTrigger);
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
    expect(menuTrigger).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("Menu", "escape-key");
  });

  it('dispatches close with trigger "escape-key" from a menu item', async () => {
    const onClose = vi.fn();
    render(Menubar, { props: { ...defaults, onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Menu Item 1" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("Menu", "escape-key");
  });

  it("lets Tab move focus past the menu when leaving the last item", async () => {
    const onClose = vi.fn();
    render(Menubar, { props: { ...defaults, onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Menu Item 2" })).toHaveFocus();

    await user.tab();

    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledWith("Menu", "blur");
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(Menubar, { props: { ...defaults, onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard(" ");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("menuitem", { name: "Outside Link" }));
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("Menu", "outside-click");
  });

  it("closes and returns focus to the trigger after Enter on a menu item", async () => {
    render(Menubar, { props: defaults });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Menu Item 1" })).toHaveFocus();

    await user.keyboard("{Enter}");
    await tick();

    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(menuTrigger).toHaveFocus();
  });

  it("returns focus to the trigger after clicking a menu item", async () => {
    render(Menubar, { props: defaults });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard(" ");
    await user.click(screen.getByRole("menuitem", { name: "Menu Item 1" }));
    await tick();

    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(menuTrigger).toHaveFocus();
  });

  it("does not dispatch close on outside clicks while collapsed", async () => {
    const onClose = vi.fn();
    render(Menubar, { props: { ...defaults, onClose } });

    await user.click(screen.getByRole("menuitem", { name: "Outside Link" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("HeaderNavMenu focus on close", () => {
  const props = {
    items: [
      {
        text: "Products",
        items: [{ text: "Compute" }, { text: "Storage" }],
      },
      { text: "Pricing" },
    ],
    after: "input",
  } as const;

  const trigger = () => screen.getByRole("menuitem", { name: "Products" });

  it("lets Tab move past the last item instead of pulling focus back", async () => {
    render(Menubar, { props });

    trigger().focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{End}");
    expect(item("Storage")).toHaveFocus();

    // The menubar is one Tab stop, so Tab leaves it rather than landing on
    // the next top-level item.
    await user.tab();
    expect(screen.getByRole("textbox", { name: "Search docs" })).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps focus on a field clicked while the last item is focused", async () => {
    render(Menubar, { props });

    trigger().focus();
    await user.keyboard("{ArrowUp}");
    expect(item("Storage")).toHaveFocus();

    const field = screen.getByRole("textbox", { name: "Search docs" });
    await user.click(field);
    expect(field).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });
});

describe("HeaderNavMenu items inserted after mount", () => {
  const trigger = () => item("Products");

  it("navigates and closes in DOM order", async () => {
    const { component } = render(HeaderNavMenuInsert);
    component.showFirst = true;
    await tick();

    item("Compute").focus();
    await user.keyboard("{ArrowUp}");
    expect(item("First")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("Storage")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(item("First")).toHaveFocus();

    // "First" registered last but is not the last item on screen, so leaving
    // it must not close the menu.
    const field = screen.getByRole("textbox", { name: "Search docs" });
    field.focus();
    await tick();
    expect(field).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    // The last item on screen does close it.
    item("Storage").focus();
    field.focus();
    await tick();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });
});

describe("HeaderNavMenu current marker", () => {
  const compute = { text: "Compute" };
  const quantum = { text: "Quantum (beta)" };
  const entry = (...items: { text: string }[]) => [{ text: "Products", items }];

  const submenu = () =>
    screen.getByRole("menuitem", { name: "Products" }).closest("li");

  it("adds the current marker when an item becomes selected after mount", async () => {
    const { rerender } = render(Menubar, {
      props: { items: entry(compute, quantum) },
    });
    expect(submenu()).not.toHaveClass("bx--header__submenu--current");

    await rerender({ current: quantum.text });
    expect(submenu()).toHaveClass("bx--header__submenu--current");
  });

  it("drops the current marker when the selected item unmounts", async () => {
    const { rerender } = render(Menubar, {
      props: { items: entry(compute, quantum), current: quantum.text },
    });
    expect(submenu()).toHaveClass("bx--header__submenu--current");

    await rerender({ items: entry(compute) });
    expect(submenu()).not.toHaveClass("bx--header__submenu--current");
  });
});

describe("HeaderNavMenu trigger content", () => {
  it("renders only the text and chevron by default", () => {
    render(HeaderNavContent);

    const trigger = screen.getByRole("menuitem", { name: "Plain" });
    const svgs = trigger.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toHaveClass("bx--header__menu-arrow");
  });

  it("renders the icon prop between the text and the chevron", () => {
    render(HeaderNavContent);

    const trigger = screen.getByRole("menuitem", { name: "With icon" });
    const [icon, chevron] = Array.from(trigger.querySelectorAll("svg"));
    expect(icon).not.toHaveClass("bx--header__menu-arrow");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(chevron).toHaveClass("bx--header__menu-arrow");
    expect(trigger.lastElementChild).toBe(chevron);
    expect(chevron.previousElementSibling).toBe(icon);
  });

  it("supports custom text and icon slots", () => {
    render(HeaderNavContent);

    const text = screen.getByTestId("custom-text");
    const icon = screen.getByTestId("menu-slot-icon");
    const trigger = text.closest("a");
    expect(trigger).toHaveTextContent("Custom label");
    expect(trigger).not.toHaveTextContent("Ignored");
    expect(icon.parentElement).toBe(trigger);
    expect(icon.nextElementSibling).toHaveClass("bx--header__menu-arrow");
  });

  it.each([
    ["textChildren", "New label"],
    ["text", "Old label"],
  ] as const)("renders the %s slot as the trigger content", (slots, text) => {
    render(HeaderNavMenuTextSlot, { props: { slots } });

    const trigger = screen.getByRole("menuitem", { name: text });
    expect(trigger).not.toHaveTextContent("Ignored");
  });

  it("prefers the textChildren slot over the text slot", () => {
    render(HeaderNavMenuTextSlot, { props: { slots: "both" } });

    const trigger = screen.getByRole("menuitem", { name: "New label" });
    expect(trigger).not.toHaveTextContent("Old label");
  });
});

describe("HeaderNavMenu accessible names", () => {
  it("names the menu with the trigger", () => {
    render(HeaderNavContent);

    const trigger = screen.getByRole("menuitem", { name: "Plain" });
    const menu = screen.getByRole("menu", { name: "Plain", hidden: true });
    expect(trigger.id).not.toBe("");
    expect(menu).toHaveAttribute("aria-labelledby", trigger.id);
    expect(menu).not.toHaveAttribute("aria-label");
  });

  it("keeps the menu named by the trigger when the consumer sets an id", () => {
    render(Menubar, {
      props: {
        items: [{ text: "Products", id: "products", items: [{ text: "A" }] }],
      },
    });

    expect(
      screen.getByRole("menu", { name: "Products", hidden: true }),
    ).toBeInTheDocument();
  });

  it("follows slotted trigger content", () => {
    render(HeaderNavContent);

    expect(
      screen.getByRole("menuitem", { name: "Custom label" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menu", { name: "Custom label", hidden: true }),
    ).toBeInTheDocument();
  });
});

describe("HeaderNavMenu viewport edge", () => {
  const VIEWPORT_WIDTH = 1000;
  const props = {
    items: [{ text: "More", items: [{ text: "Access (IAM)" }] }],
  };

  /** Places the left-aligned menu so its right edge lands at `right`. */
  function mockMenuRight(right: number) {
    const original = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains("bx--header__menu")) {
          return DOMRect.fromRect({
            x: right - 200,
            y: 48,
            width: 200,
            height: 96,
          });
        }
        return original.call(this);
      },
    );
  }

  const menu = () =>
    screen.getByRole("menu", { hidden: true }) as HTMLUListElement;

  beforeEach(() => {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      VIEWPORT_WIDTH,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aligns the menu to the trigger's right edge when it would overflow", async () => {
    mockMenuRight(VIEWPORT_WIDTH + 30);
    render(Menubar, { props });

    await user.click(screen.getByRole("menuitem", { name: "More" }));

    expect(menu()).toHaveClass("bx--header__menu--align-end");
  });

  it("keeps the default alignment when the menu fits", async () => {
    mockMenuRight(VIEWPORT_WIDTH - 30);
    render(Menubar, { props });

    await user.click(screen.getByRole("menuitem", { name: "More" }));

    expect(menu()).not.toHaveClass("bx--header__menu--align-end");
  });

  it.each([
    ["past the left edge", -30, true],
    ["inside the viewport", 30, false],
  ])(
    "aligns the menu to the trigger's inline end in RTL when it runs %s",
    async (_, left, alignEnd) => {
      document.documentElement.style.direction = "rtl";
      mockMenuRight(left + 200);
      render(Menubar, { props });

      try {
        await user.click(screen.getByRole("menuitem", { name: "More" }));
        expect(menu().classList.contains("bx--header__menu--align-end")).toBe(
          alignEnd,
        );
      } finally {
        document.documentElement.style.removeProperty("direction");
      }
    },
  );

  it("measures again from the default alignment on the next open", async () => {
    mockMenuRight(VIEWPORT_WIDTH - 30);
    render(Menubar, { props });
    const trigger = screen.getByRole("menuitem", { name: "More" });

    await user.click(trigger);
    expect(menu()).not.toHaveClass("bx--header__menu--align-end");
    await user.click(trigger);

    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockRestore();
    mockMenuRight(VIEWPORT_WIDTH + 30);
    await user.click(trigger);
    expect(menu()).toHaveClass("bx--header__menu--align-end");

    await user.click(trigger);
    expect(menu()).not.toHaveClass("bx--header__menu--align-end");
  });
});
