import { fireEvent, render, screen } from "@testing-library/svelte";
import TearsheetComponent from "carbon-components-svelte/Tearsheet/Tearsheet.svelte";
import { tick } from "svelte";
import { stubViewport } from "../utils/match-media";
import { user } from "../utils/user";
import Tearsheet from "./Tearsheet.test.svelte";
import TearsheetSlots from "./TearsheetSlots.test.svelte";

const getRoot = () => {
  const root = document.querySelector<HTMLElement>(".bx--tearsheet");
  assert(root);
  return root;
};

// Svelte 5 sets `inert` as a property, which jsdom doesn't reflect.
const isInert = (element: HTMLElement) =>
  element.hasAttribute("inert") || element.inert === true;

const getDialog = () => screen.getByRole("dialog", { hidden: true });

async function clickOutside() {
  await fireEvent.mouseDown(getRoot());
  await fireEvent.mouseUp(getRoot());
}

describe("Tearsheet", () => {
  afterEach(() => {
    document.body.classList.remove("bx--body--with-modal-open");
  });

  it("is inert until opened, then a modal dialog named by its title", async () => {
    const { component } = render(Tearsheet);
    await tick();
    expect(isInert(getRoot())).toBe(true);
    expect(getRoot()).not.toHaveClass("is-visible");

    component.open = true;
    await tick();
    expect(isInert(getRoot())).toBe(false);
    expect(getRoot()).toHaveClass("is-visible", "bx--tearsheet--wide");
    const dialog = screen.getByRole("dialog", { name: "Create integration" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body).toHaveClass("bx--body--with-modal-open");
  });

  it("describes the dialog by its description and renders the label", () => {
    render(Tearsheet, {
      props: {
        open: true,
        labelText: "Step 2 of 4",
        descriptionText: "Connect a data source.",
      },
    });
    expect(getDialog()).toHaveAccessibleDescription("Connect a data source.");
    expect(screen.getByText("Step 2 of 4")).toHaveClass("bx--tearsheet__label");
  });

  it("passes a `title` attribute to the dialog, apart from `titleText`", () => {
    render(TearsheetComponent, {
      props: { open: true, titleText: "Create integration", title: "Tip" },
    });
    const dialog = screen.getByRole("dialog", { name: "Create integration" });
    expect(dialog).toHaveAttribute("title", "Tip");
  });

  it("sets the narrow class", () => {
    render(Tearsheet, { props: { open: true, size: "narrow" } });
    expect(getRoot()).toHaveClass("bx--tearsheet--narrow");
    expect(getRoot()).not.toHaveClass("bx--tearsheet--wide");
  });

  it("puts the title one level below a Section and its content one below that", () => {
    render(Tearsheet, { props: { open: true, section: true } });
    expect(
      screen.getByRole("heading", { name: "Create integration", level: 4 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mappings", level: 5 }),
    ).toBeInTheDocument();
  });

  it("puts the wide body on the page surface and the narrow body one layer up", () => {
    const { unmount } = render(Tearsheet, { props: { open: true } });
    expect(getRoot()).toHaveClass("bx--layer-one");
    expect(document.querySelector(".bx--tearsheet__main")).not.toHaveClass(
      "bx--layer-two",
    );
    expect(screen.getByTestId("nested-layer").parentElement).toHaveClass(
      "bx--layer-two",
    );
    unmount();

    render(Tearsheet, { props: { open: true, size: "narrow" } });
    expect(document.querySelector(".bx--tearsheet__main")).toHaveClass(
      "bx--layer-two",
    );
    expect(screen.getByTestId("nested-layer").parentElement).toHaveClass(
      "bx--layer-three",
    );
  });

  it("builds its body on the first open", async () => {
    const { component } = render(Tearsheet, { props: { field: true } });
    expect(screen.queryByLabelText("Region")).toBeNull();

    component.open = true;
    await tick();
    component.open = false;
    await tick();
    expect(screen.getByLabelText("Region")).toBeInTheDocument();
  });

  it("focuses the first field on open and returns focus on close", async () => {
    render(Tearsheet, { props: { field: true } });
    const launcher = screen.getByRole("button", { name: "Open tearsheet" });
    await user.click(launcher);
    await tick();
    expect(screen.getByLabelText("Region")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await tick();
    await tick();
    expect(launcher).toHaveFocus();
  });

  it("focuses the close button when there is no field", async () => {
    render(Tearsheet);
    await user.click(screen.getByRole("button", { name: "Open tearsheet" }));
    await tick();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it.each([
    ["the close button", "close-button"],
    ["Escape", "escape-key"],
    ["an outside click", "outside-click"],
  ])("closes from %s with a cancelable close event", async (_, trigger) => {
    const onClose = vi.fn();
    const { component } = render(Tearsheet, {
      props: { open: true, onClose: (value: string) => onClose(value) },
    });
    await tick();
    async function close() {
      if (trigger === "close-button") {
        await user.click(screen.getByRole("button", { name: "Close" }));
      } else if (trigger === "escape-key") {
        await fireEvent.keyDown(getDialog(), { key: "Escape" });
      } else {
        await clickOutside();
      }
    }

    component.onClose = (value: string) => {
      onClose(value);
      return false;
    };
    await close();
    expect(onClose).toHaveBeenCalledWith(trigger);
    expect(component.open).toBe(true);

    component.onClose = (value: string) => {
      onClose(value);
      return undefined;
    };
    await close();
    expect(component.open).toBe(false);
  });

  it("ignores Escape that ends an IME composition", async () => {
    const { component } = render(Tearsheet, { props: { open: true } });
    await fireEvent.keyDown(getDialog(), { key: "Escape", isComposing: true });
    expect(component.open).toBe(true);
  });

  it("does not close when a press starts inside and is released outside", async () => {
    const { component } = render(Tearsheet, { props: { open: true } });
    await fireEvent.mouseDown(getDialog());
    await fireEvent.mouseUp(getRoot());
    expect(component.open).toBe(true);
  });

  it("dispatches close once, as programmatic, when `open` is set to false", async () => {
    const onClose = vi.fn();
    const { component } = render(Tearsheet, {
      props: { open: true, onClose: (value: string) => onClose(value) },
    });
    await tick();
    component.open = false;
    await tick();
    await tick();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("programmatic");
  });

  it("wraps Tab inside the dialog", async () => {
    render(Tearsheet, { props: { open: true, field: true } });
    await tick();
    const field = screen.getByLabelText("Region");
    const close = screen.getByRole("button", { name: "Close" });
    close.focus();
    await user.tab();
    expect(getDialog()).toContainElement(document.activeElement as HTMLElement);
    expect([field, close]).toContain(document.activeElement);
  });

  it("only clicks outside close a tearsheet without actions", async () => {
    const { unmount } = render(Tearsheet, {
      props: { open: true, preventCloseOnClickOutside: true },
    });
    await clickOutside();
    expect(getRoot()).toHaveClass("is-visible");
    unmount();

    const { component } = render(TearsheetSlots, {
      props: { preventCloseOnClickOutside: undefined },
    });
    await clickOutside();
    expect(component.open).toBe(true);

    component.preventCloseOnClickOutside = false;
    await tick();
    await clickOutside();
    expect(component.open).toBe(false);
  });

  it("shows the close button only without actions, unless `hideCloseButton` is set", async () => {
    const { unmount } = render(Tearsheet, { props: { open: true } });
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    unmount();

    const { component, unmount: unmountSlots } = render(TearsheetSlots);
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    component.hideCloseButton = false;
    await tick();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    unmountSlots();

    render(Tearsheet, { props: { open: true, hideCloseButton: true } });
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("lays out `actions` in an ActionSet sized to the tearsheet", async () => {
    const { component } = render(TearsheetSlots);
    const actions = document.querySelector(".bx--tearsheet__actions");
    expect(actions).toHaveClass("bx--action-set--2xl");
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();

    component.size = "narrow";
    await tick();
    expect(document.querySelector(".bx--tearsheet__actions")).toHaveClass(
      "bx--action-set--lg",
    );
  });

  it("keeps the wide footer's size at any window width, so the server renders it", async () => {
    const viewport = stubViewport(360);
    render(TearsheetSlots);
    await tick();
    // CSS sizes the buttons below `md`; the class does not follow the window.
    expect(document.querySelector(".bx--tearsheet__actions")).toHaveClass(
      "bx--action-set--2xl",
    );
    viewport.setWidth(1280);
    await tick();
    expect(document.querySelector(".bx--tearsheet__actions")).toHaveClass(
      "bx--action-set--2xl",
    );
    vi.unstubAllGlobals();
  });

  it("renders `headerActions` on a wide tearsheet only, and warns on a narrow one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { unmount } = render(TearsheetSlots);
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(warn).not.toHaveBeenCalled();
    unmount();

    render(TearsheetSlots, { props: { size: "narrow" } });
    expect(screen.queryByRole("button", { name: "Preview" })).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("takes the AI surface from a filled decorator slot", () => {
    render(TearsheetSlots);
    expect(getRoot()).toHaveClass(
      "bx--tearsheet--decorator",
      "bx--tearsheet--ai-label",
    );
  });
});
