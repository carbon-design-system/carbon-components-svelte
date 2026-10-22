import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import ModalLoadingStatus from "./ModalLoadingStatus.test.svelte";

function getFooter() {
  const footer = document.querySelector(".bx--modal-footer");
  assert(footer instanceof HTMLElement);
  return footer;
}

function getPrimary() {
  const button = getFooter().querySelector(".bx--btn--primary");
  assert(button instanceof HTMLButtonElement);
  return button;
}

describe("Modal loadingStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the primary button text and no aria-busy while inactive", () => {
    render(ModalLoadingStatus);

    expect(getPrimary()).toHaveTextContent("Save");
    expect(getPrimary()).toBeEnabled();
    expect(getPrimary().querySelector(".bx--inline-loading")).toBeNull();
    expect(getFooter()).not.toHaveAttribute("aria-busy");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });

  it.each([
    ["active", ".bx--loading", "true"],
    ["finished", ".bx--inline-loading__checkmark-container", null],
    ["error", ".bx--inline-loading--error", null],
  ] as const)(
    "shows the %s status in the primary button and blocks the footer",
    async (loadingStatus, iconSelector, ariaBusy) => {
      const onsubmit = vi.fn();
      const onsecondary = vi.fn();
      render(ModalLoadingStatus, {
        props: { loadingStatus, onsubmit, onsecondary },
      });

      const primary = getPrimary();
      expect(primary.querySelector(iconSelector)).toBeInTheDocument();
      expect(primary).toHaveTextContent("Saving");
      expect(primary).toBeDisabled();
      expect(getFooter().getAttribute("aria-busy")).toBe(ariaBusy);

      const secondary = screen.getByRole("button", { name: "Cancel" });
      expect(secondary).toBeDisabled();

      await fireEvent.click(primary);
      await fireEvent.click(secondary);
      await fireEvent.keyDown(screen.getByTestId("field"), { key: "Enter" });

      expect(onsubmit).not.toHaveBeenCalled();
      expect(onsecondary).not.toHaveBeenCalled();
    },
  );

  it("disables `secondaryButtons` entries while loading", () => {
    render(ModalLoadingStatus, {
      props: {
        loadingStatus: "active",
        secondaryButtons: [{ text: "Keep editing" }, { text: "Discard" }],
      },
    });

    expect(screen.getByRole("button", { name: "Keep editing" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Discard" })).toBeDisabled();
  });

  it("dispatches `loading:success` after the success delay once finished", async () => {
    vi.useFakeTimers();
    const onloadingsuccess = vi.fn();
    const { rerender } = render(ModalLoadingStatus, {
      props: { loadingStatus: "active", onloadingsuccess },
    });

    vi.advanceTimersByTime(3000);
    expect(onloadingsuccess).not.toHaveBeenCalled();

    await rerender({ loadingStatus: "finished" });
    vi.advanceTimersByTime(1499);
    expect(onloadingsuccess).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onloadingsuccess).toHaveBeenCalledTimes(1);

    await rerender({ loadingStatus: "inactive" });
    await tick();
    expect(getPrimary()).toHaveTextContent("Save");
    expect(getPrimary()).toBeEnabled();
  });

  it.each(["error", "inactive"] as const)(
    "does not dispatch `loading:success` when finished turns %s before the delay",
    async (next) => {
      vi.useFakeTimers();
      const onloadingsuccess = vi.fn();
      const { rerender } = render(ModalLoadingStatus, {
        props: { loadingStatus: "finished", onloadingsuccess },
      });

      vi.advanceTimersByTime(1000);
      await rerender({ loadingStatus: next });
      vi.advanceTimersByTime(3000);

      expect(onloadingsuccess).not.toHaveBeenCalled();
    },
  );

  it("passes the icon description to InlineLoading", () => {
    render(ModalLoadingStatus, {
      props: {
        loadingStatus: "error",
        primaryButtonLoadingIconDescription: "Save failed",
      },
    });

    expect(getPrimary().querySelector("title")).toHaveTextContent(
      "Save failed",
    );
  });

  describe("primaryButtonLoading", () => {
    it("works as an alias for the active status", async () => {
      const onsubmit = vi.fn();
      render(ModalLoadingStatus, {
        props: { primaryButtonLoading: true, onsubmit },
      });

      const primary = getPrimary();
      expect(primary.querySelector(".bx--loading")).toBeInTheDocument();
      expect(primary).toBeDisabled();
      expect(getFooter()).toHaveAttribute("aria-busy", "true");

      await fireEvent.keyDown(screen.getByTestId("field"), { key: "Enter" });
      expect(onsubmit).not.toHaveBeenCalled();
    });

    it("keeps the secondary button enabled", () => {
      render(ModalLoadingStatus, { props: { primaryButtonLoading: true } });

      expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    });

    it("yields to a loadingStatus other than inactive", () => {
      render(ModalLoadingStatus, {
        props: { primaryButtonLoading: true, loadingStatus: "error" },
      });

      expect(
        getPrimary().querySelector(".bx--inline-loading--error"),
      ).toBeInTheDocument();
      expect(getFooter()).not.toHaveAttribute("aria-busy");
    });
  });
});
