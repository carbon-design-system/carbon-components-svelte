import { render, screen } from "@testing-library/svelte";
import RecursiveList from "carbon-components-svelte/RecursiveList/RecursiveList.svelte";

describe("RecursiveList item props", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Svelte 3 and 4 warn in dev when a component receives a prop it does not
  // declare, such as `nodes` or `id` spread from a node onto `RecursiveListItem`.
  it("does not pass undeclared node props to RecursiveListItem", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(RecursiveList, {
      nodes: [
        {
          id: "parent",
          text: "Parent",
          nodes: [{ id: "child", text: "Child", href: "https://svelte.dev/" }],
        },
        { id: "leaf", text: "Leaf" },
      ],
    });

    expect(screen.getByText("Parent")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(screen.getByText("Leaf")).toBeInTheDocument();

    const unknownPropWarnings = warn.mock.calls.filter(([message]) =>
      String(message).includes("unknown prop"),
    );
    expect(unknownPropWarnings).toEqual([]);
  });
});
