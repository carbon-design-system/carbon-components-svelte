import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Card from "./Card.test.svelte";
import CardDecorated from "./CardDecorated.test.svelte";
import CardTitle from "./CardTitle.test.svelte";

describe("Card", () => {
  it("renders a static surface with the productive title style", () => {
    render(Card);

    const card = screen.getByTestId("card");
    expect(card.tagName).toBe("DIV");
    expect(card).toHaveClass("bx--card", "bx--card--productive");
    expect(card).not.toHaveClass("bx--card--clickable");
    expect(card).not.toHaveAttribute("role");
    expect(card).not.toHaveAttribute("tabindex");
    expect(card.querySelector(".bx--card__clickable-footer")).toBeNull();
    expect(card.className).not.toMatch(/\bfalse\b/);
  });

  it("sets the expressive title style", () => {
    render(Card, { props: { density: "expressive" } });

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("bx--card--expressive");
    expect(card).not.toHaveClass("bx--card--productive");
  });

  it("renders a clickable card as a button that clicks once on Enter and Space", async () => {
    const onclick = vi.fn();
    render(Card, { props: { clickable: true, onclick } });

    const card = screen.getByRole("button", { name: "Quarterly report" });
    expect(card).toHaveClass("bx--card--clickable");
    expect(card).toHaveAttribute("tabindex", "0");
    expect(card).not.toHaveAttribute("aria-disabled");

    await user.tab();
    expect(card).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onclick).toHaveBeenCalledTimes(2);

    // A held Space clicks once, as a native button does.
    await user.keyboard("[Space>3/]");
    expect(onclick).toHaveBeenCalledTimes(3);
  });

  it("renders a clickable card with href as a link", async () => {
    const onclick = vi.fn((event: MouseEvent) => event.preventDefault());
    render(Card, { props: { clickable: true, href: "/reports", onclick } });

    const card = screen.getByRole("link", { name: "Quarterly report" });
    expect(card.tagName).toBe("A");
    expect(card).toHaveAttribute("href", "/reports");
    expect(card).not.toHaveAttribute("rel");
    expect(card).not.toHaveAttribute("tabindex");

    // The link clicks natively on Enter; the card adds no second click.
    card.focus();
    await user.keyboard("{Enter}");
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it("adds rel to a link that opens a new tab", () => {
    render(Card, {
      props: { clickable: true, href: "/reports", target: "_blank" },
    });

    expect(screen.getByRole("link")).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  it("ignores href unless the card is clickable", () => {
    render(Card, { props: { href: "/reports" } });

    expect(screen.getByTestId("card").tagName).toBe("DIV");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it.each([
    ["button", {}, "-1"],
    ["link", { href: "/reports" }, null],
  ] as const)("disables a clickable %s", (role, props, tabindex) => {
    const onclick = vi.fn();
    render(Card, {
      props: { clickable: true, disabled: true, onclick, ...props },
    });

    const card = screen.getByRole(role);
    expect(card).toHaveClass("bx--card--clickable", "bx--card--disabled");
    expect(card).toHaveAttribute("aria-disabled", "true");
    expect(card).not.toHaveAttribute("href");
    if (tabindex) expect(card).toHaveAttribute("tabindex", tabindex);
    else expect(card).not.toHaveAttribute("tabindex");

    card.click();
    card.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(onclick).not.toHaveBeenCalled();
  });

  it("shows a decorative icon in a clickable card, ArrowRight by default", () => {
    const { unmount } = render(Card, { props: { clickable: true } });

    const icon = screen
      .getByTestId("card")
      .querySelector(".bx--card__clickable-footer svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    const arrow = icon?.querySelector("path")?.getAttribute("d");
    unmount();

    render(Card, { props: { clickable: true, customIcon: true } });
    const launch = screen
      .getByTestId("card")
      .querySelector(".bx--card__clickable-footer svg path");
    expect(launch?.getAttribute("d")).not.toBe(arrow);
  });

  it.each([
    [undefined, "button"],
    ["/reports", "link"],
  ] as const)("names a clickable card (href=%s) by its title", (href, role) => {
    render(Card, { props: { clickable: true, href } });

    const card = screen.getByRole(role, { name: "Quarterly report" });
    const title = screen.getByRole("heading", { name: "Quarterly report" });
    expect(card).toHaveAttribute("aria-labelledby", title.id);
  });

  it("lets aria-label replace the title as the name", () => {
    render(Card, { props: { clickable: true, label: "Open the report" } });

    const card = screen.getByRole("button", { name: "Open the report" });
    expect(card).not.toHaveAttribute("aria-labelledby");
  });

  it("drops the title reference when a clickable card has no title", () => {
    render(Card, { props: { clickable: true, title: false } });

    expect(screen.getByTestId("card")).not.toHaveAttribute("aria-labelledby");
  });

  it("does not label a static card", () => {
    render(Card);

    expect(screen.getByTestId("card")).not.toHaveAttribute("aria-labelledby");
  });

  it("skips a CardFooter and CardActions in a clickable card", () => {
    render(Card, { props: { clickable: true, footer: true, actions: true } });

    expect(screen.queryByTestId("footer")).toBeNull();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    expect(screen.getByTestId("header")).not.toHaveClass(
      "bx--card__header--actions",
    );
  });

  it("lays out an action set footer", () => {
    render(Card, { props: { footer: true } });

    const footer = screen.getByTestId("footer");
    expect(footer).toHaveClass(
      "bx--card__footer",
      "bx--card__footer--action-set",
    );
    expect(footer.querySelector(".bx--card__action")).not.toHaveClass(
      "bx--card__action--icon-only",
    );
  });

  it("puts header actions in the header", () => {
    render(Card, { props: { actions: true } });

    expect(
      screen.getByTestId("header").querySelector(".bx--card__actions"),
    ).not.toBeNull();
  });

  it("keeps media at its ratio above the content", () => {
    render(Card, { props: { media: true } });

    const card = screen.getByTestId("card");
    const media = screen.getByTestId("media");
    expect(card.firstElementChild).toBe(media);
    expect(media).toHaveClass(
      "bx--card__media",
      "bx--aspect-ratio",
      "bx--aspect-ratio--16x9",
    );
    expect(card.querySelector(".bx--card__content")).toBeNull();
  });

  it.each([
    ["start", "first"],
    ["end", "last"],
  ] as const)("places horizontal media at the %s", (mediaPosition, side) => {
    render(Card, {
      props: { horizontal: true, media: true, mediaPosition, clickable: true },
    });

    const card = screen.getByTestId("card");
    const media = screen.getByTestId("media");
    expect(card).toHaveClass("bx--card--horizontal");
    expect(card.children).toHaveLength(2);
    expect(
      side === "first" ? card.firstElementChild : card.lastElementChild,
    ).toBe(media);
    expect(media).toHaveClass("bx--card__media", "bx--card__media--horizontal");
    expect(media).not.toHaveClass("bx--aspect-ratio");
    expect(media.style.getPropertyValue("--ccs-card-media-width")).toBe("40%");

    // The clickable icon stays in the content column.
    const content = card.querySelector(".bx--card__content");
    expect(
      content?.lastElementChild?.classList.contains(
        "bx--card__clickable-footer",
      ),
    ).toBe(true);
  });

  it("renders the decorator beside a clickable card, not inside it", () => {
    render(CardDecorated);

    const card = screen.getByRole("link", { name: "Quarterly report" });
    const wrapper = card.parentElement;
    expect(wrapper).toHaveClass("bx--card__wrapper");
    const decorator = wrapper?.querySelector(".bx--card__decorator");
    expect(decorator).not.toBeNull();
    expect(card.contains(decorator ?? null)).toBe(false);
    expect(decorator?.querySelector(".bx--ai-label")).not.toBeNull();
    expect(card).toHaveClass("bx--card--decorator", "bx--card--ai-label");
  });

  it("moves the decorator below top media, to the header's corner", async () => {
    const { rerender } = render(CardDecorated, { props: { media: true } });

    const decorator = document.querySelector<HTMLElement>(
      ".bx--card__decorator",
    );
    expect(decorator?.style.getPropertyValue("--ccs-card-media-block")).toBe(
      String(9 / 16),
    );

    // The media leaves, and the decorator returns to the card's corner.
    await rerender({ media: false });
    expect(decorator?.getAttribute("style")).toBeFalsy();
  });

  it.each([
    ["start", null],
    ["end", "40%"],
  ] as const)("clears horizontal media at the %s", (mediaPosition, inline) => {
    render(CardDecorated, {
      props: { media: true, horizontal: true, mediaPosition },
    });

    const decorator = document.querySelector<HTMLElement>(
      ".bx--card__decorator",
    );
    expect(decorator?.style.getPropertyValue("--ccs-card-media-block")).toBe(
      "",
    );
    expect(
      decorator?.style.getPropertyValue("--ccs-card-media-inline") || null,
    ).toBe(inline);
  });

  it("renders no wrapper without a decorator", () => {
    render(Card);

    const card = screen.getByTestId("card");
    expect(card.parentElement).not.toHaveClass("bx--card__wrapper");
    expect(card).not.toHaveClass("bx--card--decorator");
  });
});

describe("CardTitle", () => {
  it("renders the label and description around the title", () => {
    render(CardTitle);

    const title = screen.getByTestId("title");
    expect(
      [...title.children].map((child) => child.className.split(" ")[0]),
    ).toEqual([
      "bx--card__label",
      "bx--card__title-text-row",
      "bx--card__description",
    ]);
    expect(
      title.querySelector(".bx--card__title-text-row")?.getAttribute("style"),
    ).toBeFalsy();
  });

  it.each([
    [{}, 3],
    [{ sectionLevel: 2 }, 3],
    [{ sectionLevel: 4 }, 5],
    [{ sectionLevel: 6 }, 6],
    [{ headingLevel: 2 }, 2],
    [{ sectionLevel: 2, headingLevel: 4 }, 4],
  ] as const)("renders the title as a heading for %o", (props, level) => {
    render(CardTitle, { props });

    expect(
      screen.getByRole("heading", { name: "Quarterly report", level }),
    ).toHaveClass("bx--card__title-text-row");
  });

  it("truncates the title to one line at a maximum width", () => {
    render(CardTitle, { props: { titleTruncate: true, maxWidth: "12rem" } });

    const row = screen
      .getByTestId("title")
      .querySelector<HTMLElement>(".bx--card__title-text-row");
    assert(row);
    expect(row).toHaveClass("bx--card__title-text-row--truncate");
    expect(row).not.toHaveClass("bx--card__title-text-row--truncate-multi");
    expect(row.style.getPropertyValue("--ccs-card-title-max-width")).toBe(
      "12rem",
    );
    expect(row.style.getPropertyValue("--ccs-card-title-line-clamp")).toBe("");
  });

  it("clamps the title, label and description to a number of lines", () => {
    render(CardTitle, {
      props: { titleTruncate: 2, labelTruncate: 1, descriptionTruncate: 3 },
    });

    const title = screen.getByTestId("title");
    const [label, row, description] = [...title.children] as HTMLElement[];
    expect(row).toHaveClass("bx--card__title-text-row--truncate-multi");
    expect(row.style.getPropertyValue("--ccs-card-title-line-clamp")).toBe("2");
    expect(label).toHaveClass("bx--card__label--truncate-multi");
    expect(label.style.getPropertyValue("--ccs-card-label-line-clamp")).toBe(
      "1",
    );
    expect(description).toHaveClass("bx--card__description--truncate-multi");
    expect(
      description.style.getPropertyValue("--ccs-card-description-line-clamp"),
    ).toBe("3");
  });
});
