// @vitest-environment node
import Coachmark from "carbon-components-svelte/Coachmark/Coachmark.svelte";
import { renderRaw } from "../utils/ssr";

describe("Coachmark server render", () => {
  it("renders the open dialog named by an existing heading", () => {
    const html = renderRaw(Coachmark, {
      id: "tip",
      titleText: "Export",
      open: true,
    });

    expect(html).toContain('role="dialog"');
    expect(html).toContain('id="tip-content"');
    expect(html).toContain('aria-labelledby="tip-title"');
    expect(html).toContain('id="tip-title"');
    expect(html).toContain('aria-controls="tip-content"');
    expect(html).toContain("bx--popover--open");
  });

  it("renders only the beacon and a closed dialog by default", () => {
    const html = renderRaw(Coachmark, { id: "tip", titleText: "Export" });

    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("bx--popover--open");
  });
});
