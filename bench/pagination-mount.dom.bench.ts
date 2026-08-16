import { cleanup, render } from "@testing-library/svelte";
import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
import { bench, run } from "mitata";

// Pagination's page <select> used to mount a SelectItem (Svelte component +
// context subscriber) per windowed page, default pageWindow=1000. Native
// <option> elements keep the same windowed UX without that per-page
// component cost. 100_000 items at pageSize 10 is 10_000 pages, capped
// at pageWindow.

it("benchmarks mounting Pagination with a large page window", async () => {
  bench("mount Pagination, 100000 items, default pageWindow", () => {
    render(Pagination, { props: { totalItems: 100_000 } });
    cleanup();
  });

  bench("mount Pagination, 100000 items, pageWindow 100", () => {
    render(Pagination, {
      props: { totalItems: 100_000, pageWindow: 100 },
    });
    cleanup();
  });

  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 120_000);
