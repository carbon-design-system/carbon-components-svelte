import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import SidePanelActions from "./SidePanel.actions.test.svelte";
import SidePanel from "./SidePanel.test.svelte";

describe("SidePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    render(SidePanel, { open: false });
    expect(screen.queryByTestId("side-panel")).not.toBeInTheDocument();
  });

  it("renders title, subtitle, and labelText when open", () => {
    render(SidePanel, {
      open: true,
      title: "Settings",
      subtitle: "Manage your preferences",
      labelText: "Configuration",
    });

    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Manage your preferences")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("renders the decorator slot", () => {
    render(SidePanel, { open: true });
    expect(screen.getByTestId("decorator")).toBeInTheDocument();
  });

  it("closes and dispatches close with trigger on close button click", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { component } = render(SidePanel, { open: true });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(consoleLog).toHaveBeenCalledWith("close", "close-button");
    expect(component.open).toBe(false);
  });

  it("closes and dispatches close with trigger on Escape", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { component } = render(SidePanel, { open: true });

    await user.keyboard("{Escape}");

    expect(consoleLog).toHaveBeenCalledWith("close", "escape-key");
    expect(component.open).toBe(false);
  });

  it("does not close on Escape when slideIn is true", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { component } = render(SidePanel, { open: true, slideIn: true });

    await user.keyboard("{Escape}");

    expect(consoleLog).not.toHaveBeenCalledWith("close", expect.anything());
    expect(component.open).toBe(true);
  });

  it("closes on overlay click when includeOverlay is set", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { container } = render(SidePanel, {
      open: true,
      includeOverlay: true,
    });

    const overlay = container.querySelector(".bx--side-panel__overlay");
    expect(overlay).toBeInTheDocument();
    await fireEvent.click(overlay as Element);

    expect(consoleLog).toHaveBeenCalledWith("close", "overlay-click");
  });

  it("does not close on overlay click when preventCloseOnClickOutside is set", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { container } = render(SidePanel, {
      open: true,
      includeOverlay: true,
      preventCloseOnClickOutside: true,
    });

    const overlay = container.querySelector(".bx--side-panel__overlay");
    await fireEvent.click(overlay as Element);

    expect(consoleLog).not.toHaveBeenCalledWith("close", expect.anything());
  });

  it("shows a back button and dispatches back when currentStep is greater than 0", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    render(SidePanel, { open: true, currentStep: 1 });

    const backButton = screen.getByRole("button", { name: "Back" });
    await user.click(backButton);

    expect(consoleLog).toHaveBeenCalledWith("back");
  });

  it("hides the back button when currentStep is 0", () => {
    render(SidePanel, { open: true, currentStep: 0 });
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
  });

  it("renders slotted actions in the footer", () => {
    render(SidePanelActions);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("returns focus to the launcher when closed", async () => {
    const { component } = render(SidePanel, { open: false });
    const launcher = screen.getByRole("button", { name: "Launcher" });
    launcher.focus();
    expect(launcher).toHaveFocus();

    component.open = true;
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(launcher).toHaveFocus());
  });

  it("shrinks the page content element in slideIn mode and resets it on close", async () => {
    document.body.innerHTML = '<main id="page-content"></main>';
    const pageContent = document.querySelector("#page-content") as HTMLElement;

    const { component } = render(SidePanel, {
      open: true,
      slideIn: true,
      selectorPageContent: "#page-content",
      size: "md",
    });

    await waitFor(() => expect(pageContent.style.marginInlineEnd).not.toBe(""));
    expect(pageContent.style.marginInlineEnd).not.toBe("0px");

    component.open = false;
    await waitFor(() => expect(pageContent.style.marginInlineEnd).toBe("0px"));
  });

  it("applies size and placement classes", () => {
    const { container } = render(SidePanel, {
      open: true,
      size: "lg",
      placement: "left",
    });

    const panel = container.querySelector(".bx--side-panel");
    expect(panel).toHaveClass("bx--side-panel--lg");
    expect(panel).toHaveClass("bx--side-panel--left-placement");
  });

  it("does not animate by default", async () => {
    const animateSpy = vi.spyOn(Element.prototype, "animate");
    const { component } = render(SidePanel, { open: false });

    component.open = true;
    await waitFor(() =>
      expect(screen.getByTestId("side-panel")).toBeInTheDocument(),
    );

    expect(animateSpy).not.toHaveBeenCalled();
  });

  it("animates when transition params are provided", async () => {
    const animateSpy = vi.spyOn(Element.prototype, "animate");
    const { component } = render(SidePanel, {
      open: false,
      transition: { duration: 240 },
    });

    component.open = true;
    await waitFor(() =>
      expect(screen.getByTestId("side-panel")).toBeInTheDocument(),
    );
    // Svelte schedules the WAAPI `animate()` call via a later animation
    // frame, not synchronously with the DOM update above; under a heavily
    // parallel full-suite run that can take longer than the default
    // `waitFor` timeout, so it's raised here.
    await waitFor(
      () =>
        expect(
          animateSpy.mock.calls.some(
            ([, options]) =>
              typeof options === "object" && options?.duration === 240,
          ),
        ).toBe(true),
      { timeout: 3000 },
    );
  });
});
