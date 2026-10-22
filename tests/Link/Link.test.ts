import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type LinkComponent from "carbon-components-svelte/Link/Link.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import Link from "./Link.test.svelte";

describe("Link", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with default props", () => {
    render(Link);
    // Find the first link (default link) which doesn't have special classes
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find(
      (l) =>
        !l.classList.contains("bx--link--inline") &&
        !l.classList.contains("bx--link--disabled") &&
        !l.classList.contains("bx--link--visited") &&
        !l.classList.contains("bx--link--lg") &&
        !l.classList.contains("bx--link--sm") &&
        l.getAttribute("target") !== "_blank",
    );
    assert(link);

    expect(link).toHaveClass("bx--link");
    expect(link).toHaveAttribute("href", "https://www.carbondesignsystem.com/");
    expect(link).toHaveTextContent("Carbon Design System");
  });

  it("adds noopener noreferrer when target is _blank", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.getAttribute("target") === "_blank");
    assert(link);

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("supports icon prop", () => {
    render(Link);
    const link = within(screen.getByTestId("link-with-icon")).getByRole("link");

    const iconWrapper = link.querySelector(".bx--link__icon");
    assert(iconWrapper);
    expect(iconWrapper.querySelector("svg")).toBeInTheDocument();
    expect(iconWrapper.tagName).toBe("SPAN");
  });

  it("supports icon slot", () => {
    render(Link);
    const link = within(screen.getByTestId("link-with-icon-slot")).getByRole(
      "link",
    );

    const iconWrapper = link.querySelector(".bx--link__icon");
    assert(iconWrapper);
    expect(iconWrapper.querySelector("svg")).toBeInTheDocument();
  });

  it.each([
    ["inline", "link-inline", "bx--link--inline"],
    ["muted", "link-muted", "bx--link--muted"],
    ["visited", "link-visited", "bx--link--visited"],
    ["large size", "link-large", "bx--link--lg"],
    ["small size", "link-small", "bx--link--sm"],
  ])("supports %s", (_, testId, expectedClass) => {
    render(Link);

    expect(within(screen.getByTestId(testId)).getByRole("link")).toHaveClass(
      expectedClass,
    );
  });

  it("supports disabled state", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.getAttribute("aria-disabled") === "true");
    assert(link);

    expect(link).toHaveClass("bx--link--disabled");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("role", "link");
  });

  it("does not call onClick when disabled", async () => {
    const onDisabledClick = vi.fn();
    render(Link, { props: { onDisabledClick } });
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.getAttribute("aria-disabled") === "true");
    assert(link);

    await user.click(link);

    expect(onDisabledClick).not.toHaveBeenCalled();
  });

  it("drops href, rel, and size classes when disabled", () => {
    render(Link);
    const link = within(screen.getByTestId("link-disabled-blank")).getByRole(
      "link",
    );

    expect(link).toHaveClass("bx--link--disabled");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).not.toHaveAttribute("href");
    expect(link).not.toHaveAttribute("rel");
    expect(link).not.toHaveClass("bx--link--lg");
  });

  it("prevents the default action when disabled", async () => {
    render(Link);
    const link = within(screen.getByTestId("link-disabled")).getByRole("link");

    // `fireEvent` returns false when a handler called `preventDefault()`.
    expect(await fireEvent.click(link)).toBe(false);
  });

  it("lets a consumer rel override the default rel", () => {
    render(Link);
    const link = within(screen.getByTestId("link-rel-override")).getByRole(
      "link",
    );

    expect(link).toHaveAttribute("rel", "nofollow");
  });

  it("forwards focus, blur, keydown, and keyup", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeydown = vi.fn();
    const onKeyup = vi.fn();
    render(Link, { props: { onFocus, onBlur, onKeydown, onKeyup } });

    const link = within(screen.getByTestId("default-link")).getByRole("link");
    link.focus();
    expect(onFocus).toHaveBeenCalledTimes(1);

    await user.keyboard("a");
    expect(onKeydown).toHaveBeenCalledTimes(1);
    expect(onKeyup).toHaveBeenCalledTimes(1);

    link.blur();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("supports click and mouse events", async () => {
    const onClick = vi.fn();
    const onMouseover = vi.fn();
    const onMouseenter = vi.fn();
    const onMouseleave = vi.fn();
    render(Link, {
      props: { onClick, onMouseover, onMouseenter, onMouseleave },
    });

    // The first link (default link) has the handlers
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links[0];
    assert(link);

    await user.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.hover(link);
    expect(onMouseover).toHaveBeenCalledTimes(1);
    expect(onMouseenter).toHaveBeenCalledTimes(1);

    await user.unhover(link);
    expect(onMouseleave).toHaveBeenCalledTimes(1);
  });

  it("adds no space after an inline link's text", () => {
    render(Link);
    const link = within(screen.getByTestId("link-inline")).getByRole("link");

    // An inline link is `display: inline`, so a trailing space is underlined.
    expect(link.textContent).toBe("Carbon Design System");
  });

  it("does not render an icon on an inline link", () => {
    render(Link);

    for (const testId of ["link-inline-icon", "link-inline-icon-slot"]) {
      const link = within(screen.getByTestId(testId)).getByRole("link");
      expect(link).toHaveClass("bx--link--inline");
      expect(link.querySelector(".bx--link__icon")).not.toBeInTheDocument();
      expect(link.querySelector("svg")).not.toBeInTheDocument();
    }
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = LinkComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = LinkComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });

    it("should expose all three size values", () => {
      type Props = ComponentProps<LinkComponent>;

      expectTypeOf<Props["size"]>().toEqualTypeOf<
        "sm" | "md" | "lg" | undefined
      >();
    });
  });
});
