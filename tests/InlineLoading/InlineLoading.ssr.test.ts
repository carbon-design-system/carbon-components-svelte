// @vitest-environment node
import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
import { renderSSR } from "../utils/ssr";

describe("InlineLoading server render", () => {
  it("renders a waiting spinner when active with a delay", () => {
    const { document } = renderSSR(InlineLoading, {
      description: "Saving",
      delay: 300,
    });
    const container = document.querySelector(".bx--inline-loading");

    expect(container).toHaveClass("bx--inline-loading--delayed");
    expect(container).toHaveStyle({ animationDuration: "300ms" });
    expect(container?.querySelector(".bx--loading")).not.toHaveClass(
      "bx--loading--stop",
    );
    expect(container).toHaveTextContent("Saving");
  });

  it("renders the spinner shown with no delay", () => {
    const { document } = renderSSR(InlineLoading, { description: "Saving" });
    const container = document.querySelector(".bx--inline-loading");

    expect(container).toHaveClass("bx--inline-loading");
    expect(container).not.toHaveClass("bx--inline-loading--delayed");
    expect(container).not.toHaveAttribute("style");
  });

  it.each(["inactive", "finished", "error"] as const)(
    "renders %s at once with a delay",
    (status) => {
      const { document } = renderSSR(InlineLoading, { status, delay: 300 });
      const container = document.querySelector(".bx--inline-loading");

      expect(container).toHaveClass("bx--inline-loading");
      expect(container).not.toHaveClass("bx--inline-loading--delayed");
    },
  );
});
