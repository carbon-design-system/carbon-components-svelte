import { render, screen, within } from "@testing-library/svelte";
import KpiCard from "./KpiCard.test.svelte";

describe("KpiCard", () => {
  it("shows the name, the formatted value, and the change", () => {
    render(KpiCard);

    const card = screen.getByTestId("full");
    expect(card).toHaveClass("bx--viz-kpi", "bx--tile");
    expect(card.querySelector(".bx--viz-kpi__label")).toHaveTextContent(
      "Monthly revenue",
    );
    expect(card.querySelector(".bx--viz-kpi__value")).toHaveTextContent(
      "$1.3M",
    );
    const delta = card.querySelector(".bx--viz-delta");
    expect(delta).toHaveTextContent("+12.3%");
    expect(delta).toHaveTextContent("vs last month");
  });

  it("hides the trend from assistive technology but keeps the footer", () => {
    render(KpiCard);

    const card = screen.getByTestId("full");
    expect(card.querySelector(".bx--viz-kpi__chart")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      within(card).getByRole("img", { name: /Against target/ }),
    ).toBeInTheDocument();
    expect(within(card).queryByRole("img", { name: "Trend" })).toBeNull();
  });

  it("renders no delta, chart, or footer unless given", () => {
    render(KpiCard);

    const card = screen.getByTestId("bare");
    expect(card.querySelector(".bx--viz-kpi__value")).toHaveTextContent("412");
    expect(card.querySelector(".bx--viz-delta")).toBeNull();
    expect(card.querySelector(".bx--viz-kpi__chart")).toBeNull();
    expect(card.querySelector(".bx--viz-kpi__footer")).toBeNull();
  });

  it("becomes one link with an href, and passes the good direction on", () => {
    render(KpiCard);

    const link = screen.getByRole("link", { name: /Churn/ });
    expect(link).toHaveAttribute("href", "/churn");
    expect(link).toHaveClass("bx--viz-kpi");
    expect(link.querySelector(".bx--viz-delta")).toHaveClass(
      "bx--viz-delta--success",
    );
  });

  it("holds its place with a skeleton while loading, and writes a dash for no value", async () => {
    const { rerender } = render(KpiCard, { loading: true });

    const card = screen.getByTestId("full");
    expect(card).toHaveAttribute("aria-busy", "true");
    expect(card.querySelector(".bx--skeleton__text")).not.toBeNull();
    expect(card.querySelector(".bx--viz-kpi__value")).toBeNull();
    expect(card.querySelector(".bx--viz-delta")).toBeNull();

    await rerender({ loading: false, value: null });
    expect(card).not.toHaveAttribute("aria-busy");
    expect(card.querySelector(".bx--viz-kpi__value")).toHaveTextContent("–");
  });
});
