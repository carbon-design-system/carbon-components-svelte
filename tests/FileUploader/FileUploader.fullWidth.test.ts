import { render } from "@testing-library/svelte";
import FileUploaderDropContainer from "../../src/FileUploader/FileUploaderDropContainer.svelte";
import FileUploaderItem from "../../src/FileUploader/FileUploaderItem.svelte";

describe("FileUploader fullWidth", () => {
  it("lifts the width cap of a file item", () => {
    const { container } = render(FileUploaderItem, {
      name: "report.pdf",
      fullWidth: true,
    });

    expect(container.querySelector(".bx--file__selected-file")).toHaveClass(
      "bx--file__selected-file--full-width",
    );
  });

  it("lifts the width cap of the drop area", () => {
    const { container } = render(FileUploaderDropContainer, {
      labelText: "Drag files here",
      fullWidth: true,
    });

    expect(container.querySelector(".bx--file-browse-btn")).toHaveClass(
      "bx--file-browse-btn--full-width",
    );
  });
});
