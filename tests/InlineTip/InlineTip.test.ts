import { render, screen } from "@testing-library/svelte";
import { createTipStore } from "../../src/utils/tip-store";
import { user } from "../utils/user";
import InlineTip from "./InlineTip.test.svelte";
import InlineTipShared from "./InlineTipShared.test.svelte";
import InlineTipSlots from "./InlineTipSlots.test.svelte";

const KEY = "carbon:tips";

describe("InlineTip", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is a region named by its title, with a dismiss button that reads it", () => {
    render(InlineTip);

    const region = screen.getByRole("region", { name: "Filter by owner" });
    expect(region).toHaveAttribute("id", "filters");
    expect(
      screen.getByRole("heading", { level: 3, name: "Filter by owner" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Dismiss tip: Filter by owner" }),
    ).toBeVisible();
  });

  it("announces nothing when it appears", () => {
    render(InlineTip);

    expect(
      screen.getByTestId("tip").querySelector("[aria-live], [role=alert]"),
    ).toBeNull();
  });

  it("remembers a dismissal, so the tip is gone the next time", async () => {
    const { unmount } = render(InlineTip);

    await user.click(
      screen.getByRole("button", { name: "Dismiss tip: Filter by owner" }),
    );
    expect(screen.queryByTestId("tip")).toBeNull();
    expect(JSON.parse(localStorage.getItem(KEY) as string)).toEqual([
      "filters",
    ]);

    unmount();
    render(InlineTip);
    expect(screen.queryByTestId("tip")).toBeNull();
    expect(screen.getByText("After")).toBeVisible();
  });

  it("keeps showing a tip whose id was not dismissed", () => {
    localStorage.setItem(KEY, JSON.stringify(["other"]));
    render(InlineTip);

    expect(screen.getByTestId("tip")).toBeVisible();
  });

  it("dismisses a tip with no id for the life of the component only", async () => {
    const { unmount } = render(InlineTip, { props: { withId: false } });

    await user.click(
      screen.getByRole("button", { name: "Dismiss tip: Filter by owner" }),
    );
    expect(screen.queryByTestId("tip")).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();

    unmount();
    render(InlineTip, { props: { withId: false } });
    expect(screen.getByTestId("tip")).toBeVisible();
  });

  it("keeps the tip when a dismiss listener prevents the default", async () => {
    const onDismiss = vi.fn((event: Event) => event.preventDefault());
    render(InlineTip, { props: { onDismiss } });

    await user.click(
      screen.getByRole("button", { name: "Dismiss tip: Filter by owner" }),
    );

    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: "filters" } }),
    );
    expect(screen.getByTestId("tip")).toBeVisible();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("puts focus back where it was before it entered the dismissed tip", async () => {
    render(InlineTip);

    screen.getByText("Before").focus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Dismiss tip: Filter by owner" }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(screen.queryByTestId("tip")).toBeNull();
    expect(screen.getByText("Before")).toHaveFocus();
  });

  it("hides the dismiss button when it is not dismissible", () => {
    render(InlineTip, { props: { dismissible: false } });

    expect(screen.queryByRole("button", { name: /Dismiss/ })).toBeNull();
  });

  it("names the dismiss button with `dismissText`", () => {
    render(InlineTip, {
      props: { dismissText: (title: string) => `Cerrar: ${title}` },
    });

    expect(
      screen.getByRole("button", { name: "Cerrar: Filter by owner" }),
    ).toBeVisible();
  });

  it("collapses to its title through a disclosure button", async () => {
    const onToggle = vi.fn();
    render(InlineTip, { props: { collapsible: true, onToggle } });

    const toggle = screen.getByRole("button", { name: "Filter by owner" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute(
      "aria-controls",
      toggle.id.replace("-title", "-content"),
    );

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("tip")).toHaveClass("bx--inline-tip--collapsed");
    expect(screen.getByTestId("collapsed")).toHaveTextContent("true");
    expect(onToggle).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { collapsed: true } }),
    );

    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("starts collapsed and leaves the title as plain text when not collapsible", () => {
    const { unmount } = render(InlineTip, {
      props: { collapsible: true, collapsed: true },
    });
    expect(
      screen.getByRole("button", { name: "Filter by owner" }),
    ).toHaveAttribute("aria-expanded", "false");
    unmount();

    render(InlineTip, { props: { collapsed: true } });
    expect(
      screen.queryByRole("button", { name: "Filter by owner" }),
    ).toBeNull();
    expect(screen.getByTestId("tip")).not.toHaveClass(
      "bx--inline-tip--collapsed",
    );
  });

  it("describes the Learn more link by the title", () => {
    render(InlineTip, { props: { href: "/docs/filters" } });

    const link = screen.getByRole("link", { name: "Learn more" });
    expect(link).toHaveAttribute("href", "/docs/filters");
    expect(link).toHaveAccessibleDescription("Filter by owner");
  });

  it("sets the heading level", () => {
    render(InlineTip, { props: { headingLevel: 2 } });

    expect(screen.getByRole("heading", { level: 2 })).toBeVisible();
  });

  it("renders the actions and illustration slots", () => {
    render(InlineTipSlots);

    expect(screen.getByRole("button", { name: "Turn on" })).toBeVisible();
    expect(screen.getByTestId("art").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("reads the storage after mounting, so another store's tips update", () => {
    const store = createTipStore();
    render(InlineTip, { props: { store } });
    expect(screen.getByTestId("tip")).toBeVisible();

    store.dismiss("filters");
    return vi.waitFor(() => expect(screen.queryByTestId("tip")).toBeNull());
  });

  it("brings the tips back when a shared store resets", async () => {
    render(InlineTipShared);

    await user.click(
      screen.getByRole("button", { name: "Dismiss tip: Tip A" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Dismiss tip: Tip B" }),
    );
    expect(screen.queryByRole("region")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Show tips again" }));
    expect(screen.getAllByRole("region")).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(KEY) as string)).toEqual([]);
  });

  it("hides a tip another tab dismissed", async () => {
    render(InlineTip);

    localStorage.setItem(KEY, JSON.stringify(["filters"]));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: KEY,
        newValue: JSON.stringify(["filters"]),
        storageArea: localStorage,
      }),
    );

    await vi.waitFor(() => expect(screen.queryByTestId("tip")).toBeNull());
  });
});
