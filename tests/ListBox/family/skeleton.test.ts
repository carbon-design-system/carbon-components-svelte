import { render, screen } from "@testing-library/svelte";
import { cases, type ListBoxCase } from "./cases";

const skeletons = cases.flatMap((c) =>
  c.skeleton ? [[c.name, c.skeleton] as const] : [],
);

const renderSkeleton = (
  component: NonNullable<ListBoxCase["skeleton"]>["component"],
  props: Record<string, unknown> = {},
) => {
  render(component, { props: { "data-testid": "skeleton", ...props } });
  return screen.getByTestId("skeleton");
};

describe.each(skeletons)("%s skeletons", (_, skeleton) => {
  it("draws a label bar above the field placeholder", () => {
    const root = renderSkeleton(skeleton.component);

    expect(root).toHaveClass("bx--list-box__wrapper", "bx--form-item");
    expect(root.children).toHaveLength(2);
    expect(root.children[0]).toHaveClass("bx--label", "bx--skeleton");
    expect(root.children[1]).toHaveClass(
      "bx--skeleton",
      skeleton.className,
      "bx--list-box",
    );
    expect(root.children[1].children[0]).toHaveClass("bx--list-box__field");
  });

  it("leaves the label bar out with hideLabel", () => {
    const root = renderSkeleton(skeleton.component, { hideLabel: true });

    expect(root.querySelector(".bx--label")).toBeNull();
    expect(root.children).toHaveLength(1);
  });

  it.each(["xs", "sm", "lg", "xl"] as const)(
    "applies the %s size modifier",
    (size) => {
      const root = renderSkeleton(skeleton.component, { size });
      expect(root.querySelector(`.${skeleton.className}`)).toHaveClass(
        `bx--list-box--${size}`,
      );
    },
  );

  it("renders a fluid label and field placeholder", () => {
    const root = renderSkeleton(skeleton.fluid);

    expect(root).toHaveClass("bx--list-box__wrapper--fluid");
    expect(root.children).toHaveLength(1);

    const listBox = root.children[0];
    expect(listBox).toHaveClass("bx--skeleton", "bx--list-box");
    expect(listBox.children).toHaveLength(2);
    expect(listBox.children[0]).toHaveClass("bx--list-box__label");
    expect(listBox.children[1]).toHaveClass("bx--list-box__field");
  });
});
