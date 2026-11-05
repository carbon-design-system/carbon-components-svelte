// @vitest-environment node
import {
  claimHoverCard,
  isFocusVisible,
  releaseHoverCard,
} from "../../src/utils/hover-card.js";

describe("claimHoverCard", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("closes the card that held the slot", () => {
    const first = { close: vi.fn() };
    const second = { close: vi.fn() };
    claimHoverCard(first);
    claimHoverCard(second);
    expect(first.close).toHaveBeenCalledTimes(1);
    expect(second.close).not.toHaveBeenCalled();
    releaseHoverCard(second);
  });

  it("does not close a card that released the slot", () => {
    const first = { close: vi.fn() };
    claimHoverCard(first);
    releaseHoverCard(first);
    claimHoverCard({ close: vi.fn() });
    expect(first.close).not.toHaveBeenCalled();
  });

  it("claims nothing on the server", () => {
    vi.unstubAllGlobals();
    const first = { close: vi.fn() };
    claimHoverCard(first);
    claimHoverCard({ close: vi.fn() });
    expect(first.close).not.toHaveBeenCalled();
  });
});

describe("isFocusVisible", () => {
  it("counts every focus where the selector is unknown", () => {
    const node = {
      matches() {
        throw new SyntaxError("unknown selector");
      },
    } as unknown as Element;
    expect(isFocusVisible(node)).toBe(true);
  });

  it("follows :focus-visible", () => {
    const node = { matches: (s: string) => s === ":focus-visible" };
    expect(isFocusVisible(node as unknown as Element)).toBe(true);
    expect(isFocusVisible({ matches: () => false } as unknown as Element)).toBe(
      false,
    );
  });
});
