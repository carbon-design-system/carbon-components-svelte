import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import BottomSheet from "./BottomSheet.test.svelte";
import BottomSheetActions from "./BottomSheetActions.test.svelte";

// jsdom's window is 768px tall: half is 384px, full is 720px.
const sheet = () => {
  const el = document.querySelector<HTMLElement>(".bx--bottom-sheet");
  assert(el);
  return el;
};
const offset = () =>
  sheet().style.getPropertyValue("--ccs-bottom-sheet-offset");
const slider = () => screen.getByRole("slider", { name: "Resize sheet" });

describe("BottomSheet", () => {
  afterEach(() => {
    document.body.classList.remove("bx--body--with-modal-open");
    vi.unstubAllGlobals();
  });

  it("renders nothing until opened, then a named modal dialog", async () => {
    const { rerender } = render(BottomSheet, { props: { open: false } });
    expect(document.querySelector(".bx--bottom-sheet")).toBeNull();

    await rerender({ open: true });
    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.querySelector(".bx--bottom-sheet__scrim")).not.toBeNull();
    expect(document.body).toHaveClass("bx--body--with-modal-open");
  });

  it("opens at the shortest snap point, and the grabber slides between them", async () => {
    const onSnap = vi.fn();
    render(BottomSheet, {
      props: { log: (name, detail) => name === "snap" && onSnap(detail) },
    });
    await tick();
    // Full is 720, half is 384: the sheet sits 336px down.
    expect(offset()).toBe("336px");
    expect(slider()).toHaveAttribute("aria-valuetext", "Half height");
    expect(slider()).toHaveAttribute("aria-valuemax", "1");

    slider().focus();
    await user.keyboard("{ArrowUp}");
    expect(slider()).toHaveAttribute("aria-valuetext", "Full height");
    expect(offset()).toBe("0px");
    expect(onSnap).toHaveBeenLastCalledWith({
      snapPoint: "full",
      index: 1,
      trigger: "keyboard",
    });
    // The end of the range is the end.
    await user.keyboard("{ArrowUp}");
    expect(onSnap).toHaveBeenCalledTimes(1);

    await user.keyboard("{Home}");
    expect(slider()).toHaveAttribute("aria-valuenow", "0");
    await user.keyboard("{End}");
    expect(slider()).toHaveAttribute("aria-valuenow", "1");
  });

  it("follows snapPoint, and reports where the user moved it", async () => {
    const { rerender } = render(BottomSheet, {
      props: { snapPoints: ["peek", "half", "full"], snapPoint: "half" },
    });
    await tick();
    expect(slider()).toHaveAttribute("aria-valuetext", "Half height");

    await rerender({ snapPoint: "peek" });
    expect(slider()).toHaveAttribute("aria-valuetext", "Peek");

    slider().focus();
    await user.keyboard("{PageUp}{PageUp}");
    expect(slider()).toHaveAttribute("aria-valuetext", "Full height");
  });

  it("translates the grabber's value text", async () => {
    render(BottomSheet, {
      props: {
        resizeLabel: "Hoja",
        resizeValueText: ({ index }: { index: number }) => `Paso ${index}`,
      },
    });
    await tick();
    expect(screen.getByRole("slider", { name: "Hoja" })).toHaveAttribute(
      "aria-valuetext",
      "Paso 0",
    );
  });

  it("closes on Escape, the close button and a scrim click, with the trigger", async () => {
    const onClose = vi.fn();
    const { rerender } = render(BottomSheet, {
      props: {
        log: (name, detail) =>
          name === "close" && onClose((detail as { trigger: string }).trigger),
      },
    });
    await tick();

    sheet().focus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenLastCalledWith("escape-key");

    await rerender({ open: true });
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenLastCalledWith("close-button");

    await rerender({ open: true });
    await user.click(
      document.querySelector<HTMLElement>(".bx--bottom-sheet__scrim")!,
    );
    expect(onClose).toHaveBeenLastCalledWith("outside-click");
  });

  it("a sheet with actions keeps open on a scrim click", async () => {
    render(BottomSheetActions);
    await tick();
    await user.click(
      document.querySelector<HTMLElement>(".bx--bottom-sheet__scrim")!,
    );
    expect(sheet()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  it("dismissible={false} hides the close button and ignores Escape", async () => {
    render(BottomSheet, { props: { dismissible: false } });
    await tick();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    sheet().focus();
    await user.keyboard("{Escape}");
    expect(sheet()).toBeInTheDocument();
  });

  it("returns focus to the opener on close", async () => {
    render(BottomSheet, { props: { open: false } });
    const opener = screen.getByTestId("opener");
    await user.click(opener);
    await tick();
    expect(screen.getByLabelText("Name")).toHaveFocus();
    await user.keyboard("{Escape}");
    await tick();
    await tick();
    expect(opener).toHaveFocus();
  });

  it("a non-modal sheet is a complementary landmark with no scrim, lock or trap", async () => {
    render(BottomSheet, { props: { modal: false, dismissible: false } });
    await tick();
    expect(
      screen.getByRole("complementary", { name: "Filters" }),
    ).toBeInTheDocument();
    expect(sheet()).not.toHaveAttribute("aria-modal");
    expect(document.querySelector(".bx--bottom-sheet__scrim")).toBeNull();
    expect(document.body).not.toHaveClass("bx--body--with-modal-open");
    // Mounted open, it leaves focus where it is.
    expect(document.body).toHaveFocus();
  });

  it("a single snap point has no slider, and one that can close keeps a decorative grabber", async () => {
    render(BottomSheet, { props: { snapPoints: ["content"] } });
    await tick();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(
      document.querySelector(".bx--bottom-sheet__grabber"),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("stops being a sheet at and above the breakpoint", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(min-width: 500px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { rerender } = render(BottomSheet, {
      props: { breakpoint: 500 },
    });
    await tick();
    expect(sheet()).toHaveClass("bx--bottom-sheet--wide");
    expect(screen.queryByRole("slider")).toBeNull();
    expect(sheet().style.getPropertyValue("--ccs-bottom-sheet-offset")).toBe(
      "",
    );

    await rerender({ breakpoint: false });
    expect(sheet()).not.toHaveClass("bx--bottom-sheet--wide");
    expect(slider()).toBeInTheDocument();
  });

  it("limits snap heights to the window and merges ones that land together", async () => {
    render(BottomSheet, {
      props: { snapPoints: [100000, "full", "half"] },
    });
    await tick();
    expect(slider()).toHaveAttribute("aria-valuemax", "1");
  });
});
