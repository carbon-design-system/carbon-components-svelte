// @vitest-environment node
import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
import { render } from "svelte/server";

describe("FileUploader server render", () => {
  const props = { id: "docs", labelTitle: "Upload", buttonLabel: "Add file" };

  it("renders identical markup for an explicit id", () => {
    const renderRaw = () => render(FileUploader, { props }).body;

    expect(renderRaw()).toBe(renderRaw());
  });

  it("derives invalid rows' error ids from the id", () => {
    const invalidProps = {
      ...props,
      status: "edit" as const,
      files: [new File(["x"], "bad.txt")],
      fileInvalid: () => true,
      fileErrorSubject: () => "File too large",
    };
    const renderRaw = () => render(FileUploader, { props: invalidProps }).body;

    expect(renderRaw()).toBe(renderRaw());
    expect(renderRaw()).toContain('aria-describedby="docs-error-0"');
    expect(renderRaw()).toContain('id="docs-error-0"');
  });
});
