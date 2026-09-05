import { cleanup, render } from "@testing-library/svelte";
import { group, range, task } from "ostia";
import TagSetBench from "./fixtures/TagSetBench.svelte";

// TagSet.register() sorts by DOM order on every Tag onMount, same shape as
// UserAvatarGroup. Overflow measurement runs behind `tick()`, so this
// harness does not wait for it. Range capped at 100.
group("mount TagSet", () => {
  for (const size of range(10, 100)) {
    task(`${size} tags`, () => {
      render(TagSetBench, { props: { count: size } });
      cleanup();
    });
  }
});
