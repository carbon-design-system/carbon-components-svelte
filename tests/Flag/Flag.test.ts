import { render } from "@testing-library/svelte";
import Flag from "carbon-components-svelte/Flag/Flag.svelte";
import { FR, JP } from "carbon-components-svelte/flags/index.js";

describe("Flag", () => {
  it("draws the flag's paths in a 4:3 box of the given width", () => {
    const { container } = render(Flag, { props: { flag: FR, size: 24 } });
    const svg = container.querySelector("svg");
    assert(svg);

    expect(svg).toHaveAttribute("viewBox", "0 0 32 24");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "18");
    expect(svg).toHaveClass("bx--flag", "bx--flag--24");
    // Blue, white and red bands: three paths in a crisp-edge group.
    expect(
      [...svg.querySelectorAll("path")].map((path) =>
        path.getAttribute("fill"),
      ),
    ).toEqual(["#00539a", "#fff", "#da1e28"]);
    // `{@html}` inside an svg must make svg elements, or nothing paints. Svelte
    // 3 and 4 build them through a different path from Svelte 5.
    for (const path of svg.querySelectorAll("path")) {
      expect(path.namespaceURI).toBe("http://www.w3.org/2000/svg");
    }
  });

  it("hides the flag from assistive technology unless it has a name", async () => {
    const { container, rerender } = render(Flag, { props: { flag: JP } });

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector("svg")).not.toHaveAttribute("role");

    await rerender({ title: "Japan" });

    const svg = container.querySelector("svg");
    expect(svg).not.toHaveAttribute("aria-hidden");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg?.querySelector("title")).toHaveTextContent("Japan");
  });

  it("draws the code in a box of the same size when there is no flag", () => {
    const { container } = render(Flag, { props: { code: "xk", size: 32 } });
    const badge = container.querySelector(".bx--flag--badge");

    expect(container.querySelector("svg")).toBeNull();
    expect(badge).toHaveTextContent("xk");
    expect(badge).toHaveClass("bx--flag--32");
    expect(badge).toHaveAttribute("aria-hidden", "true");
  });

  it("forwards attributes to the svg", () => {
    const { container } = render(Flag, {
      props: { flag: JP, "data-testid": "flag", "aria-label": "Japan" },
    });
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("data-testid", "flag");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).not.toHaveAttribute("aria-hidden");
  });
});
