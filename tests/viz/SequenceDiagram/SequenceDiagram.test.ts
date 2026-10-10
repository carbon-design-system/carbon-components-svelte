import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import SequenceDiagram from "./SequenceDiagram.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/SequenceDiagram/sequence-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/SequenceDiagram/sequence-geometry.js")
      >();
    return {
      ...actual,
      buildSequence: (...args: Parameters<typeof actual.buildSequence>) => {
        geometry.calls += 1;
        return actual.buildSequence(...args);
      },
    };
  },
);

const chart = () =>
  screen.getByRole("application", { name: "Create an order" });
const messages = () =>
  Array.from(
    document.querySelectorAll<SVGGElement>(".bx--viz-sequence__message"),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("SequenceDiagram", () => {
  it("draws an actor per participant and an arrow per message, replies dashed", () => {
    render(SequenceDiagram);

    expect(
      Array.from(
        document.querySelectorAll(".bx--viz-sequence__actor-label"),
      ).map((n) => n.textContent?.trim()),
    ).toEqual(["client", "api", "db"]);
    expect(
      document.querySelectorAll(".bx--viz-sequence__lifeline"),
    ).toHaveLength(3);
    expect(messages()).toHaveLength(5);
    expect(messages()[2]).toHaveClass("bx--viz-sequence__message--return");
    expect(
      messages()[0]
        .querySelector(".bx--viz-sequence__line")
        ?.getAttribute("marker-end"),
    ).toMatch(/^url\(#bx-viz-sequence-\d+\)$/);
  });

  it("lists every message in order, in words, for assistive technology", () => {
    render(SequenceDiagram);

    const items = within(screen.getByTestId("sequence"))
      .getAllByRole("listitem", { hidden: true })
      .map((item) => item.textContent?.replace(/\s+/g, " ").trim());
    expect(items).toEqual([
      "Message 1., POST /orders, from client to api",
      "Message 2., INSERT, from api to db",
      "Message 3., row, from db to api, returns",
      "Message 4., audit, api to itself",
      "Message 5., 201, from api to client, returns",
    ]);
  });

  it("moves message by message with the keyboard, without laying out again", async () => {
    const onhover = vi.fn();
    const onselect = vi.fn();
    render(SequenceDiagram, { onhover, onselect });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        step: 1,
        from: "api",
        to: "db",
        label: "INSERT",
      }),
    );
    expect(messages()[1]).toHaveClass("bx--viz-sequence__message--active");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "2., INSERT, from api to db",
    );

    await user.keyboard("{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ label: "INSERT" }),
      }),
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("colors actors by group with a legend, and draws a failure in the error color", async () => {
    const { rerender } = render(SequenceDiagram);
    expect(
      document.querySelector(".bx--viz-sequence__actor--grouped"),
    ).toBeNull();

    await rerender({
      groups: { client: "outside", api: "ours", db: "ours" },
      data: [
        { from: "client", to: "api", msg: "POST /orders" },
        { from: "api", to: "client", msg: "500", kind: "error" },
      ],
    });
    const actors = Array.from(
      document.querySelectorAll<SVGRectElement>(".bx--viz-sequence__actor"),
    );
    expect(
      actors.every((actor) =>
        actor.classList.contains("bx--viz-sequence__actor--grouped"),
      ),
    ).toBe(true);
    expect(actors).toHaveLength(2);
    expect(
      document.querySelectorAll(".bx--viz-sequence__lifeline--grouped"),
    ).toHaveLength(2);
    expect(actors[0].style.getPropertyValue("--bx-viz-color")).not.toBe(
      actors[1].style.getPropertyValue("--bx-viz-color"),
    );
    expect(
      Array.from(
        screen
          .getByTestId("sequence")
          .querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((n) => n.textContent?.trim()),
    ).toEqual(["outside", "ours"]);
    expect(messages()[1]).toHaveClass("bx--viz-sequence__message--error");
    expect(
      screen.getByTestId("sequence").querySelectorAll("ol li")[1],
    ).toHaveTextContent("500, from api to client, fails");
  });

  it("follows the pointer onto a message", async () => {
    const onhover = vi.fn();
    render(SequenceDiagram, { onhover });

    await fireEvent.mouseEnter(messages()[3]);
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ label: "audit", to: "api" }),
    );
  });
});
