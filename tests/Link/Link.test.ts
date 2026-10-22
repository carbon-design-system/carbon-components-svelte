import { render, screen, within } from "@testing-library/svelte";
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

  it("supports inline variant", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--inline"));
    assert(link);

    expect(link).toHaveClass("bx--link--inline");
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

  it("supports large size variant", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--lg"));
    assert(link);

    expect(link).toHaveClass("bx--link--lg");
  });

  it("supports small size variant", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--sm"));
    assert(link);

    expect(link).toHaveClass("bx--link--sm");
  });

  it("renders the icon at every non-inline size", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });

    const smIconLink = links.find(
      (l) =>
        l.classList.contains("bx--link--sm") &&
        l.querySelector(".bx--link__icon"),
    );
    assert(smIconLink);
    expect(smIconLink.querySelector(".bx--link__icon svg")).toBeInTheDocument();

    const lgIconLink = links.find(
      (l) =>
        l.classList.contains("bx--link--lg") &&
        l.querySelector(".bx--link__icon"),
    );
    assert(lgIconLink);
    expect(lgIconLink.querySelector(".bx--link__icon svg")).toBeInTheDocument();
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

  it("supports muted variant", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--muted"));
    assert(link);

    expect(link).toHaveClass("bx--link--muted");
  });

  it("supports visited state", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--visited"));
    assert(link);

    expect(link).toHaveClass("bx--link--visited");
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
