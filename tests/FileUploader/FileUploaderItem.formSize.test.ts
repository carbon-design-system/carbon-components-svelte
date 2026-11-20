import { render } from "@testing-library/svelte";
import FileUploaderItemFormSize from "./FileUploaderItem.formSize.test.svelte";

const SIZE_CLASSES = [
  "bx--file__selected-file--xs",
  "bx--file__selected-file--sm",
  "bx--file__selected-file--md",
];

function item(container: HTMLElement) {
  const el = container.querySelector("#item");
  if (!el) throw new Error("no item");
  return el;
}

describe("FileUploaderItem in a sized Form", () => {
  it.each([
    ["outside a Form", { inForm: false }],
    ["in a Form without a size", {}],
    ["in an xl form", { formSize: "xl" as const }],
    ["in an lg form", { formSize: "lg" as const }],
  ])("is the default 48px row %s", (_, props) => {
    const { container } = render(FileUploaderItemFormSize, { props });

    for (const className of SIZE_CLASSES) {
      expect(item(container)).not.toHaveClass(className);
    }
  });

  it.each([
    ["xs", "bx--file__selected-file--xs"],
    ["sm", "bx--file__selected-file--sm"],
    ["md", "bx--file__selected-file--md"],
  ] as const)("matches a %s form with %s", (formSize, className) => {
    const { container } = render(FileUploaderItemFormSize, {
      props: { formSize },
    });

    expect(item(container)).toHaveClass(className);
  });

  it("lets the item's own size win", () => {
    const { container } = render(FileUploaderItemFormSize, {
      props: { formSize: "xs", size: "lg" },
    });

    for (const className of SIZE_CLASSES) {
      expect(item(container)).not.toHaveClass(className);
    }
  });
});
