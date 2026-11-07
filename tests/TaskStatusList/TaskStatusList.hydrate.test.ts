// @vitest-environment node
// @depends-on src/TaskStatusList/TaskStatusList.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const list = fileURLToPath(
  new URL("../../src/TaskStatusList/TaskStatusList.svelte", import.meta.url),
);

const steps = [
  {
    id: "vpc",
    label: "Create VPC",
    status: "succeeded",
    startedAt: 0,
    endedAt: 12_000,
  },
  {
    id: "cluster",
    label: "Create cluster",
    status: "running",
    startedAt: 12_000,
    detail: "2 of 3 nodes ready",
  },
  { id: "ingress", label: "Install ingress", status: "pending" },
];

let results: HydrateResult[];

beforeAll(async () => {
  results = await hydrateFixtures([
    { fixture: list, props: { steps, "aria-label": "Cluster provisioning" } },
  ]);
}, 120_000);

// The server has no clock, so a running step has no time until the client
// mounts. Hydration keeps every node, and the time is the only thing added.
it("keeps the server's rows, and only adds the running time", () => {
  const [result] = results;

  expect(result.hydrateError).toBeUndefined();
  expect(result.identity.pct).toBe(100);
  expect(
    result.diffIgnoringIds.map(({ kind, after }) => [kind, after?.slice(0, 5)]),
  ).toEqual([["extra", "<time"]]);
  expect(result.serverHtml.match(/<time/g)).toHaveLength(1);
});
