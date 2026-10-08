import { render, screen } from "@testing-library/svelte";
import FileUploaderFormSize from "./FileUploader.formSize.test.svelte";

const BUTTON_SIZE_CLASSES = [
  "bx--btn--xs",
  "bx--btn--sm",
  "bx--btn--field",
  "bx--btn--lg",
  "bx--btn--xl",
];

describe("FileUploader in a sized Form", () => {
  it("keeps the small button when the form has no size", () => {
    render(FileUploaderFormSize);

    expect(screen.getByRole("button", { name: "Add files" })).toHaveClass(
      "bx--btn--sm",
    );
    expect(screen.getByRole("button", { name: "Add one file" })).toHaveClass(
      "bx--btn--sm",
    );
  });

  it.each([
    ["xs", "bx--btn--xs"],
    ["sm", "bx--btn--sm"],
  ] as const)("matches a %s form with %s", (size, className) => {
    render(FileUploaderFormSize, { props: { size } });

    expect(screen.getByRole("button", { name: "Add files" })).toHaveClass(
      className,
    );
    expect(screen.getByRole("button", { name: "Add one file" })).toHaveClass(
      className,
    );
  });

  it("uses the default 48px button in an xl form", () => {
    render(FileUploaderFormSize, { props: { size: "xl" } });

    const button = screen.getByRole("button", { name: "Add files" });
    for (const className of BUTTON_SIZE_CLASSES) {
      expect(button).not.toHaveClass(className);
    }
  });

  it("makes file rows extra small in an xs form", async () => {
    const { container } = render(FileUploaderFormSize, {
      props: { size: "xs", files: [new File(["a"], "a.txt")] },
    });

    await screen.findByText("a.txt");
    expect(container.querySelector(".bx--file__selected-file")).toHaveClass(
      "bx--file__selected-file--xs",
    );
  });

  it("lets the button's own size win", () => {
    render(FileUploaderFormSize, { props: { size: "xs" } });

    const button = screen.getByRole("button", { name: "Add a large file" });
    expect(button).toHaveClass("bx--btn--lg");
    expect(button).not.toHaveClass("bx--btn--xs");
  });
});
