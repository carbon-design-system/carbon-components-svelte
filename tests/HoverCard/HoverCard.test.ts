import { fireEvent, render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { tick } from "svelte";
import HoverCard from "./HoverCard.test.svelte";
import HoverCardPair from "./HoverCardPair.test.svelte";

// Fake timers need user-event to advance them between its own steps.
const user = userEvent.setup({
  advanceTimers: (ms) => vi.advanceTimersByTime(ms),
});

const trigger = () => screen.getByRole("link", { name: "@octocat" });
const card = () => screen.queryByRole("dialog");

async function advance(ms: number) {
  vi.advanceTimersByTime(ms);
  await tick();
}

// A real pointer entering the trigger enters every ancestor too, and
// `pointerenter` does not bubble, so the test dispatches it on the wrapper.
const region = (el: HTMLElement) =>
  el.closest<HTMLElement>("[role=dialog], .bx--hover-card") as HTMLElement;

async function hover(el: HTMLElement, pointerType = "mouse") {
  await fireEvent.pointerEnter(region(el), { pointerType });
}

async function unhover(el: HTMLElement, pointerType = "mouse") {
  await fireEvent.pointerLeave(region(el), { pointerType });
}

describe("HoverCard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("hover intent", () => {
    it("opens after the open delay and not before", async () => {
      render(HoverCard);
      await hover(trigger());
      await advance(499);
      expect(card()).toBeNull();
      await advance(1);
      expect(card()).toBeInTheDocument();
    });

    it("opens nothing for a pointer that passes through", async () => {
      render(HoverCard);
      await hover(trigger());
      await advance(200);
      await unhover(trigger());
      await advance(1000);
      expect(card()).toBeNull();
    });

    it("closes after the close delay", async () => {
      render(HoverCard);
      await hover(trigger());
      await advance(500);
      await unhover(trigger());
      await advance(299);
      expect(card()).toBeInTheDocument();
      await advance(1);
      expect(card()).toBeNull();
    });

    it("stays open when the pointer returns within the close delay", async () => {
      render(HoverCard);
      await hover(trigger());
      await advance(500);
      await unhover(trigger());
      await advance(200);
      await hover(trigger());
      await advance(1000);
      expect(card()).toBeInTheDocument();
    });

    it("never opens for a touch pointer", async () => {
      render(HoverCard);
      await hover(trigger(), "touch");
      await advance(2000);
      expect(card()).toBeNull();
    });

    it("does not open while disabled", async () => {
      render(HoverCard, { props: { disabled: true } });
      await hover(trigger());
      await advance(1000);
      expect(card()).toBeNull();
    });
  });

  describe("keyboard", () => {
    it("opens on focus after a short delay and closes on blur", async () => {
      render(HoverCard);
      await user.tab();
      expect(trigger()).toHaveFocus();
      await advance(149);
      expect(card()).toBeNull();
      await advance(1);
      expect(card()).toBeInTheDocument();
      await user.tab({ shift: true });
      await advance(300);
      expect(card()).toBeNull();
    });

    it("does not open after the trigger is activated", async () => {
      render(HoverCard);
      await user.tab();
      await user.keyboard("{Enter}");
      await advance(1000);
      expect(card()).toBeNull();
    });

    it("closes on Escape and keeps focus on the trigger", async () => {
      render(HoverCard);
      await user.tab();
      await advance(150);
      expect(card()).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(card()).toBeNull();
      expect(trigger()).toHaveFocus();
      // Dismissed: the same focus does not reopen it.
      await advance(1000);
      expect(card()).toBeNull();
    });

    it("closes on Escape with focus inside the card and returns it to the trigger", async () => {
      render(HoverCard);
      await user.tab();
      await advance(150);
      await user.tab();
      expect(screen.getByTestId("first")).toHaveFocus();
      await user.keyboard("{Escape}");
      await tick();
      expect(card()).toBeNull();
      expect(trigger()).toHaveFocus();
      await advance(1000);
      expect(card()).toBeNull();
    });

    it("moves into the card with Tab and keeps it open", async () => {
      render(HoverCard);
      await user.tab();
      await advance(150);
      await user.tab();
      expect(screen.getByTestId("first")).toHaveFocus();
      await advance(2000);
      expect(card()).toBeInTheDocument();
    });

    it("closes when Tab leaves the card", async () => {
      render(HoverCard);
      await user.tab();
      await advance(150);
      await user.tab();
      await user.tab();
      await user.tab();
      expect(screen.getByTestId("after")).toHaveFocus();
      await advance(300);
      expect(card()).toBeNull();
    });
  });

  describe("pointer and card", () => {
    it("stays open while the pointer is on the card", async () => {
      render(HoverCard, { props: { portalCard: true } });
      await hover(trigger());
      await advance(500);
      await unhover(trigger());
      await advance(100);
      await hover(card() as HTMLElement);
      await advance(2000);
      expect(card()).toBeInTheDocument();
      await unhover(card() as HTMLElement);
      await advance(300);
      expect(card()).toBeNull();
    });

    it("closes when the trigger is clicked", async () => {
      render(HoverCard);
      await hover(trigger());
      await advance(500);
      await fireEvent.click(trigger());
      expect(card()).toBeNull();
    });
  });

  describe("one at a time", () => {
    it("closes the open card when another opens", async () => {
      render(HoverCardPair);
      await hover(screen.getByRole("link", { name: "one" }));
      await advance(50);
      expect(screen.getByText("Card one")).toBeInTheDocument();
      await hover(screen.getByRole("link", { name: "two" }));
      await advance(50);
      expect(screen.getByText("Card two")).toBeInTheDocument();
      expect(screen.queryByText("Card one")).toBeNull();
    });
  });

  describe("accessibility", () => {
    it("is a dialog named by its trigger, and the trigger points to it", async () => {
      render(HoverCard);
      expect(trigger()).not.toHaveAttribute("aria-details");
      await hover(trigger());
      await advance(500);
      const dialog = screen.getByRole("dialog", { name: "@octocat" });
      expect(dialog).not.toHaveAttribute("aria-modal");
      expect(trigger()).toHaveAttribute(
        "aria-details",
        dialog.parentElement?.parentElement?.id,
      );
      expect(trigger()).not.toHaveAttribute("aria-expanded");
      await unhover(trigger());
      await advance(300);
      expect(trigger()).not.toHaveAttribute("aria-details");
    });

    it("names the dialog from aria-label", async () => {
      render(HoverCard, { props: { label: "Profile" } });
      await hover(trigger());
      await advance(500);
      expect(
        screen.getByRole("dialog", { name: "Profile" }),
      ).toBeInTheDocument();
    });
  });

  describe("load", () => {
    it("shows a skeleton, then the data, and caches it", async () => {
      const load = vi.fn(() => Promise.resolve({ name: "The Octocat" }));
      render(HoverCard, { props: { load } });
      await hover(trigger());
      await advance(500);
      expect(card()).toHaveAttribute("aria-busy", "true");
      expect(screen.queryByTestId("body")).toBeNull();
      await vi.waitFor(() =>
        expect(screen.getByTestId("body")).toHaveTextContent("The Octocat"),
      );
      expect(card()).not.toHaveAttribute("aria-busy");
      await unhover(trigger());
      await advance(300);
      await hover(trigger());
      await advance(500);
      expect(screen.getByTestId("body")).toHaveTextContent("The Octocat");
      expect(load).toHaveBeenCalledTimes(1);
    });

    it("aborts the request when the card closes first", async () => {
      let signal: AbortSignal | undefined;
      const load = vi.fn(({ signal: s }: { signal: AbortSignal }) => {
        signal = s;
        return new Promise(() => {});
      });
      render(HoverCard, { props: { load } });
      await hover(trigger());
      await advance(500);
      expect(signal?.aborted).toBe(false);
      await unhover(trigger());
      await advance(300);
      expect(signal?.aborted).toBe(true);
    });

    it("fetches again after a failure, from the retry button", async () => {
      const load = vi
        .fn()
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce({ name: "Back" });
      render(HoverCard, { props: { load } });
      await hover(trigger());
      await advance(500);
      await vi.waitFor(() =>
        expect(screen.getByText("Unable to load.")).toBeInTheDocument(),
      );
      await fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      await vi.waitFor(() =>
        expect(screen.getByTestId("body")).toHaveTextContent("Back"),
      );
    });

    it("shares a result between cards with the same cacheKey", async () => {
      const load = vi.fn(() => Promise.resolve({ name: "Shared" }));
      const first = render(HoverCard, {
        props: { load, cacheKey: "user:shared" },
      });
      await hover(trigger());
      await advance(500);
      await vi.waitFor(() =>
        expect(screen.getByTestId("body")).toHaveTextContent("Shared"),
      );
      first.unmount();
      render(HoverCard, { props: { load, cacheKey: "user:shared" } });
      await hover(trigger());
      await advance(500);
      expect(screen.getByTestId("body")).toHaveTextContent("Shared");
      expect(load).toHaveBeenCalledTimes(1);
    });
  });

  it("dispatches open and close", async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    render(HoverCard, { props: { onOpen, onClose } });
    await hover(trigger());
    await advance(500);
    expect(onOpen).toHaveBeenCalledTimes(1);
    await unhover(trigger());
    await advance(300);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
