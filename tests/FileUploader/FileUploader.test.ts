import { render, screen } from "@testing-library/svelte";
import FileUploaderTest from "./FileUploader.test.svelte";

describe("FileUploader", () => {
  it("renders with default props", () => {
    render(FileUploaderTest);
    const uploader = screen.getByTestId("file-uploader");
    expect(uploader).toBeInTheDocument();
    expect(uploader).toHaveClass("bx--form-item");
  });

  it("renders with custom labels", () => {
    render(FileUploaderTest, {
      labelTitle: "Custom Title",
      labelDescription: "Custom Description",
      buttonLabel: "Custom Button",
    });

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom Description")).toBeInTheDocument();
    expect(screen.getByText("Custom Button")).toBeInTheDocument();
  });

  it("renders with disabled state", () => {
    render(FileUploaderTest, { disabled: true });
    const button = screen.getByLabelText("Add File");
    expect(button).toHaveAttribute("disabled");
  });
});
