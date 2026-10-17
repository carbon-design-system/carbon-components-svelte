import { render, screen } from "@testing-library/svelte";
import { cases } from "./cases";

const skeletonCases = cases.flatMap((c) =>
  c.fluidSkeleton ? [[c.name, c.fluidSkeleton] as const] : [],
);

describe.each(skeletonCases)("%s fluid skeleton", (_, skeleton) => {
  it("renders a label placeholder and a field placeholder", () => {
    render(skeleton.component, { props: { "data-testid": "skeleton" } });

    const root = screen.getByTestId("skeleton");
    expect(root).toHaveClass("bx--form-item", skeleton.className);
    expect(root.children).toHaveLength(2);
    expect(root.children[0]).toHaveClass("bx--label", "bx--skeleton");
    expect(root.children[1]).toHaveClass("bx--skeleton", skeleton.field);
  });
});
