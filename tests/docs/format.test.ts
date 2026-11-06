// @vitest-environment node
import { createFormatter } from "../../docs/scripts/format";

describe("createFormatter", () => {
  it("formats calls made together in one run, failing only the code that doesn't parse", async () => {
    const format = createFormatter("svelte");
    const results = await Promise.allSettled([
      format("<Button   kind='primary'/>"),
      format("<Modal"),
      format("<script>\nlet a={b:1}\n</script>"),
    ]);
    expect(
      results.map((r) => (r.status === "fulfilled" ? r.value : "rejected")),
    ).toEqual([
      '<Button kind="primary" />\n',
      "rejected",
      "<script>\n  let a = { b: 1 };\n</script>\n",
    ]);
  });
});
