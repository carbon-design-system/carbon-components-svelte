import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
import { tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import {
  mockSnippetOverflowHeight,
  waitForSnippetMeasurement,
} from "../utils/mock-snippet-overflow-height";
import { user } from "../utils/user";
import CodeSnippetAsync from "./CodeSnippetAsync.test.svelte";
import CodeSnippetBindShowMoreLess from "./CodeSnippetBindShowMoreLess.test.svelte";
import CodeSnippetCopyButtonMouseEnter from "./CodeSnippetCopyButtonMouseEnter.test.svelte";
import CodeSnippetCopyRef from "./CodeSnippetCopyRef.test.svelte";
import CodeSnippetDispatchGuard from "./CodeSnippetDispatchGuard.test.svelte";
import CodeSnippetMouseEnter from "./CodeSnippetMouseEnter.test.svelte";
import CodeSnippetSlotCopy from "./CodeSnippetSlotCopy.test.svelte";
import {
  mockClipboard,
  mockExecCommand,
  removeFloatingPortals,
} from "./helpers";

const singleCode = "npm install --save @carbon/icons";
const inlineProps = {
  type: "inline" as const,
  code: "npm install -g @carbon/cli",
};
const multilineCode = `node -v
npm -v
yarn -v`;
const longCode = `node -v
npm -v
yarn -v
git --version
python --version
java -version
docker --version
kubectl version`;

const snippetVariants = [
  { type: "single" as const, label: "Copy to clipboard" },
  { type: "inline" as const, label: "Copy code" },
];

describe("CodeSnippet", () => {
  afterEach(removeFloatingPortals);

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2527
  it("does not fire expand/collapse event on initial render", () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    render(CodeSnippetDispatchGuard, { props: { onExpand, onCollapse } });

    expect(onExpand).not.toHaveBeenCalled();
    expect(onCollapse).not.toHaveBeenCalled();
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2527
  it("does not fire expand/collapse event on initial render when expanded is true", () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    render(CodeSnippetDispatchGuard, {
      props: { expanded: true, onExpand, onCollapse },
    });

    expect(onExpand).not.toHaveBeenCalled();
    expect(onCollapse).not.toHaveBeenCalled();
  });

  it("announces copy feedback for the inline variant", async () => {
    mockClipboard();

    render(CodeSnippet, { props: inlineProps });
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");

    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(status).toHaveTextContent("Copied!");
    expect(
      screen.getByRole("button", { name: "Copy code" }),
    ).not.toHaveAttribute("aria-live");
  });

  it("describes the inline copy button with its code text", () => {
    const { container } = render(CodeSnippet, { props: inlineProps });
    const button = screen.getByRole("button", { name: "Copy code" });
    expect(button).toHaveAccessibleDescription("npm install -g @carbon/cli");
    expect(button).toHaveAttribute(
      "aria-describedby",
      container.querySelector("code")?.id,
    );
  });

  it("points aria-describedby at a custom id on the inline variant", () => {
    render(CodeSnippet, {
      props: { type: "inline", code: "x", id: "snippet-1" },
    });
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-describedby",
      "snippet-1",
    );
  });

  it("joins a rest aria-describedby with the inline default", () => {
    render(CodeSnippet, {
      props: {
        type: "inline",
        code: "x",
        id: "snippet-1",
        "aria-describedby": "hint",
      },
    });
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-describedby",
      "snippet-1 hint",
    );
  });

  it.each(snippetVariants)(
    "should not copy again on $type snippet while feedback is active",
    async ({ type, label }) => {
      const copy = vi.fn();
      const onCopy = vi.fn();
      render(CodeSnippetAsync, { props: { type, copy, onCopy } });

      await user.dblClick(screen.getByLabelText(label));

      expect(copy).toHaveBeenCalledTimes(1);
      expect(onCopy).toHaveBeenCalledTimes(1);
    },
  );

  it.each(snippetVariants)(
    "async copy delays feedback until resolved ($type)",
    async ({ type, label }) => {
      let resolveCopy: () => void = () => {};
      const copy = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveCopy = resolve;
          }),
      );

      render(CodeSnippetAsync, { props: { type, copy } });

      const button = screen.getByLabelText(label);
      // Feedback is portalled by default.
      expect(button).toHaveClass("bx--copy-btn--portal-active");
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
    },
  );

  it.each(snippetVariants)(
    "forwards tooltipPosition to the portalled feedback tooltip ($type)",
    async ({ type, label }) => {
      render(CodeSnippetAsync, {
        props: {
          type,
          copy: () => Promise.resolve(),
          tooltipPosition: "right",
        },
      });

      const button = screen.getByLabelText(label);
      await user.click(button);

      await waitFor(() => {
        const portal = document.querySelector("[data-floating-portal]");
        expect(portal).toHaveAttribute("data-floating-direction", "right");
      });
    },
  );

  it.each(snippetVariants)(
    "async copy failure shows error feedback ($type)",
    async ({ type, label }) => {
      const error = new Error("copy failed");
      const copy = vi.fn().mockRejectedValue(error);
      const onCopyError = vi.fn();

      render(CodeSnippetAsync, {
        props: { type, copy, onCopyError },
      });

      const button = screen.getByLabelText(label);
      await user.click(button);

      expect(onCopyError).toHaveBeenCalledWith({ error });
      expect(button).toHaveClass("bx--copy-btn--fade-in");

      const portal = document.querySelector("[data-floating-portal]");
      expect(
        portal?.querySelector(".bx--tooltip-portal__content"),
      ).toHaveTextContent("Failed to copy");
      expect(screen.queryByText("Copied!")).toBeNull();
    },
  );

  it.each(snippetVariants)(
    "dispatches copy event after async copy resolves ($type)",
    async ({ type, label }) => {
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
    },
  );

  it.each(snippetVariants)(
    "should not copy again while async copy is pending ($type)",
    async ({ type, label }) => {
      let resolveCopy: () => void = () => {};
      const copy = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveCopy = resolve;
          }),
      );
      const onCopy = vi.fn();

      render(CodeSnippetAsync, { props: { type, copy, onCopy } });

      const button = screen.getByLabelText(label);
      fireEvent.click(button);
      await Promise.resolve();
      await user.click(button);

      expect(copy).toHaveBeenCalledTimes(1);
      expect(onCopy).not.toHaveBeenCalled();

      resolveCopy();
      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledTimes(1);
      });
    },
  );

  it("should fade only the scroll edges with more content", async () => {
    const { container } = render(CodeSnippet, {
      props: { type: "multi", code: multilineCode },
    });
    const snippetContainer = container.querySelector(".bx--snippet-container");
    assert(snippetContainer);

    // jsdom never lays out text, so scrollHeight/clientHeight always read 0.
    // Fake an overflowing container: 300px of content in a 100px viewport.
    Object.defineProperty(snippetContainer, "scrollHeight", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(snippetContainer, "clientHeight", {
      configurable: true,
      value: 100,
    });

    // At the top: nothing above to fade, but more content below.
    await fireEvent.scroll(snippetContainer);
    expect(snippetContainer).not.toHaveClass("bx--snippet-container--fade-top");
    expect(snippetContainer).toHaveClass("bx--snippet-container--fade-bottom");

    // Scrolled to the middle: both edges still have more content.
    snippetContainer.scrollTop = 100;
    await fireEvent.scroll(snippetContainer);
    expect(snippetContainer).toHaveClass("bx--snippet-container--fade-top");
    expect(snippetContainer).toHaveClass("bx--snippet-container--fade-bottom");

    // Scrolled to the bottom: nothing left below to fade.
    snippetContainer.scrollTop = 200;
    await fireEvent.scroll(snippetContainer);
    expect(snippetContainer).toHaveClass("bx--snippet-container--fade-top");
    expect(snippetContainer).not.toHaveClass(
      "bx--snippet-container--fade-bottom",
    );
  });

  it("should expand and collapse expandable snippet", async () => {
    mockSnippetOverflowHeight();
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    const { container } = render(CodeSnippetDispatchGuard, {
      props: { onExpand, onCollapse },
    });
    await waitForSnippetMeasurement();

    expect(
      container.querySelector(".bx--snippet--expand"),
    ).not.toBeInTheDocument();

    const showMoreButton = await screen.findByText("Show more");
    await user.click(showMoreButton);

    expect(container.querySelector(".bx--snippet--expand")).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onCollapse).not.toHaveBeenCalled();

    const showLessButton = screen.getByText("Show less");
    await user.click(showLessButton);

    expect(
      container.querySelector(".bx--snippet--expand"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Show more")).toBeInTheDocument();
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it("should set aria-expanded and aria-controls on the show-more button", async () => {
    mockSnippetOverflowHeight();
    const { container } = render(CodeSnippet, {
      props: { type: "multi", code: longCode },
    });
    await waitForSnippetMeasurement();

    const showMoreButton = await screen.findByText("Show more");
    const button = showMoreButton.closest("button");
    assert(button);
    expect(button).toHaveAttribute("aria-expanded", "false");

    const controlsId = button.getAttribute("aria-controls");
    assert(controlsId);
    const codeContainer = document.getElementById(controlsId);
    assert(codeContainer);
    expect(codeContainer).toHaveClass("bx--snippet-container");

    // Regression: chevron should not duplicate the button's accessible name
    const chevron = container.querySelector(".bx--icon-chevron--down");
    assert(chevron);
    expect(chevron).toHaveAttribute("aria-hidden", "true");
    expect(chevron).not.toHaveAttribute("aria-label");

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("should render expanded by default", async () => {
    mockSnippetOverflowHeight();
    const { container } = render(CodeSnippet, {
      props: { type: "multi", expanded: true, code: longCode },
    });
    await waitForSnippetMeasurement();

    expect(container.querySelector(".bx--snippet--expand")).toBeInTheDocument();
    expect(await screen.findByText("Show less")).toBeInTheDocument();

    await user.click(screen.getByText("Show less"));

    expect(
      container.querySelector(".bx--snippet--expand"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Show more")).toBeInTheDocument();
  });

  // Regression: an emptied <pre> still has its padding box, so it must clear
  // the expand control; only a hidden snippet (no box) keeps its state.
  it("drops show more when the code is cleared, but not while hidden", async () => {
    let deliver: ResizeObserverCallback = () => {};
    const observed = new Set<Element>();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          deliver = callback;
        }
        observe(element: Element) {
          observed.add(element);
        }
        unobserve(element: Element) {
          observed.delete(element);
        }
        disconnect() {}
      },
    );
    const resize = () =>
      deliver(
        [...observed].map((target) => ({ target }) as ResizeObserverEntry),
        {} as ResizeObserver,
      );
    const nativeGetComputedStyle = window.getComputedStyle;
    const style = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element) =>
        element.tagName === "PRE"
          ? ({
              paddingTop: "0px",
              paddingBottom: "24px",
            } as CSSStyleDeclaration)
          : nativeGetComputedStyle(element),
      );
    const rect = mockSnippetOverflowHeight(24 + 16 * 20);
    try {
      const code = Array.from({ length: 20 }, (_, i) => `line ${i}`).join("\n");
      const { container, rerender } = render(CodeSnippet, {
        props: { type: "multi", code },
      });
      await waitFor(() => expect(observed.size).toBe(2));
      resize();
      await user.click(await screen.findByText("Show more"));

      mockSnippetOverflowHeight(0);
      resize();
      await tick();
      expect(screen.getByText("Show less")).toBeInTheDocument();

      await rerender({ code: "" });
      mockSnippetOverflowHeight(24);
      resize();
      await tick();
      expect(screen.queryByText(/Show (more|less)/)).not.toBeInTheDocument();
      expect(
        container.querySelector(".bx--snippet--expand"),
      ).not.toBeInTheDocument();
    } finally {
      rect.mockRestore();
      style.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it("should copy text when copy button is clicked", async () => {
    const writeText = mockClipboard();

    const { container } = render(CodeSnippet, {
      props: { type: "single", code: singleCode },
    });

    expect(container.querySelector(".bx--snippet--single")).toBeInTheDocument();
    expect(
      screen.getByText("npm install --save @carbon/icons"),
    ).toBeInTheDocument();

    const copyButton = screen.getByLabelText("Copy to clipboard");
    assert(copyButton);

    await user.click(copyButton);
    expect(writeText).toHaveBeenCalledWith("npm install --save @carbon/icons");
    expect(screen.getByRole("status")).toHaveTextContent("Copied!");
  });

  it.each(snippetVariants)(
    "dispatches mouseenter:copy-button from $type snippet copy control",
    ({ type, label }) => {
      const onMouseEnterCopyButton = vi.fn();
      render(CodeSnippetMouseEnter, {
        props: { type, onMouseEnterCopyButton },
      });

      fireEvent.mouseEnter(screen.getByLabelText(label));

      expect(onMouseEnterCopyButton).toHaveBeenCalledTimes(1);
      expect(onMouseEnterCopyButton.mock.calls[0][0]).toBeInstanceOf(
        MouseEvent,
      );
    },
  );

  it("forwards mouseenter on single snippet wrapper", () => {
    const onMouseEnter = vi.fn();
    const { container } = render(CodeSnippetCopyButtonMouseEnter, {
      props: { type: "single", onMouseEnter },
    });

    const snippet = container.querySelector(".bx--snippet");
    assert(snippet);
    fireEvent.mouseEnter(snippet);

    expect(onMouseEnter).toHaveBeenCalledTimes(1);
  });

  it("forwards mouseenter from inline snippet copy control", () => {
    const onMouseEnter = vi.fn();
    render(CodeSnippetCopyButtonMouseEnter, {
      props: { type: "inline", onMouseEnter },
    });

    fireEvent.mouseEnter(screen.getByLabelText("Copy code"));

    expect(onMouseEnter).toHaveBeenCalledTimes(1);
  });

  it.each(snippetVariants)(
    "dispatches mouseleave:copy-button from $type snippet copy control",
    ({ type, label }) => {
      const onMouseleaveCopyButton = vi.fn();
      render(CodeSnippetMouseEnter, {
        props: { type, onMouseleaveCopyButton },
      });

      const button = screen.getByLabelText(label);
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);

      expect(onMouseleaveCopyButton).toHaveBeenCalledTimes(1);
      expect(onMouseleaveCopyButton.mock.calls[0][0]).toBeInstanceOf(
        MouseEvent,
      );
    },
  );

  it.each(snippetVariants)(
    "default copy failure shows error feedback ($type)",
    async ({ type, label }) => {
      const onCopyError = vi.fn();
      mockClipboard(
        vi
          .fn<(text: string) => Promise<void>>()
          .mockRejectedValue(new Error("denied")),
      );
      mockExecCommand(false);

      render(CodeSnippetAsync, {
        props: { type, onCopyError },
      });

      await user.click(screen.getByLabelText(label));

      expect(onCopyError).toHaveBeenCalledWith({
        error: expect.any(Error),
      });
      expect(onCopyError.mock.calls[0][0].error.message).toBe("Failed to copy");
      // Single/multi also mirror the text into CopyButton's status region.
      expect(
        screen.getByText("Failed to copy", {
          ignore: "script, style, [role=status]",
        }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Copied!")).toBeNull();
    },
  );

  it("should wrap text when wrapText is true", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "multi", wrapText: true, code: longCode },
    });
    expect(
      container.querySelector(".bx--snippet--wraptext"),
    ).toBeInTheDocument();
  });

  it("defaults to a 15-row collapsed max-height for multi snippets", () => {
    const { container } = render(CodeSnippet, {
      props: {
        type: "multi",
        code: "line 1\nline 2\nline 3",
      },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expectInlineStyle(snippet, {
      "min-height": "48px",
      "max-height": "240px",
    });
  });

  it("applies custom collapsed and expanded row counts to max-height", async () => {
    mockSnippetOverflowHeight(16 * 10);
    const { container } = render(CodeSnippet, {
      props: {
        type: "multi",
        code: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk",
        maxCollapsedNumberOfRows: 5,
        minCollapsedNumberOfRows: 2,
        maxExpandedNumberOfRows: 20,
        minExpandedNumberOfRows: 10,
      },
    });
    await waitForSnippetMeasurement();

    const snippet = container.querySelector(".bx--snippet-container");
    expectInlineStyle(snippet, {
      "min-height": "32px",
      "max-height": "80px",
    });

    await user.click(await screen.findByText("Show more"));

    expectInlineStyle(snippet, {
      "min-height": "160px",
      "max-height": "320px",
    });
  });

  it("scrolls overflowing content when showMoreLess is false", async () => {
    mockSnippetOverflowHeight();
    const { container } = render(CodeSnippet, {
      props: { type: "multi", showMoreLess: false, code: longCode },
    });
    await waitForSnippetMeasurement();
    const snippet = container.querySelector(".bx--snippet-container");
    expectInlineStyle(snippet, {
      "max-height": "240px",
      "overflow-y": "auto",
    });
    expect(screen.queryByText("Show more")).not.toBeInTheDocument();
  });

  // Regression: the exported `showMoreLess` prop is consumer-controlled and
  // must not be silently overwritten by the component's internal logic.
  it("does not overwrite bound showMoreLess prop", async () => {
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

  it("should display custom copy text", async () => {
    mockClipboard();

    render(CodeSnippet, {
      props: {
        type: "single",
        code: singleCode,
        feedback: "Custom copied text!",
      },
    });

    const copyButton = screen.getByLabelText("Copy to clipboard");
    await user.click(copyButton);
    expect(screen.getByRole("status")).toHaveTextContent("Custom copied text!");
  });

  describe("copying without code", () => {
    let writeText: ReturnType<typeof mockClipboard>;

    beforeEach(() => {
      writeText = mockClipboard();
    });

    it.each(snippetVariants)(
      "copies the slot text with the default copy ($type)",
      async ({ type, label }) => {
        const onCopy = vi.fn();
        render(CodeSnippetSlotCopy, { props: { type, onCopy } });

        await user.click(screen.getByLabelText(label));

        expect(writeText).toHaveBeenCalledWith("npm i foo");
        expect(onCopy).toHaveBeenCalledTimes(1);
      },
    );

    it.each(snippetVariants)(
      "copies the rendered slot text ($type)",
      async ({ type, label }) => {
        const copy = vi.fn();
        render(CodeSnippetSlotCopy, { props: { type, copy } });

        await user.click(screen.getByLabelText(label));

        expect(copy).toHaveBeenCalledWith("npm i foo");
      },
    );

    it.each(snippetVariants)(
      "prefers code over the slot text ($type)",
      async ({ type, label }) => {
        const copy = vi.fn();
        render(CodeSnippetSlotCopy, {
          props: { type, copy, code: "override" },
        });

        await user.click(screen.getByLabelText(label));

        expect(copy).toHaveBeenCalledWith("override");
      },
    );

    it("prefers an empty code string over the slot text", async () => {
      const copy = vi.fn();
      render(CodeSnippetSlotCopy, {
        props: { type: "single", copy, code: "" },
      });

      await user.click(screen.getByLabelText("Copy to clipboard"));

      expect(copy).toHaveBeenCalledWith("");
    });

    it("copies an empty code string with the default copy", async () => {
      render(CodeSnippet, { props: { type: "inline", code: "" } });

      await user.click(screen.getByLabelText("Copy code"));

      expect(writeText).toHaveBeenCalledWith("");
    });
  });

  // Regression: rest props are spread to the span (inline, no copy button),
  // the copy button (inline), and the root div (single/multi).
  it.each([
    {
      props: { type: "inline", hideCopyButton: true },
      tag: "span",
      cls: "bx--snippet--inline",
    },
    { props: { type: "inline" }, tag: "button", cls: "bx--snippet--inline" },
    { props: { type: "single" }, tag: "div", cls: "bx--snippet--single" },
  ] as const)(
    "spreads rest props to the $tag ($props.type)",
    ({ props, tag, cls }) => {
      render(CodeSnippet, {
        props: { ...props, code: "code", "data-testid": "root" },
      });
      const root = screen.getByTestId("root");
      expect(root.tagName.toLowerCase()).toBe(tag);
      expect(root).toHaveClass(cls);
    },
  );

  // Regression: textbox role must declare aria-readonly since the
  // container is non-editable (pairs textbox with WAI readonly pattern)
  it.each([
    { type: "single", disabled: false, multiline: null, tabindex: "0" },
    { type: "multi", disabled: false, multiline: "true", tabindex: "0" },
    { type: "single", disabled: true, multiline: null, tabindex: null },
    { type: "multi", disabled: true, multiline: "true", tabindex: null },
  ] as const)(
    "marks $type (disabled: $disabled) as a readonly textbox",
    ({ type, disabled, multiline, tabindex }) => {
      const { container } = render(CodeSnippet, {
        props: { type, disabled, code: multilineCode },
      });
      expect(
        container.querySelector(`.bx--snippet--${type}`),
      ).toBeInTheDocument();
      expect(container).toHaveTextContent("node -v");
      const snippet = container.querySelector(".bx--snippet-container");
      expect(snippet).toHaveAttribute("role", "textbox");
      expect(snippet).toHaveAttribute("aria-readonly", "true");
      expect(snippet?.getAttribute("aria-multiline")).toBe(multiline);
      expect(snippet?.getAttribute("tabindex")).toBe(tabindex);
    },
  );

  it("respects disabled on the inline variant's copy button", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "inline", disabled: true, code: singleCode },
    });
    const button = container.querySelector("button");
    expect(button).toBeDisabled();
  });

  it.each([
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

  it("uses default codeLabel for container aria-label", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "single", code: "test" },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("aria-label", "Code snippet");
  });

  it("uses custom codeLabel for container aria-label", () => {
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

  it.each(["single", "multi"] as const)(
    "labels only the container, not the root, with a rest aria-label (%s)",
    (type) => {
      const { container } = render(CodeSnippet, {
        props: { type, code: "test", "aria-label": "Custom label" },
      });
      expect(container.querySelector(".bx--snippet")).not.toHaveAttribute(
        "aria-label",
      );
      expect(container.querySelector(".bx--snippet-container")).toHaveAttribute(
        "aria-label",
        "Custom label",
      );
      expect(screen.getAllByLabelText("Custom label")).toHaveLength(1);
    },
  );

  it("keeps an empty rest aria-label off the root", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "single", code: "test", "aria-label": "" },
    });
    expect(container.querySelector(".bx--snippet")).not.toHaveAttribute(
      "aria-label",
    );
    expect(container.querySelector(".bx--snippet-container")).toHaveAttribute(
      "aria-label",
      "",
    );
  });

  it("copyLabel does not affect container aria-label", () => {
    const { container } = render(CodeSnippet, {
      props: {
        type: "single",
        code: "test",
        copyLabel: "Duplicate snippet",
      },
    });
    const snippet = container.querySelector(".bx--snippet-container");
    expect(snippet).toHaveAttribute("aria-label", "Code snippet");
  });

  it("shares one ResizeObserver across multi-line snippets", async () => {
    let created = 0;
    const Base = globalThis.ResizeObserver;
    vi.stubGlobal(
      "ResizeObserver",
      class extends Base {
        constructor(callback: ResizeObserverCallback) {
          super(callback);
          created++;
        }
      },
    );
    try {
      const code = Array.from({ length: 20 }, (_, i) => `line ${i}`).join("\n");
      for (let i = 0; i < 3; i++) {
        render(CodeSnippet, { props: { type: "multi", code } });
      }
      await waitFor(() => expect(created).toBe(1));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("measures the height once when content and container resize together", async () => {
    let deliver: ResizeObserverCallback = () => {};
    const observed = new Set<Element>();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          deliver = callback;
        }
        observe(element: Element) {
          observed.add(element);
        }
        unobserve(element: Element) {
          observed.delete(element);
        }
        disconnect() {}
      },
    );
    const getComputedStyle = vi.spyOn(window, "getComputedStyle");
    try {
      const code = Array.from({ length: 20 }, (_, i) => `line ${i}`).join("\n");
      render(CodeSnippet, { props: { type: "multi", code } });
      await waitFor(() => expect(observed.size).toBe(2));

      getComputedStyle.mockClear();
      const entries = [...observed].map(
        (target) => ({ target }) as ResizeObserverEntry,
      );
      deliver(entries, {} as ResizeObserver);
      expect(getComputedStyle).toHaveBeenCalledTimes(1);
    } finally {
      getComputedStyle.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
