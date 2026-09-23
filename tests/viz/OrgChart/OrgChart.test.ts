import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import OrgChart from "./OrgChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/OrgChart/org-geometry.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/OrgChart/org-geometry.js")
    >();
  return {
    ...actual,
    buildOrg: (...args: Parameters<typeof actual.buildOrg>) => {
      geometry.calls += 1;
      return actual.buildOrg(...args);
    },
  };
});

const chart = () =>
  screen.getByRole("application", { name: "Engineering org" });
const nodes = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-org__node"));
const labels = () =>
  nodes().map((node) =>
    node.querySelector(".bx--viz-org__label")?.textContent?.trim(),
  );
const links = () =>
  Array.from(document.querySelectorAll<SVGPathElement>(".bx--viz-org__link"));
const items = () =>
  within(screen.getByTestId("org"))
    .getAllByRole("listitem", { hidden: true })
    .map((item) => item.textContent?.replace(/\s+/g, " ").trim());

beforeEach(() => {
  geometry.calls = 0;
});

describe("OrgChart", () => {
  it("draws a card per row, top down in reading order, with two lines and an elbow link per report", () => {
    render(OrgChart);

    expect(labels()).toEqual([
      "A. Rivera",
      "K. Chen",
      "M. Lee",
      "S. Okafor",
      "J. Patel",
      "S. Ng",
    ]);
    expect(
      nodes()[0].querySelector(".bx--viz-org__sublabel"),
    ).toHaveTextContent("VP Engineering");
    expect(links()).toHaveLength(5);
    expect(links()[0].getAttribute("d")).toMatch(/^M[\d.]+,52V72H[\d.]+V92$/);
    const y = (node: SVGGElement) =>
      Number(node.getAttribute("transform")?.match(/ ([\d.]+)\)/)?.[1]);
    expect(y(nodes()[0])).toBe(0);
    expect(y(nodes()[1])).toBe(92);
    expect(y(nodes()[2])).toBe(184);
    expect(items()[0]).toBe(
      "Node: A. Rivera, VP Engineering, level 1, 2 reports, expanded",
    );
    expect(items()[2]).toBe(
      "Node: M. Lee, Observability, level 3, reports to K. Chen",
    );
  });

  it("walks the cards with the keyboard and folds with Left, without laying out until it folds", async () => {
    const onhover = vi.fn();
    const ontoggle = vi.fn();
    render(OrgChart, { onhover, ontoggle });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "plat", depth: 1, children: 2 }),
    );
    expect(nodes()[1]).toHaveClass("bx--viz-org__node--active");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "K. Chen, Director, Platform, level 2, reports to A. Rivera, 2 reports, expanded",
    );
    expect(
      links().filter((path) =>
        path.classList.contains("bx--viz-org__link--active"),
      ),
    ).toHaveLength(3);
    expect(geometry.calls).toBe(built);

    await user.keyboard("{ArrowLeft}");
    expect(ontoggle).toHaveBeenCalledWith({ id: "plat", collapsed: true });
    expect(screen.getByTestId("collapsed")).toHaveTextContent("plat");
    expect(labels()).toEqual(["A. Rivera", "K. Chen", "J. Patel", "S. Ng"]);
    expect(nodes()[1]).toHaveClass("bx--viz-org__node--collapsed");
    expect(
      nodes()[1].querySelector(".bx--viz-org__toggle-text"),
    ).toHaveTextContent("+2");
    expect(geometry.calls).toBeGreaterThan(built);

    // Right unfolds, then steps into the first report; Left on a leaf
    // steps back up to the manager.
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("collapsed")).toHaveTextContent("");
    await user.keyboard("{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "obs" }),
    );
    await user.keyboard("{ArrowLeft}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "plat" }),
    );
  });

  it("selects on click and Enter, folds on double click or on the toggle", async () => {
    const onselect = vi.fn();
    render(OrgChart, { onselect });

    await fireEvent.click(nodes()[4]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        node: expect.objectContaining({
          id: "prod",
          label: "J. Patel",
          sublabel: "Director, Product",
          parentId: "vp",
        }),
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("prod");
    expect(nodes()[4]).toHaveClass("bx--viz-org__node--selected");

    await fireEvent.dblClick(nodes()[1]);
    expect(screen.getByTestId("collapsed")).toHaveTextContent("plat");

    const toggle = nodes()[1].querySelector(".bx--viz-org__toggle") as Element;
    await fireEvent.click(toggle);
    expect(screen.getByTestId("collapsed")).toHaveTextContent("");
    // The toggle click does not select the card.
    expect(screen.getByTestId("selected")).toHaveTextContent("prod");
  });

  it("is grayscale without a group, and colors the card edge by group with a legend", async () => {
    const { rerender } = render(OrgChart);
    expect(nodes()[1]).not.toHaveClass("bx--viz-org__node--grouped");
    expect(document.querySelector(".bx--viz-org__accent")).toBeNull();
    expect(
      screen.getByTestId("org").querySelector(".bx--viz-treemap__legend"),
    ).toBeNull();

    await rerender({ withGroups: true });
    const color = (i: number) =>
      nodes()[i].style.getPropertyValue("--bx-viz-color");
    expect(nodes()[0]).not.toHaveClass("bx--viz-org__node--grouped");
    expect(nodes()[1]).toHaveClass("bx--viz-org__node--grouped");
    expect(nodes()[1].querySelector(".bx--viz-org__accent")).not.toBeNull();
    expect(color(1)).toBe(color(2));
    expect(color(1)).not.toBe(color(4));
    expect(
      Array.from(
        screen
          .getByTestId("org")
          .querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((n) => n.textContent?.trim()),
    ).toEqual(["Platform", "Product"]);
    expect(items().find((item) => item.startsWith("Node: K. Chen"))).toContain(
      "Platform, reports to A. Rivera",
    );
  });
});
