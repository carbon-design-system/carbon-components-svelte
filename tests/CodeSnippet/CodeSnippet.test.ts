import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
import {
  mockSnippetOverflowHeight,
  waitForSnippetMeasurement,
} from "../utils/mockSnippetOverflowHeight";
import { user } from "../utils/user";
import CodeSnippetAsync from "./CodeSnippetAsync.test.svelte";
import CodeSnippetAsyncDoubleClick from "./CodeSnippetAsyncDoubleClick.test.svelte";
import CodeSnippetBindShowMoreLess from "./CodeSnippetBindShowMoreLess.test.svelte";
import CodeSnippetCopyButton from "./CodeSnippetCopyButton.test.svelte";
import CodeSnippetCopyButtonMouseEnter from "./CodeSnippetCopyButtonMouseEnter.test.svelte";
import CodeSnippetCopyButtonMouseLeave from "./CodeSnippetCopyButtonMouseLeave.test.svelte";
import CodeSnippetCopyError from "./CodeSnippetCopyError.test.svelte";
import CodeSnippetCopyRef from "./CodeSnippetCopyRef.test.svelte";
import CodeSnippetCustomEvents from "./CodeSnippetCustomEvents.test.svelte";
import CodeSnippetDisabled from "./CodeSnippetDisabled.test.svelte";
import CodeSnippetDoubleClick from "./CodeSnippetDoubleClick.test.svelte";
import CodeSnippetExpandable from "./CodeSnippetExpandable.test.svelte";
import CodeSnippetExpandedByDefault from "./CodeSnippetExpandedByDefault.svelte";
import CodeSnippetInitialEvent from "./CodeSnippetInitialEvent.test.svelte";
import CodeSnippetInline from "./CodeSnippetInline.test.svelte";
import CodeSnippetMouseEnter from "./CodeSnippetMouseEnter.test.svelte";
import CodeSnippetMultiline from "./CodeSnippetMultiline.test.svelte";
import CodeSnippetNullishAriaLabel from "./CodeSnippetNullishAriaLabel.test.svelte";
import CodeSnippetRestPropsButton from "./CodeSnippetRestPropsButton.test.svelte";
import CodeSnippetRestPropsSingle from "./CodeSnippetRestPropsSingle.test.svelte";
import CodeSnippetRestPropsSpan from "./CodeSnippetRestPropsSpan.test.svelte";
import CodeSnippetWithCustomCopyText from "./CodeSnippetWithCustomCopyText.test.svelte";
import CodeSnippetWithHideShowMore from "./CodeSnippetWithHideShowMore.test.svelte";
import CodeSnippetWithWrapText from "./CodeSnippetWithWrapText.test.svelte";
import CodeSnippetWrapperMouseEnter from "./CodeSnippetWrapperMouseEnter.test.svelte";

describe("CodeSnippet", () => {
  afterEach(() => {
    for (const portal of document.querySelectorAll("[data-floating-portal]")) {
      portal.remove();
    }
  });

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

  // Inline copy button defaults its accessible name to "Copy code"
  // so AT users don't hear the full snippet read as the button name.
  test("inline copy button has default 'Copy code' aria-label", () => {
    render(CodeSnippetInline);
    expect(screen.getByLabelText("Copy code")).toBeInTheDocument();
  });

  test.each([
    {
      variant: "inline",
      label: "Copy code",
      code: "npm install -g @carbon/cli",
    },
    {
      variant: "single",
      label: "Copy to clipboard",
      code: "npm install --save @carbon/icons",
    },
    {
      variant: "multi",
      label: "Copy to clipboard",
      code: `node -v
npm -v
yarn -v`,
    },
  ] as const)("should not copy again on $variant snippet while feedback is active", async ({
    variant,
    label,
    code,
  }) => {
    const copy = vi.fn();
    render(CodeSnippetDoubleClick, {
      props: { type: variant, code, copy },
    });

    await user.dblClick(screen.getByLabelText(label));

    expect(copy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Copy events: 1")).toBeInTheDocument();
  });

  const snippetVariants = [
    { type: "single" as const, label: "Copy to clipboard" },
    { type: "inline" as const, label: "Copy code" },
    { type: "multi" as const, label: "Copy to clipboard" },
  ];

  it.each(
    snippetVariants,
  )("async copy delays feedback until resolved ($type)", async ({
    type,
    label,
  }) => {
    let resolveCopy: () => void = () => {};
    const copy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    render(CodeSnippetAsync, { props: { type, copy } });

    const button = screen.getByLabelText(label);
    fireEvent.click(button);
    await Promise.resolve();

    expect(copy).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).not.toHaveClass("bx--copy-btn--fade-in");

    resolveCopy();
    await waitFor(() => {
      expect(button).toHaveClass("bx--copy-btn--fade-in");
    });

    expect(button).not.toHaveAttribute("aria-busy");
    // Feedback is portalled by default.
    const portal = document.querySelector("[data-floating-portal]");
    expect(
      portal?.querySelector(".bx--tooltip-portal__content"),
    ).toHaveTextContent("Copied!");
  });

  it.each(
    snippetVariants,
  )("forwards tooltipPosition to the portalled feedback tooltip ($type)", async ({
    type,
    label,
  }) => {
    render(CodeSnippetAsync, {
      props: { type, copy: () => Promise.resolve(), tooltipPosition: "right" },
    });

    const button = screen.getByLabelText(label);
    await user.click(button);

    await waitFor(() => {
      const portal = document.querySelector("[data-floating-portal]");
      expect(portal).toHaveAttribute("data-floating-direction", "right");
    });
  });

  it.each(
    snippetVariants,
  )("async copy failure does not show feedback ($type)", async ({
    type,
    label,
  }) => {
    const error = new Error("copy failed");
    const copy = vi.fn().mockRejectedValue(error);
    const onCopyError = vi.fn();

    render(CodeSnippetAsync, {
      props: { type, copy, onCopyError },
    });

    const button = screen.getByLabelText(label);
    await user.click(button);

    expect(onCopyError).toHaveBeenCalledWith({ error });
    expect(button).not.toHaveClass("bx--copy-btn--fade-in");
  });

  it.each(
    snippetVariants,
  )("dispatches copy event after async copy resolves ($type)", async ({
    type,
    label,
  }) => {
    const order: string[] = [];
    let resolveCopy: () => void = () => {};
    const copy = vi.fn(async () => {
      order.push("copyStart");
      await new Promise<void>((resolve) => {
        resolveCopy = resolve;
      });
      order.push("copyEnd");
    });

    render(CodeSnippetAsync, {
      props: {
        type,
        copy,
        onCopy: () => {
          order.push("copyEvent");
        },
      },
    });

    const button = screen.getByLabelText(label);
    fireEvent.click(button);
    await Promise.resolve();

    expect(order).toEqual(["copyStart"]);

    resolveCopy();
    await waitFor(() => {
      expect(order).toEqual(["copyStart", "copyEnd", "copyEvent"]);
    });
  });

  it.each([
    {
      type: "inline" as const,
      label: "Copy code",
      code: "npm install -g @carbon/cli",
    },
    {
      type: "single" as const,
      label: "Copy to clipboard",
      code: "npm install --save @carbon/icons",
    },
    {
      type: "multi" as const,
      label: "Copy to clipboard",
      code: `node -v
npm -v
yarn -v`,
    },
  ] as const)("should not copy again while async copy is pending ($type)", async ({
    type,
    label,
    code,
  }) => {
    let resolveCopy: () => void = () => {};
    const copy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    render(CodeSnippetAsyncDoubleClick, {
      props: { type, code, copy },
    });

    const button = screen.getByLabelText(label);
    fireEvent.click(button);
    await Promise.resolve();
    await user.click(button);

    expect(copy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Copy events: 0")).toBeInTheDocument();

    resolveCopy();
    await waitFor(() => {
      expect(screen.getByText("Copy events: 1")).toBeInTheDocument();
    });
  });

  test("should render multiline variant", () => {
    const { container } = render(CodeSnippetMultiline);
    expect(container.querySelector(".bx--snippet--multi")).toBeInTheDocument();
    expect(screen.getByText(/node -v/)).toBeInTheDocument();
  });

  test("should expand and collapse expandable snippet", async () => {
    mockSnippetOverflowHeight();
    const { container } = render(CodeSnippetExpandable);
    await waitForSnippetMeasurement();

    expect(
      container.querySelector(".bx--snippet--expand"),
    ).not.toBeInTheDocument();

    const showMoreButton = await screen.findByText("Show more");
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

  // Regression: chevron should not duplicate the button's accessible name
  test("should not set aria-label on the expand chevron", async () => {
    mockSnippetOverflowHeight();
    const { container } = render(CodeSnippetExpandable);
    await waitForSnippetMeasurement();

    const chevron = container.querySelector(".bx--icon-chevron--down");
    assert(chevron);
    expect(chevron).toHaveAttribute("aria-hidden", "true");
    expect(chevron).not.toHaveAttribute("aria-label");
  });

  test("should render expanded by default", async () => {
    mockSnippetOverflowHeight();
    const { container } = render(CodeSnippetExpandedByDefault);
    await waitForSnippetMeasurement();

    expect(container.querySelector(".bx--snippet--expand")).toBeInTheDocument();
    expect(await screen.findByText("Show less")).toBeInTheDocument();

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

  it.each([
    { type: "single" as const, label: "Copy to clipboard" },
    { type: "inline" as const, label: "Copy code" },
    { type: "multi" as const, label: "Copy to clipboard" },
  ])("dispatches mouseenter:copy-button from $type snippet copy control", ({
    type,
    label,
  }) => {
    const onMouseEnterCopyButton = vi.fn();
    render(CodeSnippetMouseEnter, {
      props: { type, onMouseEnterCopyButton },
    });

    fireEvent.mouseEnter(screen.getByLabelText(label));

    expect(onMouseEnterCopyButton).toHaveBeenCalledTimes(1);
    expect(onMouseEnterCopyButton.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  test("does not dispatch mouseenter:copy-button from single snippet code area", () => {
    const onMouseEnterCopyButton = vi.fn();
    const { container } = render(CodeSnippetMouseEnter, {
      props: { type: "single", onMouseEnterCopyButton },
    });

    const pre = container.querySelector("pre");
    assert(pre);
    fireEvent.mouseEnter(pre);

    expect(onMouseEnterCopyButton).not.toHaveBeenCalled();
  });

  test("forwards mouseenter on single snippet wrapper", () => {
    const onMouseEnter = vi.fn();
    const { container } = render(CodeSnippetWrapperMouseEnter, {
      props: { onMouseEnter },
    });

    const snippet = container.querySelector(".bx--snippet");
    assert(snippet);
    fireEvent.mouseEnter(snippet);

    expect(onMouseEnter).toHaveBeenCalledTimes(1);
  });

  it.each([
    { type: "inline" as const, label: "Copy code" },
  ])("forwards mouseenter from inline snippet copy control", ({
    type,
    label,
  }) => {
    const onMouseEnter = vi.fn();
    render(CodeSnippetCopyButtonMouseEnter, {
      props: { type, onMouseEnter },
    });

    fireEvent.mouseEnter(screen.getByLabelText(label));

    expect(onMouseEnter).toHaveBeenCalledTimes(1);
  });

  it.each([
    { type: "single" as const, label: "Copy to clipboard" },
    { type: "inline" as const, label: "Copy code" },
    { type: "multi" as const, label: "Copy to clipboard" },
  ])("dispatches mouseleave:copy-button from $type snippet copy control", ({
    type,
    label,
  }) => {
    const onMouseleaveCopyButton = vi.fn();
    render(CodeSnippetCopyButtonMouseLeave, {
      props: { type, onMouseleaveCopyButton },
    });

    const button = screen.getByLabelText(label);
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(onMouseleaveCopyButton).toHaveBeenCalledTimes(1);
    expect(onMouseleaveCopyButton.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  it.each([
    { type: "single" as const, label: "Copy to clipboard" },
    { type: "inline" as const, label: "Copy code" },
    {
      type: "multi" as const,
      label: "Copy to clipboard",
    },
  ])("forwards copy:error from $type snippet copy control", async ({
    type,
    label,
  }) => {
    const error = new Error("copy failed");
    const onCopyError = vi.fn();
    render(CodeSnippetCopyError, {
      props: { type, onCopyError },
    });

    await user.click(screen.getByLabelText(label));

    expect(onCopyError).toHaveBeenCalledWith({ error });
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

  // Regression: the exported `showMoreLess` prop is consumer-controlled and
  // must not be silently overwritten by the component's internal logic.
  test("does not overwrite bound showMoreLess prop", async () => {
    const { rerender } = render(CodeSnippetBindShowMoreLess, {
      props: { type: "multi", showMoreLess: true },
    });

    // Content is short and type is "multi"; the component's auto-hide must
    // not flip the consumer's bound value to false.
    expect(screen.getByTestId("bound-value")).toHaveTextContent("true");

    // Switching type away from "multi" must also not mutate the bound prop.
    await rerender({ type: "single", showMoreLess: true });
    expect(screen.getByTestId("bound-value")).toHaveTextContent("true");
  });

  test("should display custom copy text", async () => {
    render(CodeSnippetWithCustomCopyText);

    const copyButton = screen.getByLabelText("Copy to clipboard");
    await user.click(copyButton);
    expect(screen.getByText("Custom copied text!")).toBeInTheDocument();
  });

  // Regression: rest props are spread to the span (inline, no copy button)
  test("spreads rest props to span for inline variant with hideCopyButton", () => {
    render(CodeSnippetRestPropsSpan);
    const span = screen.getByTestId("snippet-rest-span");
    expect(span).toBeInTheDocument();
    expect(span.tagName.toLowerCase()).toBe("span");
    expect(span).toHaveClass("bx--snippet--inline");
  });

  // Regression: rest props are spread to the copy button (inline with copy button)
  test("spreads rest props to button for inline variant with copy button", () => {
    render(CodeSnippetRestPropsButton);
    const button = screen.getByTestId("snippet-rest-btn");
    expect(button).toBeInTheDocument();
    expect(button.tagName.toLowerCase()).toBe("button");
    expect(button).toHaveClass("bx--snippet--inline");
  });

  // Regression: rest props are spread to the root div (single/multi)
  test("spreads rest props to root div for single variant", () => {
    render(CodeSnippetRestPropsSingle);
    const root = screen.getByTestId("snippet-rest-div");
    expect(root).toBeInTheDocument();
    expect(root.tagName.toLowerCase()).toBe("div");
    expect(root).toHaveClass("bx--snippet--single");
  });

  // Regression: textbox role must declare aria-readonly since the
  // container is non-editable (pairs textbox with WAI readonly pattern)
  test("marks single variant as a readonly textbox", () => {
    const { container } = render(CodeSnippetCopyButton);
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("role", "textbox");
    expect(snippet).toHaveAttribute("aria-readonly", "true");
    expect(snippet).toHaveAttribute("tabindex", "0");
    expect(snippet).not.toHaveAttribute("aria-multiline");
  });

  test("marks multi variant as a readonly multiline textbox", () => {
    const { container } = render(CodeSnippetMultiline);
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("role", "textbox");
    expect(snippet).toHaveAttribute("aria-readonly", "true");
    expect(snippet).toHaveAttribute("aria-multiline", "true");
    expect(snippet).toHaveAttribute("tabindex", "0");
  });

  test("omits tabindex when disabled (single)", () => {
    const { container } = render(CodeSnippetDisabled, {
      props: { type: "single" },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("role", "textbox");
    expect(snippet).toHaveAttribute("aria-readonly", "true");
    expect(snippet).not.toHaveAttribute("tabindex");
  });

  test("omits tabindex when disabled (multi)", () => {
    const { container } = render(CodeSnippetDisabled, {
      props: { type: "multi" },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("role", "textbox");
    expect(snippet).toHaveAttribute("aria-readonly", "true");
    expect(snippet).toHaveAttribute("aria-multiline", "true");
    expect(snippet).not.toHaveAttribute("tabindex");
  });

  test.each([
    { type: "inline" as const, expectedClass: "bx--snippet--inline" },
    { type: "single" as const, expectedClass: "bx--copy-btn" },
    { type: "multi" as const, expectedClass: "bx--copy-btn" },
  ])("binds copyRef to the copy button ($type)", ({ type, expectedClass }) => {
    const { component } = render(CodeSnippetCopyRef, {
      props: { type },
    });

    expect(component.copyRef).toBeInstanceOf(HTMLButtonElement);
    assert(component.copyRef instanceof HTMLButtonElement);
    expect(component.copyRef).toHaveClass(expectedClass);
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  test("uses empty aria-label when passed (nullish coalescing)", () => {
    const { container } = render(CodeSnippetNullishAriaLabel, {
      props: { ariaLabel: "" },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("aria-label", "");
  });

  test("uses default codeLabel for container aria-label", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "single", code: "test" },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("aria-label", "Code snippet");
  });

  test("uses custom codeLabel for container aria-label", () => {
    const { container } = render(CodeSnippet, {
      props: {
        type: "multi",
        code: "test",
        codeLabel: "Install command",
      },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("aria-label", "Install command");
  });

  test("aria-label rest prop takes precedence over codeLabel", () => {
    const { container } = render(CodeSnippet, {
      props: {
        type: "single",
        code: "test",
        codeLabel: "Install command",
        "aria-label": "Custom label",
      },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("aria-label", "Custom label");
  });

  test("copyLabel does not affect container aria-label", () => {
    const { container } = render(CodeSnippet, {
      props: {
        type: "single",
        code: "test",
        copyLabel: "Copy code",
      },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("aria-label", "Code snippet");
  });
});
