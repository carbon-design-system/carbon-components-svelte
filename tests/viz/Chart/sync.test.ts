import { joinSync } from "../../../src/viz/Chart/sync.js";

describe("joinSync", () => {
  test("tells the other members, never the publisher", () => {
    const a = vi.fn();
    const b = vi.fn();
    const c = vi.fn();
    const memberA = joinSync("ops", a);
    const memberB = joinSync("ops", b);
    const memberC = joinSync("other", c);

    memberA.publish({ kind: "hover", x: 42, shown: false });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith({ kind: "hover", x: 42, shown: false });
    expect(c).not.toHaveBeenCalled();

    memberB.publish({ kind: "hover", x: null, shown: false });
    expect(a).toHaveBeenCalledWith({ kind: "hover", x: null, shown: false });
    for (const member of [memberA, memberB, memberC]) member.leave();
  });

  test("stops hearing after leaving", () => {
    const a = vi.fn();
    const memberA = joinSync("ops", a);
    const memberB = joinSync("ops", () => {});

    memberA.leave();
    memberB.publish({ kind: "hover", x: 1, shown: false });
    expect(a).not.toHaveBeenCalled();
    memberB.leave();
  });
});
