import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import TruncatedText from "./TruncatedText.test.svelte";

/**
 * jsdom does no layout, so `offsetHeight`/`scrollHeight` both report 0 by
 * default. Truncation detection compares the two, so both are stubbed on the
 * prototype (global for the test, restored after) to simulate either a
 * truncated (`scrollHeight` > `offsetHeight`) or non-truncated element.
 */
function stubHeights({
  offsetHeight,
  scrollHeight,
}: {
  offsetHeight: number;
  scrollHeight: number;
}) {
  const offsetDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetHeight",
  );
  const scrollDescriptor = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "scrollHeight",
  );

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => offsetHeight,
  });
  Object.defineProperty(Element.prototype, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  });

  return () => {
    if (offsetDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "offsetHeight",
        offsetDescriptor,
      );
    }
    if (scrollDescriptor) {
      Object.defineProperty(
        Element.prototype,
        "scrollHeight",
        scrollDescriptor,
      );
    }
  };
}

describe("TruncatedText", () => {
  it("renders the slot content", () => {
    const restore = stubHeights({ offsetHeight: 100, scrollHeight: 100 });
    render(TruncatedText, { text: "Hello world" });
    restore();

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("does not render a reveal affordance when the content is not truncated", async () => {
    const restore = stubHeights({ offsetHeight: 100, scrollHeight: 100 });
    render(TruncatedText);
    await waitFor(() =>
      expect(screen.queryByRole("button")).not.toBeInTheDocument(),
    );
    restore();
  });

  it("wraps the content in a tooltip trigger when truncated (default type)", async () => {
    const restore = stubHeights({ offsetHeight: 40, scrollHeight: 100 });
    render(TruncatedText, { text: "Full text shown in the tooltip" });
    await waitFor(() => expect(screen.getByRole("button")).toBeInTheDocument());
    restore();

    // The tooltip is portalled (see the component's own comment on why),
    // so its content only mounts once open — focus opens it without the
    // hover-open delay.
    const trigger = screen.getByRole("button");
    trigger.focus();
    const tooltipId = trigger.getAttribute("aria-describedby");
    assert(tooltipId);
    await waitFor(() =>
      expect(document.getElementById(tooltipId)).toHaveTextContent(
        "Full text shown in the tooltip",
      ),
    );
  });

  it("does not wrap the content in a tooltip when type is tooltip and not truncated", async () => {
    const restore = stubHeights({ offsetHeight: 100, scrollHeight: 100 });
    render(TruncatedText, { type: "tooltip" });
    await waitFor(() =>
      expect(screen.queryByRole("button")).not.toBeInTheDocument(),
    );
    restore();
  });

  it('never renders a reveal affordance when type is "none", even when truncated', async () => {
    const restore = stubHeights({ offsetHeight: 40, scrollHeight: 100 });
    render(TruncatedText, { type: "none" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    restore();

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders an expand toggle when truncated and type is expand", async () => {
    const restore = stubHeights({ offsetHeight: 40, scrollHeight: 100 });
    render(TruncatedText, {
      type: "expand",
      expandLabel: "Read more",
      collapseLabel: "Read less",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Read more" }),
      ).toBeInTheDocument(),
    );
    restore();

    expect(screen.getByRole("button", { name: "Read more" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("expands and collapses on click", async () => {
    const restore = stubHeights({ offsetHeight: 40, scrollHeight: 100 });
    render(TruncatedText, {
      type: "expand",
      expandLabel: "Read more",
      collapseLabel: "Read less",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Read more" }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Read more" }));
    const collapseButton = screen.getByRole("button", { name: "Read less" });
    expect(collapseButton).toHaveAttribute("aria-expanded", "true");

    await user.click(collapseButton);
    restore();
    expect(screen.getByRole("button", { name: "Read more" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("expands on keyboard activation", async () => {
    const restore = stubHeights({ offsetHeight: 40, scrollHeight: 100 });
    render(TruncatedText, {
      type: "expand",
      expandLabel: "Read more",
      collapseLabel: "Read less",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Read more" }),
      ).toBeInTheDocument(),
    );
    restore();

    screen.getByRole("button", { name: "Read more" }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Read less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("links the expand toggle to the content via aria-controls", async () => {
    const restore = stubHeights({ offsetHeight: 40, scrollHeight: 100 });
    render(TruncatedText, {
      id: "my-truncated-text",
      type: "expand",
      expandLabel: "Read more",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Read more" }),
      ).toBeInTheDocument(),
    );
    restore();

    expect(screen.getByRole("button", { name: "Read more" })).toHaveAttribute(
      "aria-controls",
      "my-truncated-text",
    );
  });

  it("applies -webkit-line-clamp based on the lines prop", () => {
    const restore = stubHeights({ offsetHeight: 40, scrollHeight: 100 });
    const { container } = render(TruncatedText, { lines: 4 });
    restore();

    const content = container.querySelector(
      ".bx--truncated-text__text-content",
    ) as HTMLElement;
    expect(content.style.webkitLineClamp).toBe("4");
  });

  it("removes the line clamp while expanded", async () => {
    const restore = stubHeights({ offsetHeight: 40, scrollHeight: 100 });
    const { container } = render(TruncatedText, {
      type: "expand",
      expandLabel: "Read more",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Read more" }),
      ).toBeInTheDocument(),
    );
    restore();

    await user.click(screen.getByRole("button", { name: "Read more" }));

    const content = container.querySelector(
      ".bx--truncated-text__text-content",
    ) as HTMLElement;
    expect(content.style.webkitLineClamp).toBe("none");
  });
});
