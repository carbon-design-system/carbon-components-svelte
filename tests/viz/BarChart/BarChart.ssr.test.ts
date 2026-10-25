import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createServer, type ViteDevServer } from "vite";

// The suite's setup assumes a DOM, so the server build is loaded through its
// own Vite instance instead of switching this file to the node environment.
let server: ViteDevServer;

const data = [
  { quarter: "Q1", region: "a", revenue: 40 },
  { quarter: "Q2", region: "a", revenue: 50 },
  { quarter: "Q1", region: "b", revenue: 80 },
  { quarter: "Q2", region: "b", revenue: 70 },
];

beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: path.resolve(__dirname, "../../.."),
    plugins: [svelte({ configFile: false })],
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
    logLevel: "silent",
    optimizeDeps: { noDiscovery: true },
  });
});

afterAll(async () => {
  await server?.close();
});

describe("BarChart on the server", () => {
  it("writes the same markup twice under one id, patterns included", async () => {
    const { render } = await server.ssrLoadModule("svelte/server");
    const { default: BarChart } = await server.ssrLoadModule(
      "/src/viz/BarChart/BarChart.svelte",
    );
    const props = {
      data,
      x: "quarter",
      y: "revenue",
      series: "region",
      title: "Revenue",
      patterns: "auto",
      id: "revenue-chart",
    };

    const first = render(BarChart, { props }).body;
    const second = render(BarChart, { props }).body;

    expect(first).toBe(second);
    expect(first).toContain('id="revenue-chart"');
    expect(first).toContain("url(#revenue-chart-pattern-1");
    expect(first).not.toContain("NaN");
  });
});
