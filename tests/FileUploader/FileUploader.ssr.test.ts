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

    const { document } = renderSSR(FileUploader, invalidProps);
    expect(document.querySelector(".bx--file-close")).toHaveAttribute(
      "aria-describedby",
      "docs-error-0",
    );
    expect(document.getElementById("docs-error-0")).toHaveTextContent(
      "File too large",
    );
  });
});
