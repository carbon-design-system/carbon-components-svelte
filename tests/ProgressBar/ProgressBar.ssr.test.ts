// @vitest-environment node

import ProgressBar from "carbon-components-svelte/ProgressBar/ProgressBar.svelte";
import { renderRaw } from "../utils/ssr";

describe("ProgressBar server render", () => {
  const props = {
    id: "upload",
    value: 40,
    labelText: "Upload",
    helperText: "40 MB",
    status: "error" as const,
  };

  it("derives the helper and status ids from the id", () => {
    const html = renderRaw(ProgressBar, props);

    expect(html).toContain('id="upload-helper"');
    expect(html).toContain('id="upload-status"');
    expect(html).toContain('aria-describedby="upload-helper upload-status"');
  });
});
