// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ErrorBoundary from "./ErrorBoundary.test.svelte";

describe("ErrorBoundary server render", () => {
  it("renders its content and no fallback", () => {
    const { document } = renderSSR(ErrorBoundary);

    expect(document.querySelector('[data-testid="child"]')?.textContent).toBe(
      "Child content",
    );
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });
});
