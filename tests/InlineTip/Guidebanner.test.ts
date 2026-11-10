import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Guidebanner from "./Guidebanner.test.svelte";

const KEY = "carbon:tips";

describe("Guidebanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is a carousel region whose slide is named by its position", () => {
    render(Guidebanner);

    const region = screen.getByRole("region", { name: "Tips" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    const slide = screen.getByRole("group", { name: "1 of 3" });
    expect(slide).toHaveAttribute("aria-roledescription", "slide");
    expect(
      screen.getByRole("heading", { level: 3, name: "Filter by owner" }),
    ).toBeVisible();
    expect(screen.getByText("Narrow the table.")).toBeVisible();
    expect(screen.getByText("1 of 3", { selector: "span" })).toBeVisible();
  });

  it("steps through the tips and wraps around at both ends", async () => {
    const onChange = vi.fn();
    render(Guidebanner, { props: { onChange } });

    await user.click(screen.getByRole("button", { name: "Next tip" }));
    expect(
      screen.getByRole("heading", { name: "Export a view" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute(
      "href",
      "/docs/export",
    );
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { index: 1, id: "export" } }),
    );

    await user.click(screen.getByRole("button", { name: "Next tip" }));
    await user.click(screen.getByRole("button", { name: "Next tip" }));
    expect(
      screen.getByRole("heading", { name: "Filter by owner" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Previous tip" }));
    expect(screen.getByRole("heading", { name: "Share a view" })).toBeVisible();
    expect(screen.getByTestId("current")).toHaveTextContent("2");
  });

  it("keeps focus on the button that moved to the next tip", async () => {
    render(Guidebanner);

    const next = screen.getByRole("button", { name: "Next tip" });
    next.focus();
    await user.keyboard("{Enter}");

    expect(next).toHaveFocus();
  });

  it("announces the tip a button moved to, and only after the user reaches it", async () => {
    render(Guidebanner);

    const live = () => screen.getByRole("group").parentElement as HTMLElement;
    expect(live()).toHaveAttribute("aria-live", "off");

    await user.tab();
    await user.tab();
    expect(live()).toHaveAttribute("aria-live", "polite");
  });

  it("clamps `current` into the tips left", () => {
    render(Guidebanner, { props: { current: 9 } });

    expect(screen.getByRole("group", { name: "3 of 3" })).toBeVisible();
  });

  it("skips tips already dismissed and counts only the rest", () => {
    localStorage.setItem(KEY, JSON.stringify(["filters"]));
    render(Guidebanner);

    expect(
      screen.getByRole("heading", { name: "Export a view" }),
    ).toBeVisible();
    expect(screen.getByRole("group", { name: "1 of 2" })).toBeVisible();
  });

  it("has no previous or next button for a single tip", () => {
    render(Guidebanner, {
      props: { tips: [{ id: "only", title: "Only tip" }] },
    });

    expect(screen.queryByRole("button", { name: "Next tip" })).toBeNull();
    expect(screen.queryByText("1 of 1")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Dismiss all tips" }),
    ).toBeVisible();
  });

  it("dismisses every tip at once and remembers each", async () => {
    const onDismiss = vi.fn();
    const { unmount } = render(Guidebanner, { props: { onDismiss } });

    await user.click(screen.getByRole("button", { name: "Dismiss all tips" }));

    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { ids: ["filters", "export", "share"] },
      }),
    );
    expect(screen.queryByTestId("banner")).toBeNull();
    expect(JSON.parse(localStorage.getItem(KEY) as string)).toEqual([
      "filters",
      "export",
      "share",
    ]);

    unmount();
    render(Guidebanner);
    expect(screen.queryByTestId("banner")).toBeNull();
  });

  it("shows a tip added after the others were dismissed, on its own", () => {
    localStorage.setItem(KEY, JSON.stringify(["filters", "export", "share"]));
    render(Guidebanner, {
      props: {
        tips: [
          { id: "filters", title: "Filter by owner" },
          { id: "export", title: "Export a view" },
          { id: "share", title: "Share a view" },
          { id: "sort", title: "Sort by date" },
        ],
      },
    });

    expect(screen.getByRole("heading", { name: "Sort by date" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Next tip" })).toBeNull();
  });

  it("puts focus back where it was before it entered the dismissed banner", async () => {
    render(Guidebanner);

    screen.getByText("Before").focus();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Dismiss all tips" }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(screen.getByText("Before")).toHaveFocus();
  });

  it("keeps the banner when a dismiss listener prevents the default", async () => {
    const onDismiss = vi.fn((event: Event) => event.preventDefault());
    render(Guidebanner, { props: { onDismiss } });

    await user.click(screen.getByRole("button", { name: "Dismiss all tips" }));

    expect(screen.getByTestId("banner")).toBeVisible();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("handles twenty tips", async () => {
    const tips = Array.from({ length: 20 }, (_, index) => ({
      id: `tip-${index}`,
      title: `Tip ${index + 1}`,
    }));
    render(Guidebanner, { props: { tips } });

    expect(screen.getByRole("group", { name: "1 of 20" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Previous tip" }));
    expect(screen.getByRole("group", { name: "20 of 20" })).toBeVisible();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });
});
