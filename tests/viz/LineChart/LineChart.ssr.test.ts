import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createServer, type ViteDevServer } from "vite";

// The suite's setup assumes jsdom, so the server build is loaded through its
// own Vite instance instead of switching this file to the node environment.
let server: ViteDevServer;

const data = [
  { day: 0, region: "a", revenue: 40 },
  { day: 1, region: "a", revenue: 50 },
  { day: 2, region: "a", revenue: 60 },
  { day: 0, region: "b", revenue: 80 },
  { day: 1, region: "b", revenue: 70 },
  { day: 2, region: "b", revenue: 65 },
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

describe("LineChart on the server", () => {
  it("renders the complete chart with no DOM", async () => {
    const { render } = await server.ssrLoadModule("svelte/server");
    const { default: LineChart } = await server.ssrLoadModule(
      "/src/viz/LineChart/LineChart.svelte",
    );

    const { body } = render(LineChart, {
      props: {
        data,
        x: "day",
        y: "revenue",
        series: "region",
        title: "Revenue",
      },
    });

    // Laid out at the nominal width until a browser measures the container.
    expect(body).toContain('viewBox="0 0 640 288"');
    expect(body.match(/<path[^>]*\sd="M[^"]+"/g)).toHaveLength(2);
    expect(body).toContain("bx--viz-axis__label");
    expect(body).toContain('aria-pressed="true"');
    expect(body).not.toContain("NaN");
  });
});
