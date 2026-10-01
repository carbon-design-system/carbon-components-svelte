// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import FloatingPortal from "./FloatingPortal.test.svelte";

describe("FloatingPortal server render", () => {
  it("renders its content while open", () => {
    const { document } = renderSSR(FloatingPortal, { open: true });

    expect(document.body).toHaveTextContent("Floating content");
  });
});
