import { render, screen, waitFor } from "@testing-library/svelte";
import type UserAvatarComponent from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
import type { ComponentProps } from "svelte";
import { getAvatarBackgroundColor } from "../../src/utils/avatarColor.js";
import { user } from "../utils/user";
import UserAvatar from "./UserAvatar.test.svelte";
import UserAvatarImageError from "./UserAvatarImageError.test.svelte";

describe("UserAvatar", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the default user icon with no content", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("default");
    expect(avatar).toHaveClass("bx--user-avatar", "bx--user-avatar--md");
    expect(avatar.querySelector("svg")).toBeInTheDocument();
    expect(avatar.querySelector(".bx--user-avatar__text")).toBeNull();
  });

  it("derives initials from a single-word name", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("initials-single");
    expect(avatar).toHaveTextContent("E");
  });

  it("derives initials from the first character of each word, capped at two", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("initials-multi");
    expect(avatar).toHaveTextContent("JD");
  });

  it("uses the initials prop over initials derived from name", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("initials-override");
    expect(avatar).toHaveTextContent("XY");
  });

  it("renders an image with alt text, taking priority over the name", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("image");
    const img = avatar.querySelector("img");
    assert(img);
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("alt", "A user photo");
    expect(avatar).not.toHaveTextContent("SS");
  });

  it("spreads imageAttributes onto the img and keeps rest props on the host", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("image-attributes");
    expect(avatar).toHaveAttribute("data-avatar-host", "true");
    expect(avatar).not.toHaveAttribute("loading");
    expect(avatar).not.toHaveAttribute("srcset");
    expect(avatar).not.toHaveAttribute("referrerpolicy");

    const img = avatar.querySelector("img");
    assert(img);
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("alt", "A user photo");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("srcset", "https://example.com/photo.jpg 1x");
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(img).not.toHaveAttribute("data-testid");
    expect(img).not.toHaveAttribute("data-avatar-host");
  });

  it("falls back to initials when the image fails to load and dispatches image:error", async () => {
    const onImageError = vi.fn();
    render(UserAvatarImageError, { props: { onImageError } });

    const avatar = screen.getByTestId("image-error");
    const img = avatar.querySelector("img");
    assert(img);

    img.dispatchEvent(new Event("error"));

    expect(onImageError).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(avatar.querySelector("img")).toBeNull();
      expect(avatar).toHaveTextContent("JD");
    });
  });

  it("retries the image when the src changes after a failed load", async () => {
    const { rerender } = render(UserAvatarImageError, {
      props: { image: "https://example.com/broken.jpg" },
    });

    const avatar = screen.getByTestId("image-error");
    const img = avatar.querySelector("img");
    assert(img);
    img.dispatchEvent(new Event("error"));
    await waitFor(() => {
      expect(avatar).toHaveTextContent("JD");
    });

    await rerender({ image: "https://example.com/photo.jpg" });

    const nextImg = avatar.querySelector("img");
    assert(nextImg);
    expect(nextImg).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(avatar).not.toHaveTextContent("JD");
  });

  it("renders a custom icon, taking priority over the name", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("icon");
    expect(avatar.querySelector("svg")).toBeInTheDocument();
    expect(avatar.querySelector(".bx--user-avatar__text")).toBeNull();
  });

  it("applies the size class", () => {
    render(UserAvatar);

    expect(screen.getByTestId("size-lg")).toHaveClass("bx--user-avatar--lg");
  });

  it("applies the background color class", () => {
    render(UserAvatar);

    expect(screen.getByTestId("color-blue")).toHaveClass(
      "bx--user-avatar--blue",
    );
    expect(screen.getByTestId("color-cool-gray")).toHaveClass(
      "bx--user-avatar--cool-gray",
    );
  });

  it('picks a stable background color when backgroundColor is "auto"', () => {
    render(UserAvatar);

    const expected = `bx--user-avatar--${getAvatarBackgroundColor("John Doe")}`;
    expect(screen.getByTestId("color-auto")).toHaveClass(expected);
    // Same name resolves to the same color.
    expect(screen.getByTestId("color-auto-2")).toHaveClass(expected);
  });

  it("wraps the avatar in a floating-portal tooltip by default", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("tooltip");
    expect(avatar).toHaveClass("bx--user-avatar");

    const trigger = avatar.closest(".bx--tooltip__trigger--definition");
    assert(trigger);
    expect(trigger).toHaveClass("bx--tooltip--portal-active");
  });

  it("renders an inline tooltip when portalTooltip is false", () => {
    render(UserAvatar);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Jane Roe");
    expect(tooltip).toHaveClass("bx--assistive-text");
  });

  it("renders custom default slot content over computed content", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("slot");
    expect(avatar).toHaveTextContent("custom content");
    expect(avatar).not.toHaveTextContent("JD");
  });

  it("merges a consumer class with the base classes", () => {
    render(UserAvatar);

    expect(screen.getByTestId("custom-class")).toHaveClass(
      "bx--user-avatar",
      "bx--user-avatar--md",
      "my-class",
    );
  });

  it("forwards `data-avatar-group-overflow` to the tooltip wrapper, not only the inner avatar", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("tooltip-overflow-marker");
    expect(avatar).toHaveAttribute("data-avatar-group-overflow", "true");

    const wrapper = avatar.closest(".bx--tooltip--definition");
    assert(wrapper);
    expect(wrapper).toHaveAttribute("data-avatar-group-overflow", "true");
  });

  it("forwards DOM events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(UserAvatar);

    const avatar = screen.getByTestId("events");
    await user.click(avatar);
    expect(consoleLog).toHaveBeenCalledWith("click");

    await user.hover(avatar);
    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
  });

  it("renders a span by default", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("default");
    expect(avatar.tagName).toBe("SPAN");
    expect(avatar).not.toHaveClass("bx--user-avatar--interactive");
  });

  it("renders a button when interactive is set", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("interactive");
    expect(avatar.tagName).toBe("BUTTON");
    expect(avatar).toHaveAttribute("type", "button");
    expect(avatar).toHaveClass("bx--user-avatar--interactive");
    expect(avatar).toHaveAttribute("aria-label", "John Doe");
  });

  it("renders an anchor when href is set", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("href");
    expect(avatar.tagName).toBe("A");
    expect(avatar).toHaveAttribute("href", "/profile");
    expect(avatar).toHaveClass("bx--user-avatar--interactive");
  });

  it("prefers href over interactive", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("href-over-interactive");
    expect(avatar.tagName).toBe("A");
    expect(avatar).toHaveAttribute("href", "/profile");
    expect(avatar).not.toHaveAttribute("type");
  });

  it("renders a status badge for each presence status", () => {
    render(UserAvatar);

    for (const status of ["online", "away", "busy", "offline"] as const) {
      const avatar = screen.getByTestId(`status-${status}`);
      const badge = avatar.parentElement?.querySelector(
        ".bx--user-avatar__badge",
      );
      assert(badge);
      expect(
        badge.querySelector(`.bx--user-avatar__status--${status}`),
      ).toBeInTheDocument();
    }
  });

  it("lets a custom badge slot override the status indicator", () => {
    render(UserAvatar);

    const avatar = screen.getByTestId("badge-slot");
    const wrapper = avatar.parentElement;
    assert(wrapper);
    expect(wrapper.querySelector(".bx--user-avatar__status")).toBeNull();
    expect(screen.getByTestId("custom-badge")).toHaveTextContent("99");
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = UserAvatarComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = UserAvatarComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
