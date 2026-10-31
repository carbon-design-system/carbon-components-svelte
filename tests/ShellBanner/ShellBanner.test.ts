import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ShellBanner from "./ShellBanner.test.svelte";

const OFFSET = "--ccs-shell-offset";
const offset = () => document.documentElement.style.getPropertyValue(OFFSET);

describe("ShellBanner", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders a named region that is not a live region by default", () => {
    render(ShellBanner, { props: { title: "Staging" } });

    const banner = screen.getByRole("region", { name: "Site announcement" });
    expect(banner).toBe(screen.getByTestId("banner"));
    expect(banner).not.toHaveAttribute("role");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("is a status live region only when it announces", () => {
    render(ShellBanner, { props: { announce: true } });

    expect(screen.getByRole("status")).toBe(screen.getByTestId("banner"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("describes its action by the title", () => {
    render(ShellBanner, { props: { title: "Viewing as Jane" } });

    expect(
      screen.getByRole("button", { name: "Exit" }),
    ).toHaveAccessibleDescription("Viewing as Jane");
  });

  describe("dismissing", () => {
    it("has no close button unless dismissible", () => {
      render(ShellBanner);

      expect(
        screen.queryByRole("button", { name: "Dismiss banner" }),
      ).toBeNull();
    });

    it("closes, and binds open", async () => {
      render(ShellBanner, { props: { dismissible: true } });

      screen.getByRole("button", { name: "Dismiss banner" }).focus();
      await user.keyboard("{Enter}");

      expect(screen.queryByTestId("banner")).toBeNull();
      expect(screen.getByTestId("open")).toHaveTextContent("false");
    });

    it("holds its space under the pointer until the pointer leaves", async () => {
      render(ShellBanner, {
        props: { placement: "above-header", dismissible: true },
      });
      await tick();

      await user.click(screen.getByRole("button", { name: "Dismiss banner" }));

      // `open` is false at once; the empty banner keeps the offset.
      expect(screen.getByTestId("open")).toHaveTextContent("false");
      const banner = screen.getByTestId("banner");
      expect(banner).toHaveAttribute("aria-hidden", "true");
      expect(banner).toHaveClass("bx--shell-banner--held");
      expect(offset()).not.toBe("");

      await user.unhover(banner);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await tick();

      expect(screen.queryByTestId("banner")).toBeNull();
      expect(offset()).toBe("");
    });

    it("keeps the banner open when a close listener cancels", async () => {
      const onclose = vi.fn((event: CustomEvent) => event.preventDefault());
      render(ShellBanner, {
        props: { dismissible: true, dismissId: "notice", onclose },
      });

      await user.click(screen.getByRole("button", { name: "Dismiss banner" }));

      expect(onclose).toHaveBeenCalledTimes(1);
      expect(onclose.mock.calls[0][0].detail).toEqual({ dismissId: "notice" });
      expect(screen.getByTestId("banner")).toBeInTheDocument();
      expect(localStorage.getItem("ccs-shell-banner:notice")).not.toBe("true");
    });

    it("returns focus to where it came from", async () => {
      render(ShellBanner, { props: { dismissible: true } });
      const before = screen.getByRole("button", { name: "Before" });
      before.focus();

      await user.tab();
      await user.tab();
      await user.keyboard("{Enter}");
      await tick();

      expect(screen.queryByTestId("banner")).toBeNull();
      expect(before).toHaveFocus();
    });
  });

  describe("dismissId", () => {
    const props = { dismissible: true, dismissId: "release-2" };

    it("stays dismissed on the next visit", async () => {
      const first = render(ShellBanner, { props });
      await user.click(screen.getByRole("button", { name: "Dismiss banner" }));
      expect(localStorage.getItem("ccs-shell-banner:release-2")).toBe("true");
      first.unmount();

      render(ShellBanner, { props });
      await tick();

      expect(screen.queryByTestId("banner")).toBeNull();
      expect(screen.getByTestId("open")).toHaveTextContent("false");
    });

    it("shows a banner with another id", async () => {
      localStorage.setItem("ccs-shell-banner:release-1", "true");

      render(ShellBanner, { props });
      await tick();

      expect(screen.getByTestId("banner")).toBeInTheDocument();
    });
  });

  describe("--ccs-shell-offset", () => {
    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        height: 40,
      } as DOMRect);
    });

    it("is the height of an above-header banner", async () => {
      render(ShellBanner, { props: { placement: "above-header" } });
      await tick();

      expect(offset()).toBe("40px");
    });

    it("is removed when the banner closes", async () => {
      render(ShellBanner, {
        props: { placement: "above-header", dismissible: true },
      });
      await tick();
      expect(offset()).toBe("40px");

      screen.getByRole("button", { name: "Dismiss banner" }).focus();
      await user.keyboard("{Enter}");

      expect(offset()).toBe("");
    });

    it("is removed when the banner unmounts", async () => {
      const { unmount } = render(ShellBanner, {
        props: { placement: "above-header" },
      });
      await tick();

      unmount();

      expect(offset()).toBe("");
    });

    it("is not set by a content banner", async () => {
      render(ShellBanner, { props: { placement: "content" } });
      await tick();

      expect(offset()).toBe("");
    });
  });

  it("shows only the title of a thin banner", () => {
    render(ShellBanner, {
      props: { thin: true, title: "Staging", subtitle: "Ignored" },
    });

    const banner = screen.getByTestId("banner");
    expect(banner).toHaveClass("bx--shell-banner--thin");
    expect(banner).toHaveTextContent("Staging");
    // The kind shows as its icon too, not only as the strip's color.
    expect(
      banner.querySelector(".bx--inline-notification__icon title"),
    ).toHaveTextContent("Information");
    expect(screen.queryByText("Ignored")).toBeNull();
    expect(screen.queryByTestId("extra")).toBeNull();
    expect(screen.queryByRole("button", { name: "Exit" })).toBeNull();
  });
});
