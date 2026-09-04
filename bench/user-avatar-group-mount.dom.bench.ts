import { cleanup, render } from "@testing-library/svelte";
import { group, range, task } from "ostia";
import UserAvatarGroupBench from "./fixtures/UserAvatarGroupBench.svelte";

// UserAvatarGroup's `register` callback (called from each UserAvatar's
// onMount) does `items.update(current => sortByDomOrder([...current, {...}]))`
// — an O(n log n) sort (via `compareDocumentPosition`, real DOM calls, not
// layout-dependent) on every single registration. N avatars mounting one at a
// time therefore sums to roughly O(n^2 log n) sort work alone. On top of
// that, the `$: if (overlap && stackOrder === "first")` block re-walks every
// item in `$items` and writes a DOM style property on each registration too
// (O(n) per registration, so another O(n^2) of DOM writes). This is the same
// shape as the TreeView eager-mount and ContentSwitcher.add() traps: cheap at
// small N, invisible until someone renders a big roster.
//
// Range capped at 100, not 1000: a single mount at 300 avatars takes ~48s
// wall-clock (see the .context/perf/user-avatar-group.md follow-up note),
// and calibration wants many samples per point regardless of per-call cost
// — a 10..1000 range never finished after several minutes and had to be
// killed. 10..100 already makes the superlinear growth unambiguous within a
// runtime that can actually calibrate; the note also cites plain
// `performance.now()` spot-checks up to 300 avatars.
group("mount UserAvatarGroup, stackOrder=last", () => {
  for (const size of range(10, 100)) {
    task(`${size} avatars`, () => {
      render(UserAvatarGroupBench, { props: { count: size, max: 0 } });
      cleanup();
    });
  }
});
