import { $ } from "bun";

const PRESERVE_FIELDS = new Set([
  "bugs",
  "dependencies",
  "description",
  "exports",
  "files",
  "homepage",
  "keywords",
  "license",
  "main",
  "maintainers",
  "name",
  "repository",
  "scripts",
  "sideEffects",
  "svelte",
  "type",
  "types",
  "version",
]);

const LIFECYCLE_SCRIPTS = new Set([
  "postinstall",
  "postuninstall",
  "preinstall",
  "prepare",
  "preuninstall",
]);

async function prunePackageJson(): Promise<void> {
  const path = "package.json";
  const raw = (await Bun.file(path).json()) as Record<string, unknown>;
  const removed: string[] = [];
  const pruned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (PRESERVE_FIELDS.has(key)) {
      pruned[key] = value;
    } else {
      removed.push(key);
    }
  }

  const scripts = pruned.scripts as Record<string, string> | undefined;
  if (scripts) {
    const prunedScripts: Record<string, string> = {};
    for (const [name, command] of Object.entries(scripts)) {
      if (LIFECYCLE_SCRIPTS.has(name)) prunedScripts[name] = command;
    }
    if (Object.keys(prunedScripts).length > 0) {
      pruned.scripts = prunedScripts;
    } else {
      pruned.scripts = undefined;
      removed.push("scripts");
    }
  }

  await Bun.write(path, `${JSON.stringify(pruned, null, 2)}\n`);

  if (removed.length > 0) {
    console.log(
      "[release-build] pruned package.json fields:",
      removed.sort().join(", "),
    );
  }
}

console.time("[release-build]");

await $`bun run build:docs`;
// After build:docs, which reads the doc comments to generate the .d.ts files.
await $`bun scripts/strip-doc-comments.ts --write`;
await $`bun run build:css:themes`;
await prunePackageJson();

console.timeEnd("[release-build]");
