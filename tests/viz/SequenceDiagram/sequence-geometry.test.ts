import { buildSequence } from "../../../src/viz/SequenceDiagram/sequence-geometry.js";

type Row = {
  from: string;
  to: string;
  msg: string;
  kind?: string;
  step?: number;
};

const rows: Row[] = [
  { from: "client", to: "api", msg: "POST /orders" },
  { from: "api", to: "db", msg: "INSERT" },
  { from: "db", to: "api", msg: "row", kind: "return" },
  { from: "api", to: "api", msg: "audit" },
  { from: "api", to: "client", msg: "201", kind: "return" },
];
const options = {
  from: (row: Row) => row.from,
  to: (row: Row) => row.to,
  label: (row: Row) => row.msg,
  kind: (row: Row) => row.kind,
  actorWidth: 100,
  actorGap: 60,
  rowHeight: 40,
  top: 36,
};

describe("buildSequence", () => {
  test("places actors as first seen and one message per row", () => {
    const sequence = buildSequence(rows, options);
    expect(sequence.actors.map((actor) => [actor.name, actor.x])).toEqual([
      ["client", 50],
      ["api", 210],
      ["db", 370],
    ]);
    expect(sequence.messages.map((message) => message.y)).toEqual([
      76, 116, 156, 196, 236,
    ]);
    expect(sequence.messages[0]).toMatchObject({
      x1: 50,
      x2: 210,
      kind: "call",
      self: false,
    });
    expect(sequence.messages[0].d).toBe("M50,76L210,76");
    expect(sequence.messages[2].kind).toBe("return");
    expect(sequence.width).toBe(420);
    expect(sequence.height).toBe(276);
  });

  test("draws a message to oneself as a loop beside the lifeline", () => {
    const sequence = buildSequence(rows, options);
    const loop = sequence.messages[3];
    expect(loop.self).toBe(true);
    expect(loop.d).toBe("M210,184h36v24h-36");
    expect(loop.labelAnchor).toBe("start");
  });

  test("honors a given actor order and a message order", () => {
    const sequence = buildSequence(rows, {
      ...options,
      actors: ["db", "api"],
      order: (row: Row) => (row.msg === "201" ? -1 : 0),
    });
    expect(sequence.actors.map((actor) => actor.name)).toEqual([
      "db",
      "api",
      "client",
    ]);
    expect(sequence.messages[0].label).toBe("201");
  });
});
