// @vitest-environment node
import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
import { render } from "svelte/server";
import { renderSSR } from "../utils/ssr";

describe("FileUploader server render", () => {
  const props = { id: "docs", labelTitle: "Upload", buttonLabel: "Add file" };

  it("renders identical markup for an explicit id", () => {
    const renderRaw = () => render(FileUploader, { props }).body;

    expect(renderRaw()).toBe(renderRaw());
  });

  it("derives the file input id from the id", () => {
    const { document } = renderSSR(FileUploader, props);

    expect(document.querySelector(".bx--form-item")).toHaveAttribute(
      "id",
      "docs",
    );
    expect(document.querySelector('input[type="file"]')).toHaveAttribute(
      "id",
      "docs-input",
    );
  });
});
