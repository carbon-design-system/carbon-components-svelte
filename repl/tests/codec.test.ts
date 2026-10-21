import { expect, test } from "bun:test";
import { inflateRawSync } from "node:zlib";
import { encodeHash } from "../src/codec.js";

test("encodeHash round-trips through deflate-raw + base64url", async () => {
  const state = {
    files: [
      { name: "App.svelte", source: "<script>\n  let n = 0;\n</script>\n" },
    ],
    versions: { ccs: "local", svelte: "5.57.1", icons: "13.15.0" },
    options: { theme: "g100" },
  };
  const hash = await encodeHash("x", state);
  expect(hash.startsWith("x")).toBe(true);
  expect(hash).toMatch(/^x[\w-]+$/);
  const payload = JSON.parse(
    inflateRawSync(Buffer.from(hash.slice(1), "base64url")).toString(),
  );
  expect(payload).toEqual({
    f: [["App.svelte", state.files[0].source]],
    v: state.versions,
    o: state.options,
  });
});
