import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FileUploaderSkeleton from "./FileUploaderSkeleton.test.svelte";
import FileUploaderSkeletonEvents from "./FileUploaderSkeletonEvents.test.svelte";

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

  it("does not forward click but forwards mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(FileUploaderSkeletonEvents);

    const element = screen.getByTestId("file-uploader-skeleton");

    await user.click(element);
    expect(consoleLog).not.toHaveBeenCalledWith("click");

    await user.hover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });
});
