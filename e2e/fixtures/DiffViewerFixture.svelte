<script>
  import { DiffViewer } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  const before = `import { readFile } from "node:fs/promises";

// Load the settings for a project.
export async function loadSettings(path, options = {}) {
  const raw = await readFile(path, "utf8");
  const settings = JSON.parse(raw);
  if (!settings.name) {
    throw new Error("A project needs a name");
  }
  const retries = options.retries ?? 3;
  return { ...settings, retries };
}

export function describe(settings) {
  return settings.name + " (" + settings.retries + " retries)";
}

export function isEnabled(settings) {
  return settings.enabled !== false;
}
`;

  const after = `import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Load the settings for a project.
export async function loadSettings(path, options = {}) {
  const raw = await readFile(resolve(path), "utf8");
  const settings = JSON.parse(raw);
  if (!settings.name) {
    throw new Error("A project needs a name: " + path);
  }
  const retries = options.retries ?? 5;
  return { ...settings, retries };
}

export function describe(settings) {
  return settings.name + " (" + settings.retries + " retries)";
}

export function isEnabled(settings) {
  return settings.enabled !== false;
}

export function isArchived(settings) {
  return settings.archived === true;
}
`;

  function makeLarge(lines, every) {
    const oldLines = [];
    const newLines = [];
    for (let i = 1; i <= lines; i++) {
      const line = `  const value${i} = compute(${i}, "item ${i}");`;
      oldLines.push(line);
      newLines.push(i % every === 0 ? `${line} // changed` : line);
    }
    return [oldLines.join("\n"), newLines.join("\n")];
  }

  const [largeOld, largeNew] = makeLarge(10000, 250);
  const filler = "lorem ipsum dolor sit amet ".repeat(12);
  const [wrapOld, wrapNew] = [1, 2].map((side) =>
    Array.from(
      { length: 2000 },
      (_, i) =>
        `row ${i + 1} ${filler}${side === 2 && (i + 1) % 400 === 0 ? "edited" : ""}`,
    ).join("\n"),
  );
  const longOld = `const data = [${Array.from({ length: 4000 }, (_, i) => i).join(", ")}];\nconst end = 1;`;
  const longNew = `const data = [${Array.from({ length: 4000 }, (_, i) => (i === 3000 ? "x" : i)).join(", ")}];\nconst end = 2;`;
</script>

<div data-testid="split">
  <DiffViewer
    oldText={before}
    newText={after}
    view="split"
    language="js"
    {tokenize}
    labelText="Split diff"
    oldLabel="settings.js (before)"
    newLabel="settings.js (after)"
    height={420}
  />
</div>

<div data-testid="unified">
  <DiffViewer
    oldText={before}
    newText={after}
    view="unified"
    language="js"
    {tokenize}
    labelText="Unified diff"
    height={420}
  />
</div>

<div data-testid="large">
  <DiffViewer
    oldText={largeOld}
    newText={largeNew}
    view="split"
    labelText="Large diff"
    collapseUnchanged={false}
    height={400}
  />
</div>

<div data-testid="long">
  <DiffViewer
    oldText={longOld}
    newText={longNew}
    view="unified"
    labelText="Long lines"
    height={200}
  />
</div>

<div data-testid="wrap">
  <DiffViewer
    oldText={wrapOld}
    newText={wrapNew}
    view="split"
    wrap
    labelText="Wrapped lines"
    collapseUnchanged={false}
    height={300}
  />
</div>
