import { fireEvent, render, screen } from "@testing-library/svelte";
import ModalFooterLoadingStatus from "./ModalFooterLoadingStatus.test.svelte";

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

describe("ModalFooter loadingStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["inactive", null, null],
    ["active", ".bx--loading", "true"],
    ["finished", ".bx--inline-loading__checkmark-container", null],
    ["error", ".bx--inline-loading--error", null],
  ] as const)(
    "renders the %s status",
    async (loadingStatus, iconSelector, ariaBusy) => {
      const onsubmit = vi.fn();
      const onsecondary = vi.fn();
      render(ModalFooterLoadingStatus, {
        props: { loadingStatus, onsubmit, onsecondary },
      });

      const primary = getPrimary();
      const secondary = screen.getByRole("button", { name: "Cancel" });
      expect(getFooter().getAttribute("aria-busy")).toBe(ariaBusy);

      if (iconSelector === null) {
        expect(primary).toHaveTextContent("Save");
        expect(primary).toBeEnabled();
        expect(secondary).toBeEnabled();
        return;
      }

      expect(primary.querySelector(iconSelector)).toBeInTheDocument();
      expect(primary).toHaveTextContent("Saving");
      expect(primary).toBeDisabled();
      expect(secondary).toBeDisabled();

      await fireEvent.click(primary);
      await fireEvent.click(secondary);
      expect(onsubmit).not.toHaveBeenCalled();
      expect(onsecondary).not.toHaveBeenCalled();
    },
  );

  it("dispatches `loading:success` after the success delay once finished", async () => {
    vi.useFakeTimers();
    const onloadingsuccess = vi.fn();
    const { rerender } = render(ModalFooterLoadingStatus, {
      props: { loadingStatus: "active", onloadingsuccess },
    });

    await rerender({ loadingStatus: "finished" });
    vi.advanceTimersByTime(1499);
    expect(onloadingsuccess).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onloadingsuccess).toHaveBeenCalledTimes(1);
  });

  it("treats `primaryButtonLoading` as the active status on the primary button", () => {
    render(ModalFooterLoadingStatus, { props: { primaryButtonLoading: true } });

    expect(getPrimary().querySelector(".bx--loading")).toBeInTheDocument();
    expect(getPrimary()).toBeDisabled();
    expect(getFooter()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });
});
