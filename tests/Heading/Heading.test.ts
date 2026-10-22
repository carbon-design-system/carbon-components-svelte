import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeadingTest from "./Heading.test.svelte";
import SectionLevelChange from "./SectionLevelChange.test.svelte";

describe("Heading", () => {
  it.each([
    ["Heading without Section", "H1"],
    ["Nested Heading 1", "H1"],
    ["Nested Heading 2", "H2"],
    ["Nested Heading 3", "H3"],
    ["Nested Heading 4", "H4"],
    ["Nested Heading 5", "H5"],
    ["Nested Heading 6", "H6"],
    ["Nested Capped at Heading 6", "H6"],
    ["Sibling Heading 2", "H2"],
    ["Custom Level Heading 5", "H5"],
    ["Reset Heading 1", "H1"],
    ["Overflow Level Heading 6", "H6"],
  ])("should render %s as %s", (text, tagName) => {
    render(HeadingTest);

    expect(screen.getByText(text).tagName).toBe(tagName);
  });

  it("should render the semantic level from Section with a size class", () => {
    render(HeadingTest);

    const heading = screen.getByText("Sized heading");
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveClass("bx--type-heading-03");
  });

  it("should not add a type class when type is unset", () => {
    render(HeadingTest);

    const heading = screen.getByText("Heading without Section");
    expect(heading.className).not.toMatch(/bx--type-/);
  });
});

describe("Section", () => {
  it("should render as custom tag when tag prop is specified", () => {
    render(HeadingTest);

    const wrapper = screen.getByTestId("custom-tag-wrapper");
    const customSection = wrapper.querySelector("div");
    expect(customSection).toBeTruthy();
    expect(customSection?.tagName).toBe("DIV");
    expect(customSection).toHaveTextContent("Custom Tag Heading 1");
  });

  it("forwards rest props to the section element", () => {
    render(HeadingTest);

    const region = screen.getByRole("region", {
      name: "Labelled Section Heading 1",
    });
    expect(region.tagName).toBe("SECTION");
    expect(region).toHaveClass("labelled-section");
  });

  it("should provide context for nested headings", () => {
    render(HeadingTest);

    const heading1 = screen.getByText("Nested Heading 1");
    const heading2 = screen.getByText("Nested Heading 2");
    expect(heading1.tagName).toBe("H1");
    expect(heading2.tagName).toBe("H2");

    const section1 = heading1.closest("section");
    const section2 = heading2.closest("section");
    expect(section1).toBeTruthy();
    expect(section2).toBeTruthy();
    expect(section1?.contains(section2)).toBe(true);
  });

  it("updates heading levels when a Section's level changes", async () => {
    render(SectionLevelChange);
    expect(screen.getByText("Outer").tagName).toBe("H1");
    expect(screen.getByText("Inner").tagName).toBe("H2");

    await user.click(screen.getByRole("button", { name: "Set level 3" }));

    expect(screen.getByText("Outer").tagName).toBe("H3");
    expect(screen.getByText("Inner").tagName).toBe("H4");
  });
});
