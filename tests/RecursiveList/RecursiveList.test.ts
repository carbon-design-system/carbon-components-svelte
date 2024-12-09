import { render, screen } from "@testing-library/svelte";
import RecursiveListHierarchyTest from "./RecursiveList.hierarchy.test.svelte";
import RecursiveListTest from "./RecursiveList.test.svelte";

const testCases = [
  { name: "RecursiveList", component: RecursiveListTest },
  { name: "RecursiveList hierarchy", component: RecursiveListHierarchyTest },
];

describe.each(testCases)("$name", ({ component }) => {
  it("renders all top-level items", () => {
    render(component);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();

    expect(screen.getAllByRole("list")).toHaveLength(4);

    // Nested items
    expect(screen.getByText("Item 1a")).toBeInTheDocument();
  });

  it("renders HTML content", () => {
    render(component);

    const htmlContent = screen.getByText("HTML content");
    expect(htmlContent.tagName).toBe("H5");
  });

  it("renders links correctly", () => {
    render(component);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    // Link with custom text
    const customLink = screen.getByText("Link with custom text");
    expect(customLink).toHaveAttribute("href", "https://svelte.dev/");

    // Plain link
    const plainLink = links.find(
      (link) => link.textContent === "https://svelte.dev/",
    );
    expect(plainLink).toHaveAttribute("href", "https://svelte.dev/");
  });
});
