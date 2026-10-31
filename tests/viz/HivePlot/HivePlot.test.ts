import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import HivePlot from "./HivePlot.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/HivePlot/hive-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/HivePlot/hive-geometry.js")
      >();
    return {
      ...actual,
      buildHive: (...args: Parameters<typeof actual.buildHive>) => {
        geometry.calls += 1;
        return actual.buildHive(...args);
      },
    };
  },
);

const chart = () =>
  screen.getByRole("application", { name: "Runtime topology" });
const nodes = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-hive__node"));
const links = () =>
  Array.from(document.querySelectorAll<SVGPathElement>(".bx--viz-hive__link"));
const items = () =>
  within(screen.getByTestId("hive"))
    .getAllByRole("listitem", { hidden: true })
    .map((item) => item.textContent?.replace(/\s+/g, " ").trim());

beforeEach(() => {
  geometry.calls = 0;
});

describe("HivePlot", () => {
  it("draws an axis per kind with a legend count, a dot per node on its axis, and a curve per link", () => {
    render(HivePlot);

    expect(
      Array.from(document.querySelectorAll(".bx--viz-hive__axis-label")).map(
        (n) => n.textContent?.trim(),
      ),
    ).toEqual(["service", "datastore", "queue"]);
    expect(nodes()).toHaveLength(5);
    expect(links()).toHaveLength(5);
    expect(items()).toContain("service (2)");
    expect(items()).toContain("Node: worker, service, 3 links");
    expect(items()).toContain("Link: api to pg: 120");
    // Nodes on one axis share its color; a link takes its source's.
    expect(nodes()[0].style.getPropertyValue("--bx-viz-color")).toBe(
      nodes()[1].style.getPropertyValue("--bx-viz-color"),
    );
    expect(links()[0].style.getPropertyValue("--bx-viz-color")).toBe(
      nodes()[0].style.getPropertyValue("--bx-viz-color"),
    );
    expect(links()[0].querySelector("title")).toHaveTextContent(
      "api to pg: 120",
    );
  });

  it("walks the nodes with the keyboard, jumping axes with Right, lighting the links that touch them, without laying out again", async () => {
    const onhover = vi.fn();
    render(HivePlot, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}");
    // The service axis holds api (2 links) then worker (3 links), center out.
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "api", axis: "service", degree: 2 }),
    );
    expect(
      links().filter((l) => l.classList.contains("bx--viz-hive__link--active")),
    ).toHaveLength(2);
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "api, service, 2 links",
    );

    await user.keyboard("{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ axis: "datastore" }),
    );
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ axis: "queue" }),
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("selects on click and Enter with the node's links in the detail", async () => {
    const onselect = vi.fn();
    render(HivePlot, { onselect });

    await fireEvent.click(nodes()[1]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        node: expect.objectContaining({ id: "worker" }),
        links: [
          expect.objectContaining({
            source: "worker",
            target: "jobs",
            value: 40,
          }),
          expect.objectContaining({ source: "jobs", target: "worker" }),
          expect.objectContaining({ source: "worker", target: "pg" }),
        ],
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("worker");
    expect(nodes()[1]).toHaveClass("bx--viz-hive__node--selected");

    chart().focus();
    await user.keyboard("{End}{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("jobs");
  });

  it("places nodes by a given position instead of degree", () => {
    render(HivePlot, { byLoad: true });

    const y = (name: string) =>
      Number(
        nodes()
          .find((n) => n.querySelector("title")?.textContent?.startsWith(name))
          ?.getAttribute("transform")
          ?.match(/ ([\d.-]+)\)/)?.[1],
      );
    // On the top axis y is negative and larger in size farther out: api
    // (load 80) sits outside worker (load 20), where by degree it was inside.
    expect(y("api")).toBeLessThan(y("worker"));
    expect(items()).toContain("Node: api, service, 2 links");
  });
});
