import { cleanup, render } from "@testing-library/svelte";
import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
import { task } from "ostia";

// Pagination's page <select> used to mount a SelectItem (Svelte component +
// context subscriber) per windowed page, default pageWindow=1000. Native
// <option> elements keep the same windowed UX without that per-page
// component cost. 100_000 items at pageSize 10 is 10_000 pages, capped
// at pageWindow.
task("mount Pagination, 100000 items, default pageWindow", () => {
  render(Pagination, { props: { totalItems: 100_000 } });
  cleanup();
});

task("mount Pagination, 100000 items, pageWindow 100", () => {
  render(Pagination, {
    props: { totalItems: 100_000, pageWindow: 100 },
  });
  cleanup();
});
