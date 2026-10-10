import {
  buildRadar,
  nearestSpoke,
} from "../../../src/viz/RadarChart/radar-geometry.js";

type Row = { skill: string; who: string; score: number };

const rows: Row[] = [
  { skill: "Speed", who: "a", score: 80 },
  { skill: "Power", who: "a", score: 40 },
  { skill: "Range", who: "a", score: 60 },
  { skill: "Armor", who: "a", score: 20 },
  { skill: "Speed", who: "b", score: 30 },
  { skill: "Power", who: "b", score: 90 },
  { skill: "Range", who: "b", score: 10 },
];
const base = {
  axis: (row: Row) => row.skill,
  value: (row: Row) => row.score,
  series: (row: Row) => row.who,
  radius: 100,
  cx: 150,
  cy: 150,
};

describe("buildRadar", () => {
  test("puts a spoke per axis value, clockwise from 12 o'clock", () => {
    const radar = buildRadar(rows, base);

    expect(radar.axes.map((a) => [a.key, a.x, a.y])).toEqual([
      ["Speed", 150, 50],
      ["Power", 250, 150],
      ["Range", 150, 250],
      ["Armor", 50, 150],
    ]);
    expect(radar.axes.map((a) => a.anchor)).toEqual([
      "middle",
      "start",
      "middle",
      "end",
    ]);
  });

  test("shares one scale from zero, rounded out, with a ring per tick", () => {
    const radar = buildRadar(rows, base);

    expect(radar.max).toBe(100);
    expect(radar.rings.map((ring) => ring.value)).toEqual([
      20, 40, 60, 80, 100,
    ]);
    expect(radar.rings.at(-1)?.points).toBe("150,50 250,150 150,250 50,150");
  });

  test("draws a polygon per series, with zero where it has no row", () => {
    const radar = buildRadar(rows, base);
    const [a, b] = radar.series;

    expect(a.values).toEqual([80, 40, 60, 20]);
    expect(a.points).toBe("150,70 190,150 150,210 130,150");
    expect(b.values).toEqual([30, 90, 10, 0]);
    expect(b.vertices[3]).toEqual({ x: 150, y: 150, value: 0 });
    expect(a.color).not.toBe(b.color);
  });

  test("leaves a hidden series out of the scale but keeps it listed", () => {
    const radar = buildRadar(rows, { ...base, hidden: ["b"] });

    expect(radar.max).toBe(80);
    expect(radar.series.map((s) => [s.key, s.hidden])).toEqual([
      ["a", false],
      ["b", true],
    ]);
  });

  test("honors a fixed end and clamps a value past it", () => {
    const radar = buildRadar(rows, { ...base, max: 50 });

    expect(radar.max).toBe(50);
    expect(radar.series[0].vertices[0]).toEqual({ x: 150, y: 50, value: 80 });
  });

  test("is empty for no rows", () => {
    const radar = buildRadar([], base);

    expect(radar.max).toBe(1);
    expect(radar.axes).toEqual([]);
    expect(radar.series).toEqual([]);
    expect(radar.rings.every((ring) => ring.points === "")).toBe(true);
  });
});

describe("nearestSpoke", () => {
  test("picks a spoke by angle, wrapping past the last one", () => {
    expect(nearestSpoke(150, 10, 150, 150, 4)).toBe(0);
    expect(nearestSpoke(290, 150, 150, 150, 4)).toBe(1);
    expect(nearestSpoke(150, 290, 150, 150, 4)).toBe(2);
    expect(nearestSpoke(10, 150, 150, 150, 4)).toBe(3);
    // Just left of 12 o'clock is still the first spoke.
    expect(nearestSpoke(140, 10, 150, 150, 4)).toBe(0);
    expect(nearestSpoke(0, 0, 150, 150, 0)).toBe(-1);
  });
});
