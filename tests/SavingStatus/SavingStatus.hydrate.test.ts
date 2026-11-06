// @vitest-environment node
// @depends-on src/SavingStatus/SavingStatus.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const savingStatus = fileURLToPath(
  new URL("../../src/SavingStatus/SavingStatus.svelte", import.meta.url),
);

const STATUSES = ["unsaved", "saving", "saved", "error", "offline"] as const;

let results: HydrateResult[];

beforeAll(async () => {
  results = await hydrateFixtures(
    STATUSES.map((status) => ({
      fixture: savingStatus,
      // A save a moment ago, so the client has no age to add.
      props: { status, savedAt: Date.now() },
    })),
  );
}, 120_000);

// The server renders the status it is given, and the client must start from
// the same one: a spinner that waited for its delay on the client would
// swap the server's nodes out.
it.each(STATUSES.map((status, index) => [status, index] as const))(
  "%s hydrates onto the server HTML unchanged",
  (_, index) => {
    const result = results[index];

    expect(result.hydrateError).toBeUndefined();
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.settledDiff).toEqual([]);
  },
);
