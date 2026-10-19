import { render } from "@testing-library/svelte";
import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";

describe("FileUploader xs size", () => {
  it("sizes the button and the file rows", () => {
    const { container } = render(FileUploader, {
      props: {
        size: "xs",
        files: [new File(["x"], "invoice.png"), new File(["y"], "receipt.png")],
      },
    });

    expect(container.querySelector(".bx--btn")).toHaveClass("bx--btn--xs");
    const rows = container.querySelectorAll(".bx--file__selected-file");
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toHaveClass("bx--file__selected-file--xs");
    }
  });

  it("leaves rows at the default height for other sizes", () => {
    const { container } = render(FileUploader, {
      props: { files: [new File(["x"], "invoice.png")] },
    });

    expect(container.querySelector(".bx--file__selected-file")).not.toHaveClass(
      "bx--file__selected-file--xs",
    );
  });
});
