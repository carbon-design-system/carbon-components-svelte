import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import SidePanel from "./SidePanel.test.svelte";
import SidePanelSlots from "./SidePanelSlots.test.svelte";

const getPanel = () => {
  const panel = document.querySelector<HTMLElement>(".bx--side-panel");
  assert(panel);
  return panel;
};

const getHandle = () =>
  screen.getByRole("separator", { name: "Resize side panel" });

describe("SidePanel", () => {
  afterEach(() => {
    document.body.classList.remove("bx--body--with-modal-open");
  });

  it("renders nothing until opened", async () => {
    const { component } = render(SidePanel);
    expect(document.querySelector(".bx--side-panel")).toBeNull();

    component.open = true;
    await tick();
    const dialog = screen.getByRole("dialog", { name: "Edit deployment" });
    expect(dialog).toHaveClass("bx--side-panel", "bx--side-panel--md");
    expect(dialog).not.toHaveAttribute("aria-modal");
  });

  it("names the panel by its title and describes it by its subtitle", () => {
    render(SidePanel, {
      props: {
        open: true,
        labelText: "Production",
        subtitle: "Changes apply on the next deploy.",
      },
    });
    const dialog = screen.getByRole("dialog", { name: "Edit deployment" });
    expect(dialog).toHaveAccessibleDescription(
      "Changes apply on the next deploy.",
    );
    expect(screen.getByText("Production")).toHaveClass("bx--side-panel__label");
  });

  it("renders the title as an h2, or one level below a Section", () => {
    render(SidePanelSlots);
    expect(
      screen.getByRole("heading", { name: "Edit deployment", level: 4 }),
    ).toBeInTheDocument();

    document.body.innerHTML = "";
    render(SidePanel, { props: { open: true } });
    expect(
      screen.getByRole("heading", { name: "Edit deployment", level: 2 }),
    ).toBeInTheDocument();
  });

  it("starts a layer, and steps its body up one level", () => {
    render(SidePanel, { props: { open: true } });
    expect(getPanel()).toHaveClass("bx--layer-one");
    expect(getPanel().querySelector(".bx--side-panel__body")).toHaveClass(
      "bx--layer-two",
    );
    expect(screen.getByTestId("nested-layer").parentElement).toHaveClass(
      "bx--layer-three",
    );
  });

  it.each([
    ["end", "bx--side-panel--end"],
    ["start", "bx--side-panel--start"],
    ["right", "bx--side-panel--end"],
    ["left", "bx--side-panel--start"],
  ] as const)("docks placement %s with %s", (placement, className) => {
    render(SidePanel, { props: { open: true, placement } });
    expect(getPanel()).toHaveClass(className);
  });

  it("focuses the first field on open and returns focus on close", async () => {
    render(SidePanel, { props: { field: true } });
    const launcher = screen.getByRole("button", { name: "Open panel" });
    await user.click(launcher);
    await tick();
    expect(screen.getByLabelText("Region")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await tick();
    await tick();
    expect(launcher).toHaveFocus();
    expect(document.querySelector(".bx--side-panel")).toBeNull();
  });

  it("leaves focus alone when it mounts open, unless it's modal", async () => {
    render(SidePanel, { props: { open: true, field: true } });
    await tick();
    await tick();
    expect(document.body).toHaveFocus();

    document.body.innerHTML = "";
    const focus = vi.spyOn(HTMLElement.prototype, "focus");
    render(SidePanel, {
      props: { open: true, includeOverlay: true, field: true },
    });
    await tick();
    await tick();
    expect(screen.getByLabelText("Region")).toHaveFocus();
    // A panel shown on load doesn't scroll the page, or a page framing it.
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
    focus.mockRestore();
  });

  it.each([
    ["close button", "close-button"],
    ["Escape", "escape-key"],
  ])("closes from the %s", async (_, trigger) => {
    const onClose = vi.fn();
    const { component } = render(SidePanel, {
      props: { open: true, onClose },
    });
    await tick();
    if (trigger === "close-button") {
      await user.click(screen.getByRole("button", { name: "Close" }));
    } else {
      await fireEvent.keyDown(getPanel(), { key: "Escape" });
    }
    expect(onClose).toHaveBeenCalledWith(trigger);
    expect(component.open).toBe(false);
  });

  it("stays open when the close event is canceled or Escape ends a composition", async () => {
    const { component } = render(SidePanel, {
      props: { open: true, onClose: () => false },
    });
    await fireEvent.keyDown(getPanel(), { key: "Escape" });
    expect(component.open).toBe(true);

    component.onClose = undefined;
    await fireEvent.keyDown(getPanel(), { key: "Escape", isComposing: true });
    expect(component.open).toBe(true);
  });

  it("is modal over an overlay: traps Tab and locks page scroll", async () => {
    const { component } = render(SidePanel, {
      props: { open: true, includeOverlay: true, field: true },
    });
    await tick();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body).toHaveClass("bx--body--with-modal-open");

    const close = screen.getByRole("button", { name: "Close" });
    close.focus();
    await user.tab();
    expect(screen.getByLabelText("Region")).toHaveFocus();

    component.open = false;
    await tick();
    expect(document.body).not.toHaveClass("bx--body--with-modal-open");
  });

  it("leaves Tab alone without an overlay", () => {
    render(SidePanel, { props: { open: true } });
    const event = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    getPanel().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it.each([
    [undefined, false, true],
    [undefined, true, false],
    [false, true, true],
    [true, false, false],
  ])(
    "with preventCloseOnClickOutside %s and actions %s, an overlay click closes: %s",
    async (preventCloseOnClickOutside, actions, closes) => {
      const fixture = actions ? SidePanelSlots : SidePanel;
      render(fixture, {
        props: { open: true, includeOverlay: true, preventCloseOnClickOutside },
      });
      const overlay = document.querySelector(".bx--side-panel__overlay");
      assert(overlay);
      await fireEvent.mouseDown(overlay);
      await fireEvent.mouseUp(overlay);
      await tick();
      await tick();
      expect(document.querySelector(".bx--side-panel") === null).toBe(closes);
    },
  );

  it("pushes the page content aside when sliding in, without taking focus", async () => {
    const { component } = render(SidePanel, {
      props: { slideIn: true, field: true },
    });
    const content = screen.getByTestId("page");
    content.style.marginInlineEnd = "8px";
    const launcher = screen.getByRole("button", { name: "Open panel" });
    await user.click(launcher);
    await tick();

    expect(screen.getByRole("complementary")).toHaveClass(
      "bx--side-panel--slide-in",
    );
    expect(launcher).toHaveFocus();
    expect(content.style.marginInlineEnd).toBe("30rem");
    expect(content).toHaveClass("bx--side-panel-page");

    // A slide-in panel sits beside the page; Escape is the page's.
    await fireEvent.keyDown(getPanel(), { key: "Escape" });
    expect(component.open).toBe(true);

    component.open = false;
    await tick();
    expect(content.style.marginInlineEnd).toBe("8px");
  });

  it("shows a back button from the second step", async () => {
    const onBack = vi.fn();
    const { component } = render(SidePanel, { props: { open: true, onBack } });
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();

    component.currentStep = 1;
    await tick();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("docks under a UI Shell Header, and spans the full height without one", async () => {
    const { component } = render(SidePanel, { props: { open: true } });
    expect(getPanel()).toHaveClass("bx--side-panel--no-header");

    component.header = true;
    await tick();
    expect(getPanel()).not.toHaveClass("bx--side-panel--no-header");

    component.header = false;
    await tick();
    expect(getPanel()).toHaveClass("bx--side-panel--no-header");
  });

  it("lays out actions in an ActionSet sized to the panel, and keeps the AI surface", () => {
    render(SidePanelSlots, { props: { size: "xs" } });
    const actions = document.querySelector(".bx--side-panel__actions");
    expect(actions).toHaveClass("bx--action-set--sm");
    expect(getPanel()).toHaveClass(
      "bx--side-panel--decorator",
      "bx--side-panel--ai-label",
    );
    expect(
      document.querySelector(".bx--side-panel__header--toolbar"),
    ).not.toBeNull();
  });
});

describe("SidePanel resize", () => {
  afterEach(() => {
    document.body.classList.remove("bx--side-panel-resizing");
  });

  function stubWidth(panel: HTMLElement, width: number) {
    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({
      width,
    } as DOMRect);
  }

  it.each([
    ["ltr", "end", -100, 580],
    ["ltr", "start", 100, 580],
    ["rtl", "end", 100, 580],
    ["rtl", "start", -100, 580],
    ["rtl", "end", -100, 380],
  ] as const)(
    "in %s, a %s panel's edge dragged %ipx makes it %ipx wide",
    async (dir, placement, delta, expected) => {
      const onResize = vi.fn();
      render(SidePanel, {
        props: { open: true, resizable: true, dir, placement, onResize },
      });
      stubWidth(getPanel(), 480);
      const handle = getHandle();
      await fireEvent.pointerDown(handle, { clientX: 500, pointerId: 1 });
      expect(document.body).toHaveClass("bx--side-panel-resizing");
      await fireEvent.pointerMove(handle, {
        clientX: 500 + delta / 2,
        pointerId: 1,
      });
      await fireEvent.pointerMove(handle, {
        clientX: 500 + delta,
        pointerId: 1,
      });
      await fireEvent.pointerUp(handle, { pointerId: 1 });

      expect(screen.getByTestId("width")).toHaveTextContent(String(expected));
      expect(getPanel().style.width).toBe(`${expected}px`);
      expect(handle).toHaveAttribute("aria-valuenow", String(expected));
      expect(onResize).toHaveBeenCalledTimes(1);
      expect(onResize).toHaveBeenCalledWith(expected);
      expect(document.body).not.toHaveClass("bx--side-panel-resizing");
    },
  );

  it.each([
    ["ltr", "ArrowLeft", 496],
    ["ltr", "ArrowRight", 464],
    ["rtl", "ArrowRight", 496],
    ["rtl", "ArrowLeft", 464],
  ] as const)(
    "in %s, %s on an end panel's edge sets it to %ipx",
    async (dir, key, expected) => {
      render(SidePanel, { props: { open: true, resizable: true, dir } });
      stubWidth(getPanel(), 480);
      await fireEvent.keyDown(getHandle(), { key });
      expect(screen.getByTestId("width")).toHaveTextContent(String(expected));
    },
  );

  it("clamps between the xs width and 75% of the window, and a double click restores the size", async () => {
    const onResize = vi.fn();
    render(SidePanel, {
      props: { open: true, resizable: true, width: 400, onResize },
    });
    const handle = getHandle();
    await fireEvent.keyDown(handle, { key: "Home" });
    expect(screen.getByTestId("width")).toHaveTextContent("256");

    await fireEvent.keyDown(handle, { key: "End" });
    expect(screen.getByTestId("width")).toHaveTextContent(
      String(Math.round(window.innerWidth * 0.75)),
    );

    await fireEvent.dblClick(handle);
    expect(screen.getByTestId("width").textContent).toBe("");
    expect(getPanel().style.width).toBe("");
    expect(handle).toHaveAttribute("aria-valuenow", "480");
    expect(onResize).toHaveBeenLastCalledWith(undefined);
  });

  it("renders no handle unless resizable", () => {
    render(SidePanel, { props: { open: true } });
    expect(screen.queryByRole("separator")).toBeNull();
  });
});
