import { render, screen } from "@testing-library/svelte";
import Swatch from "carbon-components-svelte/Tag/Swatch.svelte";
import { getAvatarBackgroundColor } from "../../src/utils/avatar-color.js";

const dot = (container: HTMLElement) => {
  const el = container.querySelector(".bx--swatch");
  assert(el instanceof HTMLElement);
  return el;
};

describe("Swatch", () => {
  it("paints the palette color, blue by default", async () => {
    const { container, rerender } = render(Swatch);
    expect(dot(container)).toHaveClass("bx--swatch--blue");

    await rerender({ color: "teal" });
    expect(dot(container)).toHaveClass("bx--swatch--teal");
  });

  it("hashes colorKey to the color getAvatarBackgroundColor picks", () => {
    for (const key of ["Platform", "Design", "Billing", "Security", "Data"]) {
      const { container, unmount } = render(Swatch, {
        props: { colorKey: key },
      });
      expect(dot(container)).toHaveClass(
        `bx--swatch--${getAvatarBackgroundColor(key)}`,
      );
      unmount();
    }
  });

  it("gives the same color for the same key across renders", () => {
    const first = render(Swatch, { props: { colorKey: "Platform" } });
    const second = render(Swatch, { props: { colorKey: "Platform" } });
    expect(dot(first.container).className).toBe(
      dot(second.container).className,
    );
  });

  it("lets colorKey win over color, and an empty key fall back to it", async () => {
    const key = "Platform";
    const picked = getAvatarBackgroundColor(key);
    // The hash never picks gray.
    const other = "gray";
    const { container, rerender } = render(Swatch, {
      props: { colorKey: key, color: other },
    });
    expect(dot(container)).toHaveClass(`bx--swatch--${picked}`);
    expect(dot(container)).not.toHaveClass(`bx--swatch--${other}`);

    await rerender({ colorKey: "", color: other });
    expect(dot(container)).toHaveClass(`bx--swatch--${other}`);
  });

  it("sets --ccs-swatch-color from cssColor", () => {
    const { container } = render(Swatch, { props: { cssColor: "#ff00aa" } });
    expect(dot(container).style.getPropertyValue("--ccs-swatch-color")).toBe(
      "#ff00aa",
    );
  });

  it("hides itself unless it has a label", async () => {
    const { container, rerender } = render(Swatch);
    expect(dot(container)).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    await rerender({ label: "Platform team" });
    expect(screen.getByRole("img", { name: "Platform team" })).toBe(
      dot(container),
    );
    expect(dot(container)).not.toHaveAttribute("aria-hidden");
  });

  it("renders the small size", () => {
    const { container } = render(Swatch, { props: { size: "sm" } });
    expect(dot(container)).toHaveClass("bx--swatch--sm");
  });
});
