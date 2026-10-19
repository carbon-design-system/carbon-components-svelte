// @vitest-environment node
import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
import { render } from "svelte/server";

describe("FileUploader server render", () => {
  const props = { id: "docs", labelTitle: "Upload", buttonLabel: "Add file" };

  it("renders identical markup for an explicit id", () => {
    const renderRaw = () => render(FileUploader, { props }).body;

    expect(renderRaw()).toBe(renderRaw());
  });
});
