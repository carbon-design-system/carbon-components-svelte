import { render, screen } from "@testing-library/svelte";
import PageHeader from "./PageHeader.test.svelte";

describe("PageHeader", () => {
  it("renders the title and subtitle", () => {
    render(PageHeader);

    expect(screen.getByText("Databases")).toBeInTheDocument();
    expect(
      screen.getByText("Manage your database instances"),
    ).toBeInTheDocument();
  });

  it("renders the title as a heading", () => {
    render(PageHeader);

    expect(
      screen.getByRole("heading", { name: "Databases" }),
    ).toBeInTheDocument();
  });

  it("renders as a header element and binds ref", () => {
    render(PageHeader);

    expect(screen.getByTestId("basic").tagName).toBe("HEADER");
    expect(screen.getByTestId("ref-tag")).toHaveTextContent("HEADER");
  });

  it("applies sticky position and a 0 top offset", () => {
    render(PageHeader);

    const node = screen.getByTestId("sticky");
    expect(node).toHaveClass("bx--page-header");
    expect(node).toHaveClass("bx--box-position-sticky");
    expect(node).toHaveClass("bx--box-top-0");
    expect(screen.getByTestId("basic")).not.toHaveClass(
      "bx--box-position-sticky",
    );
  });

  it("offsets a sticky header by stickyOffset", () => {
    render(PageHeader);

    const node = screen.getByTestId("sticky-offset");
    expect(node).toHaveClass("bx--box-position-sticky");
    expect(node).not.toHaveClass("bx--box-top-0");
    expect(node.style.top).toBe("3rem");
  });

  it("ignores stickyOffset when the header is not sticky", () => {
    render(PageHeader);

    const node = screen.getByTestId("offset-not-sticky");
    expect(node).not.toHaveClass("bx--box-position-sticky");
    expect(node.style.top).toBe("");
  });

  it("uses a smaller title for size sm", () => {
    render(PageHeader);

    const small = screen.getByTestId("small");
    expect(small).toHaveClass("bx--page-header--sm");
    expect(small.querySelector("h1")).toHaveClass(
      "bx--type-productive-heading-03",
    );

    const basic = screen.getByTestId("basic");
    expect(basic).not.toHaveClass("bx--page-header--sm");
    expect(basic.querySelector("h1")).toHaveClass(
      "bx--type-productive-heading-04",
    );
  });

  it("defaults to the background fill with a divider", () => {
    render(PageHeader);

    const basic = screen.getByTestId("basic");
    expect(basic).toHaveClass("bx--box-fill-background");
    expect(basic).toHaveClass("bx--page-header--divider");
  });

  it("applies a custom fill and hides the divider", () => {
    render(PageHeader);

    const layer = screen.getByTestId("layer");
    expect(layer).toHaveClass("bx--box-fill-layer-01");
    expect(layer).not.toHaveClass("bx--box-fill-background");
    expect(layer).not.toHaveClass("bx--page-header--divider");
  });

  it("renders slotted breadcrumb and actions content", () => {
    render(PageHeader);

    const withSlots = screen.getByTestId("with-slots");
    expect(
      withSlots.querySelector(".bx--page-header__breadcrumb-row"),
    ).toHaveTextContent("Home");
    expect(
      withSlots.querySelector(".bx--page-header__actions"),
    ).toHaveTextContent("Create");
  });

  it("omits the breadcrumb and actions rows when the slots are empty", () => {
    render(PageHeader);

    const basic = screen.getByTestId("basic");
    expect(basic.querySelector(".bx--page-header__breadcrumb-row")).toBeNull();
    expect(basic.querySelector(".bx--page-header__actions")).toBeNull();
    expect(basic.querySelector(".bx--page-header__tabs-row")).toBeNull();
  });

  it("renders titleStart and titleEnd around the title", () => {
    render(PageHeader);

    const line = screen
      .getByTestId("rich")
      .querySelector(".bx--page-header__title-line");
    expect(line?.children).toHaveLength(3);
    expect(line?.children[0]).toHaveClass("bx--page-header__title-start");
    expect(line?.children[0]).toHaveTextContent("Icon");
    expect(line?.children[1]).toHaveTextContent("Rich");
    expect(line?.children[2]).toHaveClass("bx--page-header__title-end");
    expect(line?.children[2]).toHaveTextContent("Running");
  });

  it("renders the description below the title", () => {
    render(PageHeader);

    const description = screen
      .getByTestId("rich")
      .querySelector(".bx--page-header__description");
    expect(description?.tagName).toBe("DIV");
    expect(description).toHaveTextContent("Longer description");
  });

  it("renders breadcrumbEnd without a breadcrumb", () => {
    render(PageHeader);

    const row = screen
      .getByTestId("rich")
      .querySelector(".bx--page-header__breadcrumb-row");
    expect(
      row?.querySelector(".bx--page-header__breadcrumb-end"),
    ).toContainElement(screen.getByRole("button", { name: "Share" }));
  });

  it("omits the optional title and description wrappers when unused", () => {
    render(PageHeader);

    expect(document.querySelector(".bx--page-header__body")).toBeNull();

    const basic = screen.getByTestId("basic");
    expect(basic.querySelector(".bx--page-header__title-start")).toBeNull();
    expect(basic.querySelector(".bx--page-header__title-end")).toBeNull();
    expect(basic.querySelector(".bx--page-header__description")).toBeNull();
    expect(basic.querySelector(".bx--page-header__breadcrumb-end")).toBeNull();
  });

  it("renders the eyebrow above the title", () => {
    render(PageHeader);

    const group = screen
      .getByTestId("eyebrow")
      .querySelector(".bx--page-header__title-group");
    const eyebrow = group?.firstElementChild;
    expect(eyebrow).toHaveClass("bx--page-header__eyebrow");
    expect(eyebrow).toHaveClass("bx--type-label-01");
    expect(eyebrow).toHaveTextContent("Resources");
    expect(eyebrow?.querySelector("svg")).toBeNull();
    expect(eyebrow?.nextElementSibling).toHaveClass(
      "bx--page-header__title-line",
    );
  });

  it("renders the eyebrow icon before the eyebrow text", () => {
    render(PageHeader);

    const eyebrow = screen
      .getByTestId("eyebrow-icon")
      .querySelector(".bx--page-header__eyebrow");
    expect(eyebrow?.firstElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(eyebrow?.lastElementChild).toHaveTextContent("Resources");
  });

  it("omits the eyebrow when unset", () => {
    render(PageHeader);

    expect(
      screen.getByTestId("basic").querySelector(".bx--page-header__eyebrow"),
    ).toBeNull();
  });

  it("renders the meta row after the title row", () => {
    render(PageHeader);

    const meta = screen
      .getByTestId("rich")
      .querySelector(".bx--page-header__meta");
    expect(meta).toHaveTextContent("us-south");
    expect(meta?.previousElementSibling).toHaveClass(
      "bx--page-header__title-row",
    );
    expect(
      screen.getByTestId("basic").querySelector(".bx--page-header__meta"),
    ).toBeNull();
  });

  it("renders the tabs row for tabsEnd alone", () => {
    render(PageHeader);

    const row = screen
      .getByTestId("tabs-end-only")
      .querySelector(".bx--page-header__tabs-row");
    expect(row?.querySelector(".bx--page-header__tabs-end")).toHaveTextContent(
      "Range",
    );
    expect(
      screen
        .getByTestId("basic")
        .querySelector(".bx--page-header__tabs-row--with-end"),
    ).toBeNull();
    expect(
      screen.getByTestId("basic").querySelector(".bx--page-header__tabs-end"),
    ).toBeNull();
  });
});
