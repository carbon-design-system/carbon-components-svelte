import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import CodeSnippetCopyButton from "./CodeSnippetCopyButton.test.svelte";
import CodeSnippetCustomEvents from "./CodeSnippetCustomEvents.test.svelte";
import CodeSnippetExpandable from "./CodeSnippetExpandable.test.svelte";
import CodeSnippetExpandedByDefault from "./CodeSnippetExpandedByDefault.svelte";
import CodeSnippetInitialEvent from "./CodeSnippetInitialEvent.test.svelte";
import CodeSnippetInline from "./CodeSnippetInline.test.svelte";
import CodeSnippetMultiline from "./CodeSnippetMultiline.test.svelte";
import CodeSnippetWithCustomCopyText from "./CodeSnippetWithCustomCopyText.test.svelte";
import CodeSnippetWithHideShowMore from "./CodeSnippetWithHideShowMore.test.svelte";
import CodeSnippetWithWrapText from "./CodeSnippetWithWrapText.test.svelte";

describe("CodeSnippet", () => {
  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2527
  test("does not fire expand/collapse event on initial render", () => {
    render(CodeSnippetInitialEvent);

    expect(screen.getByTestId("expand-event")).toHaveTextContent("false");
    expect(screen.getByTestId("collapse-event")).toHaveTextContent("false");
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2527
  test("does not fire expand/collapse event on initial render when expanded is true", () => {
    render(CodeSnippetInitialEvent, { props: { expanded: true } });

    expect(screen.getByTestId("expand-event")).toHaveTextContent("false");
    expect(screen.getByTestId("collapse-event")).toHaveTextContent("false");
  });

  test("should render inline variant", () => {
    const { container } = render(CodeSnippetInline);
    expect(container.querySelector(".bx--snippet--inline")).toBeInTheDocument();
    expect(screen.getByText("npm install -g @carbon/cli")).toBeInTheDocument();
  });

  test("should render multiline variant", () => {
    const { container } = render(CodeSnippetMultiline);
    expect(container.querySelector(".bx--snippet--multi")).toBeInTheDocument();
    expect(screen.getByText(/node -v/)).toBeInTheDocument();
  });

  test("should expand and collapse expandable snippet", async () => {
    const { container } = render(CodeSnippetExpandable);

    expect(
      container.querySelector(".bx--snippet--expand"),
    ).not.toBeInTheDocument();

    const showMoreButton = screen.getByText("Show more");
    await user.click(showMoreButton);

    expect(container.querySelector(".bx--snippet--expand")).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();

    const showLessButton = screen.getByText("Show less");
    await user.click(showLessButton);

    expect(
      container.querySelector(".bx--snippet--expand"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Show more")).toBeInTheDocument();
  });

  test("should render expanded by default", async () => {
    const { container } = render(CodeSnippetExpandedByDefault);

    expect(container.querySelector(".bx--snippet--expand")).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();

    await user.click(screen.getByText("Show less"));

    expect(
      container.querySelector(".bx--snippet--expand"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Show more")).toBeInTheDocument();
  });

  test("should copy text when copy button is clicked", async () => {
    const originalClipboard = navigator.clipboard;
    const mockClipboard = {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
    });

    const { container } = render(CodeSnippetCopyButton);

    expect(container.querySelector(".bx--snippet--single")).toBeInTheDocument();
    expect(
      screen.getByText("npm install --save @carbon/icons"),
    ).toBeInTheDocument();

    const copyButton = screen.getByLabelText("Copy to clipboard");
    assert(copyButton);

    await user.click(copyButton);
    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      "npm install --save @carbon/icons",
    );
    expect(screen.getByText("Copied!")).toBeInTheDocument();

    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
    });
  });

  test("should dispatch copy and copy error events", async () => {
    render(CodeSnippetCustomEvents);

    expect(screen.getByText("Copy events: 0")).toBeInTheDocument();

    const copyButton = screen.getByLabelText("Copy to clipboard");
    await user.click(copyButton);
    expect(screen.getByText("Copy events: 1")).toBeInTheDocument();
  });

  test("should wrap text when wrapText is true", () => {
    const { container } = render(CodeSnippetWithWrapText);
    expect(
      container.querySelector(".bx--snippet--wraptext"),
    ).toBeInTheDocument();
  });

  test("should hide show more button when hideShowMore is true", () => {
    render(CodeSnippetWithHideShowMore);
    expect(screen.queryByText("Show more")).not.toBeInTheDocument();
  });

  test("should display custom copy text", async () => {
    render(CodeSnippetWithCustomCopyText);

    const copyButton = screen.getByLabelText("Copy to clipboard");
    await user.click(copyButton);
    expect(screen.getByText("Custom copied text!")).toBeInTheDocument();
  });
});
