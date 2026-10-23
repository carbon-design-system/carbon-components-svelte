import { isTruncated, observeTruncation } from "../../src/utils/truncation.js";

function sized(size: {
  scrollWidth?: number;
  clientWidth?: number;
  scrollHeight?: number;
  clientHeight?: number;
}) {
  const node = document.createElement("p");
  for (const [key, value] of Object.entries(size)) {
    Object.defineProperty(node, key, { value });
  }
  return node;
}

describe("isTruncated", () => {
  it.each([
    [200, 40, true],
    [41, 40, true],
    [40, 40, false],
    [0, 0, false],
  ])(
    "one line: scrollWidth %i, clientWidth %i: %s",
    (scrollWidth, clientWidth, want) => {
      const node = sized({
        scrollWidth,
        clientWidth,
        scrollHeight: 30,
        clientHeight: 20,
      });
      expect(isTruncated(node)).toBe(want);
    },
  );

  it.each([
    [96, 48, true],
    [49, 48, true],
    [48, 48, false],
    [0, 0, false],
  ])(
    "multiline: scrollHeight %i, clientHeight %i: %s",
    (scrollHeight, clientHeight, want) => {
      const node = sized({
        scrollHeight,
        clientHeight,
        scrollWidth: 300,
        clientWidth: 200,
      });
      expect(isTruncated(node, true)).toBe(want);
    },
  );
});

describe("observeTruncation", () => {
  it("reports after the first layout and on text changes, until stopped", async () => {
    const node = document.createElement("p");
    node.textContent = "us-south";
    const callback = vi.fn();

    const stop = observeTruncation(node, callback);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledOnce();

    node.textContent = "us-south, eu-de";
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(2);

    node.firstChild?.replaceWith("us-south, eu-de, jp-tok");
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(3);

    stop();
    node.textContent = "us-east";
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(3);
  });
});
