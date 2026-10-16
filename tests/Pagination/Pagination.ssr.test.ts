// @vitest-environment node
import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
import { renderSSR } from "../utils/ssr";

describe("Pagination server render", () => {
  // Select sets its value once mounted, so before hydration the page
  // select showed its first option, page 1, whatever `page` was.
  it("selects the current page in the page select", () => {
    const { document } = renderSSR(Pagination, {
      totalItems: 120,
      pageSize: 10,
      page: 3,
    });

    const pages = document.querySelector("select.bx--select__page-number");
    const selected = [
      ...(pages?.querySelectorAll("option[selected]") ?? []),
    ].map((option) => option.getAttribute("value"));
    expect(selected).toEqual(["3"]);
  });
});
