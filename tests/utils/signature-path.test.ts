// @vitest-environment node
import {
  createStroke,
  fitFontSize,
  type SignaturePoint,
  simplify,
  strokePath,
  strokesToSvg,
  textToSvg,
} from "../../src/utils/signature-path.js";

describe("createStroke", () => {
  it("drops a sample that has barely moved", () => {
    const stroke = createStroke();

    expect(stroke.add(10, 10)).toBe(true);
    expect(stroke.add(10.2, 10.1)).toBe(false);
    expect(stroke.add(20, 10)).toBe(true);
    expect(stroke.points).toHaveLength(2);
  });

  it("draws a fast stroke thinner than a slow one", () => {
    const slow = createStroke();
    const fast = createStroke();
    for (let i = 0; i <= 10; i++) {
      slow.add(i * 2, 0, { time: i * 40 });
      fast.add(i * 40, 0, { time: i * 10 });
    }

    expect(fast.points.at(-1)?.[2]).toBeLessThan(slow.points.at(-1)?.[2] ?? 0);
  });

  it("follows a pen's pressure and ignores a mouse's", () => {
    const light = createStroke();
    const hard = createStroke();
    const mouse = createStroke();
    for (let i = 0; i <= 8; i++) {
      const time = i * 16;
      light.add(i * 5, 0, { time, pressure: 0.1, pointerType: "pen" });
      hard.add(i * 5, 0, { time, pressure: 0.95, pointerType: "pen" });
      mouse.add(i * 5, 0, { time, pressure: 0.95, pointerType: "mouse" });
    }
    const last = (points: SignaturePoint[]) => points.at(-1)?.[2] ?? 0;

    expect(last(hard.points)).toBeGreaterThan(last(light.points) * 1.8);
    // A mouse reports a constant pressure, so its width comes from speed.
    expect(last(mouse.points)).not.toBeCloseTo(last(hard.points), 1);
  });

  it("does not divide by zero when samples share a timestamp", () => {
    const stroke = createStroke();
    stroke.add(0, 0, { time: 100 });
    stroke.add(10, 0, { time: 100 });

    expect(Number.isFinite(stroke.points[1][2])).toBe(true);
  });

  it("keeps widths inside the min and max", () => {
    const stroke = createStroke({ minWidth: 1, maxWidth: 2 });
    for (let i = 0; i < 30; i++) stroke.add(i * 90, 0, { time: i });

    for (const [, , width] of stroke.points) {
      expect(width).toBeGreaterThanOrEqual(1);
      expect(width).toBeLessThanOrEqual(2);
    }
  });
});

describe("simplify", () => {
  const line: SignaturePoint[] = Array.from({ length: 50 }, (_, i) => [
    i,
    i * 0.01,
    2,
  ]);

  it("reduces a near-straight line to its ends", () => {
    expect(simplify(line)).toEqual([line[0], line[49]]);
  });

  it("keeps a corner", () => {
    const corner: SignaturePoint[] = [
      [0, 0, 2],
      [10, 0, 2],
      [20, 0, 2],
      [20, 10, 2],
      [20, 20, 2],
    ];

    expect(simplify(corner).map(([x, y]) => [x, y])).toEqual([
      [0, 0],
      [20, 0],
      [20, 20],
    ]);
  });

  it("handles a closed loop and a long stroke without recursion", () => {
    const loop: SignaturePoint[] = [
      [0, 0, 2],
      [10, 0, 2],
      [10, 10, 2],
      [0, 0, 2],
    ];
    const long: SignaturePoint[] = Array.from({ length: 20_000 }, (_, i) => [
      i,
      Math.sin(i / 50) * 40,
      2,
    ]);

    expect(simplify(loop).length).toBeGreaterThanOrEqual(3);
    expect(simplify(long).length).toBeLessThan(long.length);
  });
});

describe("strokePath", () => {
  const stroke: SignaturePoint[] = [
    [10, 10, 2],
    [30, 14, 3],
    [50, 10, 2],
  ];

  it("closes one shape with a half circle at each end", () => {
    const d = strokePath(stroke);

    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d.match(/A/g)).toHaveLength(2);
    expect(d.match(/M/g)).toHaveLength(1);
  });

  it("keeps the ribbon as wide as the line along a bend", () => {
    // The two edges must trace one curve. Sparse points on an arc once gave
    // edges that drifted apart, so the shape was far wider than the line.
    const arc: SignaturePoint[] = [
      [60, 124, 2],
      [99, 70, 2],
      [125, 85, 2],
      [138, 110, 2],
    ];
    const outline: Array<[number, number]> = [];
    let at: [number, number] = [0, 0];
    for (const [, command, args] of strokePath(arc).matchAll(
      /([MLQA])([^MLQAZ]*)/g,
    )) {
      const n = args.trim().split(/[ ,]+/).map(Number);
      if (command === "Q") {
        for (let t = 0.1; t <= 1; t += 0.1) {
          outline.push([
            (1 - t) ** 2 * at[0] + 2 * (1 - t) * t * n[0] + t * t * n[2],
            (1 - t) ** 2 * at[1] + 2 * (1 - t) * t * n[1] + t * t * n[3],
          ]);
        }
      }
      at = command === "A" ? [n[5], n[6]] : [n[n.length - 2], n[n.length - 1]];
      if (command !== "Q") outline.push(at);
    }
    let twiceArea = 0;
    for (let i = 0; i < outline.length; i++) {
      const [x1, y1] = outline[i];
      const [x2, y2] = outline[(i + 1) % outline.length];
      twiceArea += x1 * y2 - x2 * y1;
    }
    const length = arc
      .slice(1)
      .reduce(
        (sum, [x, y], i) => sum + Math.hypot(x - arc[i][0], y - arc[i][1]),
        0,
      );

    // A ribbon 2 wide along the line, give or take the corners it cuts.
    expect(Math.abs(twiceArea) / 2 / (length * 2)).toBeGreaterThan(0.7);
    expect(Math.abs(twiceArea) / 2 / (length * 2)).toBeLessThan(0.95);
  });

  it("draws a single point as a dot", () => {
    expect(strokePath([[5, 5, 2]])).toMatch(
      /^M4 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0Z$/,
    );
  });

  it("is empty for no points and never prints NaN", () => {
    expect(strokePath([])).toBe("");
    const same: SignaturePoint[] = [
      [1, 1, 2],
      [1, 1, 2],
    ];
    expect(strokePath(same)).not.toContain("NaN");
  });
});

describe("export documents", () => {
  const stroke: SignaturePoint[] = [
    [10, 10, 2],
    [50, 10, 2],
  ];

  it("writes one path per stroke on a viewBox of the pad's size", () => {
    const svg = strokesToSvg([stroke, stroke], {
      width: 600,
      height: 200,
      color: "#161616",
    });

    expect(svg).toContain('viewBox="0 0 600 200"');
    expect(svg).toContain('fill="#161616"');
    expect(svg.match(/<path /g)).toHaveLength(2);
    expect(svg).not.toContain("<rect");
  });

  it("adds a background only when asked", () => {
    const svg = strokesToSvg([stroke], {
      width: 600,
      height: 200,
      color: "#000",
      background: "#fff",
    });

    expect(svg).toContain('<rect width="600" height="200" fill="#fff"/>');
  });

  it("escapes a typed name and the font stack", () => {
    const svg = textToSvg('Ana "A" <Díaz> & Co', {
      width: 600,
      height: 200,
      color: "#000",
      fontFamily: '"Brush Script MT", cursive',
      fontSize: 60,
    });

    expect(svg).toContain("Ana &quot;A&quot; &lt;Díaz&gt; &amp; Co");
    expect(svg).toContain('font-family="&quot;Brush Script MT&quot;, cursive"');
    expect(svg).not.toContain("<Díaz>");
  });
});

describe("fitFontSize", () => {
  it("shrinks to fit and never exceeds the max", () => {
    const measure = (text: string) => text.length * 0.5;

    expect(fitFontSize("Ana", { maxWidth: 500, maxSize: 80, measure })).toBe(
      80,
    );
    expect(
      fitFontSize("A very long full legal name", {
        maxWidth: 400,
        maxSize: 80,
        measure,
      }),
    ).toBeCloseTo(400 / 13.5);
  });

  it("estimates without a canvas and keeps a floor", () => {
    expect(fitFontSize("", { maxWidth: 100, maxSize: 40 })).toBe(40);
    expect(
      fitFontSize("x".repeat(500), { maxWidth: 100, maxSize: 40, minSize: 10 }),
    ).toBe(10);
  });
});
