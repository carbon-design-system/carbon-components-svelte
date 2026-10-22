// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ChartTheme from "./ChartTheme.test.svelte";

it("renders the zone theme, and white for the page", () => {
  const { document } = renderSSR(ChartTheme);
  const chartThemeOf = (testid: string) =>
    document.querySelector(`[data-testid="${testid}"]`)?.textContent;

  expect(chartThemeOf("page")).toBe("white");
  expect(chartThemeOf("zone")).toBe("g100");
  expect(chartThemeOf("inner-zone")).toBe("g90");
});
