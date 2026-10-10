import { joinSync } from "../../../src/viz/Chart/sync.js";

describe("joinSync", () => {
  test("tells the other members, never the publisher", () => {
    const a = vi.fn();
    const b = vi.fn();
    const c = vi.fn();
    const memberA = joinSync("ops", a);
    const memberB = joinSync("ops", b);
    const memberC = joinSync("other", c);

    memberA.publish(42);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith(42);
    expect(c).not.toHaveBeenCalled();

    memberB.publish(null);
    expect(a).toHaveBeenCalledWith(null);
    for (const member of [memberA, memberB, memberC]) member.leave();
  });

  test("stops hearing after leaving", () => {
    const a = vi.fn();
    const memberA = joinSync("ops", a);
    const memberB = joinSync("ops", () => {});

    memberA.leave();
    memberB.publish(1);
    expect(a).not.toHaveBeenCalled();
    memberB.leave();
  });
});
