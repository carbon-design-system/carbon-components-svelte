import { render, screen } from "@testing-library/svelte";
import HeadingType from "./Heading.type.test.svelte";

describe("Heading type", () => {
  it("should render the semantic level from Section with a size class", () => {
    render(HeadingType);

    const heading = screen.getByText("Sized heading");
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveClass("bx--type-productive-heading-03");
  });

  it("should not add a type class when type is unset", () => {
    render(HeadingType);

    const heading = screen.getByText("Unsized heading");
    expect(heading.className).not.toMatch(/bx--type-/);
  });
});
