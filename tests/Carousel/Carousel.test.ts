import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Carousel from "./Carousel.test.svelte";

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
  });

  it("announces slide changes politely", () => {
    render(Carousel);

    const viewport = screen.getByText("Slide one").parentElement;
    expect(viewport).toHaveAttribute("aria-live", "polite");
  });

  it("disables the previous button on the first slide and the next button on the last", async () => {
    render(Carousel);

    const prev = screen.getByRole("button", { name: "Previous slide" });
    const next = screen.getByRole("button", { name: "Next slide" });
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    await user.click(next);
    await user.click(next);

    expect(next).toBeDisabled();
    expect(prev).not.toBeDisabled();
  });

  it("moves focus to the previous button when next reaches the last slide", async () => {
    render(Carousel);

    const next = screen.getByRole("button", { name: "Next slide" });
    await user.click(next);
    await user.click(next);

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Previous slide" }),
    );
  });

  it("dispatches change with the new index on navigation", async () => {
    render(Carousel);

    await user.click(screen.getByRole("button", { name: "Next slide" }));

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
    const next = screen.getByRole("button", { name: "Next slide" });
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
});
