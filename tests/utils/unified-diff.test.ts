// @vitest-environment node
import { parseUnifiedDiff } from "../../src/utils/unified-diff.js";

const GIT_PATCH = `diff --git a/src/a.js b/src/a.js
index 83db48f..bf2a1c3 100644
--- a/src/a.js
+++ b/src/a.js
@@ -1,5 +1,6 @@ function main() {
 one
-two
+TWO
+two and a half
 three
-- four
 five
diff --git a/b.txt b/b.txt
new file mode 100644
--- /dev/null
+++ b/b.txt
@@ -0,0 +1,2 @@
+hello
+world
\\ No newline at end of file
`;

describe("parseUnifiedDiff", () => {
  it("reads files, hunks and lines from a git patch", () => {
    const files = parseUnifiedDiff(GIT_PATCH);
    expect(files).toHaveLength(2);
    expect(files[0].oldPath).toBe("src/a.js");
    expect(files[0].newPath).toBe("src/a.js");
    const [hunk] = files[0].hunks;
    expect(hunk).toMatchObject({
      oldStart: 1,
      oldCount: 5,
      newStart: 1,
      newCount: 6,
      heading: "function main() {",
    });
    expect(hunk.lines.map((line) => line.type)).toEqual([
      "context",
      "delete",
      "insert",
      "insert",
      "context",
      "delete",
      "context",
    ]);
  });

  it("reads a removed line that starts with dashes as a line, not a header", () => {
    const [file] = parseUnifiedDiff(GIT_PATCH);
    expect(file.hunks[0].lines[5]).toEqual({ type: "delete", text: "- four" });
  });

  it("maps /dev/null to null and marks a missing newline", () => {
    const [, added] = parseUnifiedDiff(GIT_PATCH);
    expect(added.oldPath).toBeNull();
    expect(added.newPath).toBe("b.txt");
    expect(added.hunks[0].lines[1]).toEqual({
      type: "insert",
      text: "world",
      noNewline: true,
    });
  });

  it("defaults a missing hunk count to 1", () => {
    const [file] = parseUnifiedDiff("--- a\n+++ b\n@@ -3 +3 @@\n-x\n+y\n");
    expect(file.hunks[0]).toMatchObject({ oldCount: 1, newCount: 1 });
  });

  it("splits plain diff -u output into files by header pair", () => {
    const patch = [
      "--- a.txt\t2024-01-01",
      "+++ a.txt\t2024-01-02",
      "@@ -1 +1 @@",
      "-a",
      "+b",
      "--- c.txt",
      "+++ c.txt",
      "@@ -1 +1 @@",
      "-c",
      "+d",
      "",
    ].join("\n");
    const files = parseUnifiedDiff(patch);
    expect(files.map((file) => file.newPath)).toEqual(["a.txt", "c.txt"]);
  });

  it("accepts CRLF line endings and a stripped blank context line", () => {
    const patch = "--- a\r\n+++ b\r\n@@ -1,3 +1,3 @@\r\n a\r\n\r\n-c\r\n+d\r\n";
    const [file] = parseUnifiedDiff(patch);
    expect(file.hunks[0].lines).toEqual([
      { type: "context", text: "a" },
      { type: "context", text: "" },
      { type: "delete", text: "c" },
      { type: "insert", text: "d" },
    ]);
  });

  it("reports a binary file and ignores text it cannot read", () => {
    const files = parseUnifiedDiff(
      "diff --git a/i.png b/i.png\nBinary files a/i.png and b/i.png differ\n",
    );
    expect(files).toEqual([
      { oldPath: "i.png", newPath: "i.png", binary: true, hunks: [] },
    ]);
    expect(parseUnifiedDiff("not a patch")).toEqual([]);
  });
});
