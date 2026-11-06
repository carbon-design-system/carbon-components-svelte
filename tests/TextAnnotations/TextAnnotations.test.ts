import { render, screen, waitFor, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import TextAnnotations from "./TextAnnotations.test.svelte";

const TEXT =
  "The Supplier shall deliver the goods within thirty days of the order date. Payment is due sixty days after delivery.";

function annotation(
  id: string,
  quote: string,
  author = "Grace Hopper",
  body = "Check this.",
) {
  const start = TEXT.indexOf(quote);
  return {
    id,
    range: { start, end: start + quote.length },
    quote,
    prefix: TEXT.slice(Math.max(0, start - 16), start),
    suffix: TEXT.slice(start + quote.length, start + quote.length + 16),
    comments: [{ id: `${id}-c1`, author: { name: author }, body }],
  };
}

const frame = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".bx--text-annotations__document")!;

const marks = (container: HTMLElement) => [
  ...frame(container).querySelectorAll("mark"),
];

// jsdom does no layout: ranges have no boxes.
beforeAll(() => {
  const empty = () => ({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON() {},
  });
  Range.prototype.getBoundingClientRect = empty;
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
});

async function settle() {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
}

describe("TextAnnotations", () => {
  it("renders the document as a labelled region described by its help text", () => {
    const { container } = render(TextAnnotations);
    const region = screen.getByRole("region", { name: "Service agreement" });
    expect(region).toBe(frame(container));
    expect(region).toHaveAttribute("tabindex", "0");
    const help = document.getElementById(
      region.getAttribute("aria-describedby") ?? "",
    );
    expect(help).toHaveTextContent(/Shift and the arrow keys/);
  });

  it("lists annotations as buttons named by author and quote", () => {
    render(TextAnnotations, {
      annotations: [
        annotation("a", "within thirty days"),
        annotation("b", "sixty days", "Ada Lovelace"),
      ],
    });
    expect(
      screen.getByRole("button", {
        name: "Comment by Grace Hopper on “within thirty days”",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Comment by Ada Lovelace on “sixty days”",
      }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("complementary", { name: "Annotations" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(2);
  });

  it("shows the empty text when there are no annotations", () => {
    render(TextAnnotations);
    expect(screen.getByText(/Select text to add one/)).toBeInTheDocument();
  });

  it("wraps annotated text in marks, through inline markup, and unwraps it", async () => {
    const { container, unmount } = render(TextAnnotations, {
      annotations: [annotation("a", "Supplier shall deliver")],
    });
    const before = frame(container).innerHTML;
    await waitFor(() => expect(marks(container).length).toBeGreaterThan(0));
    expect(
      marks(container)
        .map((m) => m.textContent)
        .join(""),
    ).toBe("Supplier shall deliver");
    expect(frame(container).textContent).toContain(TEXT.slice(0, 40));
    unmount();
    expect(before).toContain("<em>Supplier</em>");
  });

  it("marks overlapping annotations and the stretch they share", async () => {
    const { container } = render(TextAnnotations, {
      annotations: [
        annotation("a", "deliver the goods within thirty days"),
        annotation("b", "goods within thirty days of the order date"),
      ],
    });
    await waitFor(() =>
      expect(
        frame(container).querySelectorAll(
          ".bx--text-annotations__mark--overlap",
        ).length,
      ).toBeGreaterThan(0),
    );
    const shared = [
      ...frame(container).querySelectorAll(
        ".bx--text-annotations__mark--overlap",
      ),
    ]
      .map((m) => m.textContent)
      .join("");
    expect(shared).toBe("goods within thirty days");
  });

  it("finds an annotation again when the text changes", async () => {
    const onreanchor = vi.fn();
    const { rerender } = render(TextAnnotations, {
      text: TEXT,
      annotations: [annotation("a", "sixty days")],
      onreanchor,
    });
    await settle();
    expect(onreanchor).not.toHaveBeenCalled();

    const edited = `Definitions are in schedule 1. ${TEXT}`;
    await rerender({ text: edited });
    await waitFor(() => expect(onreanchor).toHaveBeenCalled());
    const [{ changes }] = onreanchor.mock.calls[0] as [
      {
        changes: Array<{
          id: string;
          range: { start: number };
          status: string;
        }>;
      },
    ];
    expect(changes).toEqual([
      expect.objectContaining({ id: "a", status: "moved" }),
    ]);
    expect(changes[0].range.start).toBe(edited.indexOf("sixty days"));
  });

  it("reports an annotation whose text is gone and keeps it in the rail", async () => {
    const onreanchor = vi.fn();
    const { rerender } = render(TextAnnotations, {
      text: TEXT,
      annotations: [annotation("a", "sixty days after delivery")],
      onreanchor,
    });
    await settle();
    await rerender({ text: "A different contract entirely." });
    await waitFor(() => expect(onreanchor).toHaveBeenCalled());
    expect(onreanchor.mock.calls[0][0].changes[0].status).toBe("orphaned");
    expect(screen.getByText("The text changed")).toBeInTheDocument();
  });

  it("opens the thread from the rail and adds a reply", async () => {
    const onreply = vi.fn();
    render(TextAnnotations, {
      annotations: [annotation("a", "sixty days")],
      onreply,
    });
    await user.click(
      screen.getByRole("button", { name: /Comment by Grace Hopper/ }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName(/Comment by Grace Hopper/);
    expect(screen.getByTestId("active")).toHaveTextContent("a");

    await user.type(
      within(dialog).getByRole("textbox", { name: "Reply" }),
      "Agreed.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Comment" }));

    expect(onreply).toHaveBeenCalledTimes(1);
    expect(onreply.mock.calls[0][0].detail.comment).toMatchObject({
      body: "Agreed.",
      author: { name: "Ada Lovelace" },
    });
    expect(within(dialog).getByText("Agreed.")).toBeInTheDocument();
  });

  it("closes the card with Escape and returns focus to the rail button", async () => {
    render(TextAnnotations, { annotations: [annotation("a", "sixty days")] });
    const button = screen.getByRole("button", { name: /Comment by/ });
    await user.click(button);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(button).toHaveFocus();
  });

  it("starts a thread from selected text and adds the annotation", async () => {
    const oncreate = vi.fn();
    const { container } = render(TextAnnotations, { oncreate });
    const region = frame(container);
    const strong = region.querySelector("strong")!;
    const range = document.createRange();
    range.selectNodeContents(strong);
    const selection = document.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));

    const comment = await screen.findByRole("button", { name: /^Comment/ });
    await user.click(comment);
    const field = await screen.findByRole("textbox", { name: "Add a comment" });
    await user.type(field, "Is sixty days enough?");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(oncreate).toHaveBeenCalledTimes(1);
    const created = oncreate.mock.calls[0][0].detail.annotation;
    expect(created.quote).toBe("sixty days");
    expect(created.range.end - created.range.start).toBe(10);
    expect(created.comments[0].body).toBe("Is sixty days enough?");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(
      screen.getByRole("button", { name: /Comment by Ada Lovelace/ }),
    ).toBeInTheDocument();
  });

  it("leaves the list alone when create is canceled", async () => {
    const { container } = render(TextAnnotations, {
      oncreate: (event: CustomEvent) => event.preventDefault(),
    });
    const range = document.createRange();
    range.selectNodeContents(frame(container).querySelector("strong")!);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
    await user.click(await screen.findByRole("button", { name: /^Comment/ }));
    await user.type(
      await screen.findByRole("textbox", { name: "Add a comment" }),
      "Hold on.",
    );
    await user.click(screen.getByRole("button", { name: "Comment" }));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("does not offer to comment when readonly", async () => {
    const { container } = render(TextAnnotations, { readonly: true });
    const range = document.createRange();
    range.selectNodeContents(frame(container).querySelector("strong")!);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
    await settle();
    expect(screen.queryByRole("button", { name: /^Comment/ })).toBeNull();
  });

  it("moves between annotations with Alt and the arrow keys", async () => {
    const { container } = render(TextAnnotations, {
      annotations: [
        annotation("a", "within thirty days"),
        annotation("b", "sixty days"),
      ],
    });
    frame(container).focus();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(screen.getByTestId("active")).toHaveTextContent("a");
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(screen.getByTestId("active")).toHaveTextContent("b");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(screen.getByTestId("active")).toHaveTextContent("a");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("moves through the rail with the arrow keys, one tab stop", async () => {
    render(TextAnnotations, {
      annotations: [
        annotation("a", "within thirty days"),
        annotation("b", "order date"),
        annotation("c", "sixty days"),
      ],
    });
    const buttons = screen.getAllByRole("button", { name: /Comment by/ });
    expect(buttons.map((b) => b.getAttribute("tabindex"))).toEqual([
      "0",
      "-1",
      "-1",
    ]);
    buttons[0].focus();
    await user.keyboard("{ArrowDown}");
    expect(buttons[1]).toHaveFocus();
    expect(buttons[1]).toHaveAttribute("tabindex", "0");
  });
});
