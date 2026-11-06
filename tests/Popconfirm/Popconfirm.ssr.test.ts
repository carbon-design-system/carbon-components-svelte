// @vitest-environment node
import Popconfirm from "carbon-components-svelte/Popconfirm/Popconfirm.svelte";
import { renderRaw } from "../utils/ssr";

describe("Popconfirm server render", () => {
  it("derives the dialog ids from the id and names the dialog", () => {
    const html = renderRaw(Popconfirm, {
      id: "pc",
      open: true,
      title: "Delete this row?",
      description: "You can't undo this.",
    });

    expect(html).toContain('id="pc"');
    expect(html).toContain('id="pc-dialog"');
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-labelledby="pc-title"');
    expect(html).toContain('aria-describedby="pc-description"');
    expect(html).toContain("Delete this row?");
  });

  it("renders closed without touching the document", () => {
    const html = renderRaw(Popconfirm, { title: "Delete?" });

    expect(html).not.toContain("bx--popover--open");
  });
});
