// @vitest-environment node

import ProgressBar from "carbon-components-svelte/ProgressBar/ProgressBar.svelte";
import { render } from "svelte/server";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(ProgressBar, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

describe("ProgressBar server render", () => {
  const props = {
    id: "upload",
    value: 40,
    labelText: "Upload",
    helperText: "40 MB",
    status: "error",
  };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the helper and status ids from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('id="upload-helper"');
    expect(html).toContain('id="upload-status"');
    expect(html).toContain('aria-describedby="upload-helper upload-status"');
  });
});
