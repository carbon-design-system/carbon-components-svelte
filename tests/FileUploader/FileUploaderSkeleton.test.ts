import { render } from "@testing-library/svelte";
import FileUploaderSkeleton from "./FileUploaderSkeleton.test.svelte";

describe("FileUploaderSkeleton", () => {
  it("renders the label lines and the button", () => {
    const { container } = render(FileUploaderSkeleton);

    expect(container.querySelector(".bx--file--label")).toBeInTheDocument();
    expect(
      container.querySelector(".bx--label-description"),
    ).toBeInTheDocument();
    expect(container.querySelector(".bx--btn.bx--skeleton")).toHaveClass(
      "bx--btn--sm",
    );
  });

  it.each([
    ["hideLabelTitle", ".bx--file--label", ".bx--label-description"],
    ["hideLabelDescription", ".bx--label-description", ".bx--file--label"],
  ])("hides one label line with %s", (prop, hidden, kept) => {
    const { container } = render(FileUploaderSkeleton, {
      props: { [prop]: true },
    });

    expect(container.querySelector(hidden)).not.toBeInTheDocument();
    expect(container.querySelector(kept)).toBeInTheDocument();
  });

  it("sizes the button to a Form with a size", () => {
    const { container } = render(FileUploaderSkeleton, {
      props: { formSize: "xs" },
    });

    expect(container.querySelector(".bx--btn.bx--skeleton")).toHaveClass(
      "bx--btn--xs",
    );
  });

  it("lets its own size win over the Form", () => {
    const { container } = render(FileUploaderSkeleton, {
      props: { formSize: "xs", size: "lg" },
    });

    const button = container.querySelector(".bx--btn.bx--skeleton");
    expect(button).toHaveClass("bx--btn--lg");
    expect(button).not.toHaveClass("bx--btn--xs");
  });
});
