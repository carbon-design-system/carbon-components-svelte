import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Carousel from "./Carousel.test.svelte";

/** Returns the "Previous slide" button. */
const prevButton = () => screen.getByRole("button", { name: "Previous slide" });
/** Returns the "Next slide" button. */
const nextButton = () => screen.getByRole("button", { name: "Next slide" });

describe("Carousel", () => {
  it("renders only the first slide visible", () => {
    render(Carousel);

    expect(screen.getByText("Slide one")).toBeVisible();
    expect(screen.getByText("Slide two")).not.toBeVisible();
    expect(screen.getByText("Slide three")).not.toBeVisible();
  });

  it("labels the carousel region and each slide per the WAI-ARIA APG pattern", () => {
    render(Carousel);

    const region = screen.getByRole("region", { name: "Carousel" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    const slide = screen.getByText("Slide one").closest("[role='group']");
    expect(slide).toHaveAttribute("aria-roledescription", "slide");
    expect(slide).toHaveAttribute("aria-label", "Slide 1 of 3");
    expect(screen.getByText("Slide one").parentElement).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("disables the previous button on the first slide and the next button on the last", async () => {
    render(Carousel);

    const prev = prevButton();
    const next = nextButton();
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    await user.click(next);
    await user.click(next);

    expect(next).toBeDisabled();
    expect(prev).not.toBeDisabled();
  });

  it("moves focus to the previous button when next reaches the last slide", async () => {
    render(Carousel);

    const next = nextButton();
    await user.click(next);
    await user.click(next);

    expect(document.activeElement).toBe(prevButton());
  });

  it("leaves focus where a change handler moved it at a bound", async () => {
    render(Carousel, { props: { selectedIndex: 1, moveFocusOnChange: true } });

    const next = nextButton();
    next.focus();
    await user.keyboard("{Enter}");

    expect(next).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Elsewhere" })).toHaveFocus();
  });

  it("moves focus to the next button when previous reaches the first slide", async () => {
    render(Carousel, { props: { selectedIndex: 1 } });

    await user.click(prevButton());

    expect(prevButton()).toBeDisabled();
    expect(nextButton()).toHaveFocus();
  });

  it("dispatches change with the new index on navigation", async () => {
    render(Carousel);

    await user.click(nextButton());

    expect(screen.getByTestId("current-index")).toHaveTextContent("1");
    expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
    expect(screen.getByText("Slide two")).toBeVisible();
  });

  it("moves to the next slide on ArrowRight and does not wrap past the last slide", async () => {
    render(Carousel);

    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");

    expect(screen.getByTestId("current-index")).toHaveTextContent("2");

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByTestId("current-index")).toHaveTextContent("1");
  });

  it("ignores arrow keys inside form fields", async () => {
    render(Carousel, { props: { selectedIndex: 1 } });

    await user.click(screen.getByLabelText("Name"));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
    expect(screen.getByText("Slide two")).toBeVisible();
  });

  it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"])(
    "ignores arrow keys with %s",
    async (modifier) => {
      render(Carousel);

      const notPrevented = await fireEvent.keyDown(
        screen.getByTestId("carousel"),
        { key: "ArrowRight", [modifier]: true },
      );

      expect(notPrevented).toBe(true);
      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
    },
  );

  it("ignores arrow keys another handler already handled", async () => {
    render(Carousel);
    const slide = screen.getByText("Slide one");
    slide.addEventListener("keydown", (event) => event.preventDefault());

    await fireEvent.keyDown(slide, { key: "ArrowRight" });

    expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
  });

  it.each(["Notes", "Choice", "Volume", "Options", "Sections"])(
    "ignores arrow keys inside %s",
    async (name) => {
      render(Carousel, { props: { guarded: true } });

      const notPrevented = await fireEvent.keyDown(
        screen.getByLabelText(name),
        {
          key: "ArrowRight",
        },
      );

      expect(notPrevented).toBe(true);
      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
    },
  );

  it("ignores arrow keys inside contenteditable content", async () => {
    render(Carousel, { props: { guarded: true } });
    const editor = screen.getByLabelText("Rich text");
    // dom-env doesn't implement `isContentEditable`.
    Object.defineProperty(editor, "isContentEditable", { value: true });

    const notPrevented = await fireEvent.keyDown(editor, {
      key: "ArrowRight",
    });

    expect(notPrevented).toBe(true);
    expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
  });

  it("starts at the initial selectedIndex without dispatching change", () => {
    render(Carousel, { props: { selectedIndex: 2 } });

    expect(screen.getByText("Slide three")).toBeVisible();
    expect(screen.getByText("Slide one")).not.toBeVisible();
    expect(screen.getByTestId("current-index")).toHaveTextContent("-1");
  });

  it("clamps an out-of-range selectedIndex", () => {
    render(Carousel, { props: { selectedIndex: 10 } });

    expect(screen.getByText("Slide three")).toBeVisible();
    expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
  });

  it("picks up slides added after mount", async () => {
    render(Carousel, { props: { selectedIndex: 2 } });
    const next = nextButton();
    expect(next).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add slide" }));
    // MutationObserver callbacks run as a microtask after the DOM change.
    await tick();

    expect(next).not.toBeDisabled();
    expect(screen.getByText("Slide three")).toBeVisible();
    expect(
      screen.getByText("Slide four").closest("[role='group']"),
    ).toHaveAttribute("aria-label", "Slide 4 of 4");

    await user.click(next);
    expect(screen.getByText("Slide four")).toBeVisible();
  });

  it("keeps selectedIndex when the slides load after mount", async () => {
    render(Carousel, { props: { loaded: false, selectedIndex: 2 } });
    expect(screen.getByTestId("selected-index")).toHaveTextContent("2");

    await user.click(screen.getByRole("button", { name: "Load slides" }));
    await tick();

    expect(screen.getByText("Slide three")).toBeVisible();
    expect(screen.getByText("Slide one")).not.toBeVisible();
    expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
  });

  it("labels a slide with the label prop", () => {
    render(Carousel, { props: { slideLabel: "Welcome" } });

    expect(
      screen.getByText("Slide one").closest("[role='group']"),
    ).toHaveAttribute("aria-label", "Welcome");
  });

  it("re-measures when useMaxHeight is turned off", async () => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(80);
    const { rerender } = render(Carousel);
    const viewport = screen.getByText("Slide one").parentElement;
    assert(viewport);
    expect(viewport.style.minBlockSize).toBe("80px");

    await rerender({ useMaxHeight: false });

    expect(viewport.style.minBlockSize).toBe("");
  });

  it("selects a slide added in the same update", async () => {
    render(Carousel);

    await user.click(
      screen.getByRole("button", { name: "Add and select slide" }),
    );
    await tick();

    expect(screen.getByText("Slide four")).toBeVisible();
    expect(screen.getByTestId("selected-index")).toHaveTextContent("3");
    expect(screen.getByTestId("current-index")).toHaveTextContent("3");
  });

  describe("wrap", () => {
    it("keeps both buttons enabled at the bounds", () => {
      render(Carousel, { props: { wrap: true } });

      expect(prevButton()).not.toBeDisabled();
      expect(nextButton()).not.toBeDisabled();
    });

    it("disables both buttons for a single slide", () => {
      render(Carousel, { props: { wrap: true, single: true } });

      expect(prevButton()).toBeDisabled();
      expect(nextButton()).toBeDisabled();
    });

    it("goes from the last slide to the first on next", async () => {
      render(Carousel, { props: { wrap: true, selectedIndex: 2 } });

      await user.click(nextButton());

      expect(screen.getByText("Slide one")).toBeVisible();
      expect(screen.getByTestId("current-index")).toHaveTextContent("0");
      expect(screen.getByTestId("previous-index")).toHaveTextContent("2");
    });

    it("goes from the first slide to the last on ArrowLeft", async () => {
      render(Carousel, { props: { wrap: true } });

      await user.tab();
      await user.keyboard("{ArrowLeft}");

      expect(screen.getByText("Slide three")).toBeVisible();
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
    });

    it("still clamps an out-of-range selectedIndex", () => {
      render(Carousel, { props: { wrap: true, selectedIndex: 4 } });

      expect(screen.getByText("Slide three")).toBeVisible();
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
    });
  });

  describe("counter", () => {
    it("is hidden by default", () => {
      render(Carousel);

      expect(screen.queryByText("1 of 3")).not.toBeInTheDocument();
    });

    it("shows the active slide's position and updates on navigation", async () => {
      render(Carousel, { props: { showCounter: true } });

      expect(screen.getByText("1 of 3")).toBeInTheDocument();

      await user.click(nextButton());

      expect(screen.getByText("2 of 3")).toBeInTheDocument();
    });

    it("uses a custom counterText", () => {
      render(Carousel, {
        props: {
          showCounter: true,
          selectedIndex: 1,
          counterText: (current: number, total: number) =>
            `Tip ${current}/${total}`,
        },
      });

      expect(screen.getByText("Tip 2/3")).toBeInTheDocument();
    });
  });
});
