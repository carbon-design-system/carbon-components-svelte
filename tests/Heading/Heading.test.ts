import { render, screen } from "@testing-library/svelte";
import HeadingTest from "./Heading.test.svelte";

describe("Heading", () => {
  it("should render as h1 by default inside a Section", () => {
    render(HeadingTest);

    const heading = screen.getByText("Default Heading 1");
    expect(heading.tagName).toBe("H1");
  });

  it("should render as h1 when not inside a Section", () => {
    render(HeadingTest);

    const heading = screen.getByText("Heading without Section");
    expect(heading.tagName).toBe("H1");
  });

  it("should increment heading levels in nested sections", () => {
    render(HeadingTest);

    expect(screen.getByText("Nested Heading 1").tagName).toBe("H1");
    expect(screen.getByText("Nested Heading 2").tagName).toBe("H2");
    expect(screen.getByText("Nested Heading 3").tagName).toBe("H3");
    expect(screen.getByText("Nested Heading 4").tagName).toBe("H4");
    expect(screen.getByText("Nested Heading 5").tagName).toBe("H5");
    expect(screen.getByText("Nested Heading 6").tagName).toBe("H6");
  });

  it("should cap heading level at h6", () => {
    render(HeadingTest);

    const cappedHeading = screen.getByText("Nested Capped at Heading 6");
    expect(cappedHeading.tagName).toBe("H6");
  });

  it("should reset heading level for sibling sections", () => {
    render(HeadingTest);

    const siblingHeading = screen.getByText("Sibling Heading 2");
    expect(siblingHeading.tagName).toBe("H2");
  });

  it("should start at custom level when level prop is specified", () => {
    render(HeadingTest);

    const customHeading = screen.getByText("Custom Level Heading 5");
    expect(customHeading.tagName).toBe("H5");
  });

  it("should increment from custom level in nested sections", () => {
    render(HeadingTest);

    const nestedHeading = screen.getByText("Custom Level Heading 6");
    expect(nestedHeading.tagName).toBe("H6");
  });

  it("should cap at h6 even when starting from custom level", () => {
    render(HeadingTest);

    const cappedHeading = screen.getByText("Custom Level Capped at Heading 6");
    expect(cappedHeading.tagName).toBe("H6");
  });
});

describe("Section", () => {
  it("should render as section element by default", () => {
    const { container } = render(HeadingTest);

    const sections = container.querySelectorAll("section");
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].tagName).toBe("SECTION");
  });

  it("should render as custom tag when tag prop is specified", () => {
    render(HeadingTest);

    const wrapper = screen.getByTestId("custom-tag-wrapper");
    const customSection = wrapper.querySelector("div");
    expect(customSection).toBeTruthy();
    expect(customSection?.tagName).toBe("DIV");
    expect(customSection).toHaveTextContent("Custom Tag Heading 1");
  });

  it("should provide context for nested headings", () => {
    render(HeadingTest);

    const heading1 = screen.getByText("Nested Heading 1");
    const heading2 = screen.getByText("Nested Heading 2");
    expect(heading1.tagName).toBe("H1");
    expect(heading2.tagName).toBe("H2");

    // Verify heading2 is nested inside a section that is a child of heading1's section
    const section1 = heading1.closest("section");
    const section2 = heading2.closest("section");
    expect(section1).toBeTruthy();
    expect(section2).toBeTruthy();
    expect(section1?.contains(section2)).toBe(true);
  });
});
