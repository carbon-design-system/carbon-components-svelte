import { render, screen } from "@testing-library/svelte";
import type UserAvatarComponent from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import UserAvatar from "./UserAvatar.test.svelte";

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

  it("forwards DOM events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(UserAvatar);

    const avatar = screen.getByTestId("events");
    await user.click(avatar);
    expect(consoleLog).toHaveBeenCalledWith("click");

    await user.hover(avatar);
    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
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
