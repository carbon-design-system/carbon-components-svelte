import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { $, Glob } from "bun";
import { sveld } from "sveld";

const CACHE_DIR = ".cache/build-docs";
const CACHE_FILE = `${CACHE_DIR}/input.hash`;

const SVELD_OPTIONS = {
  glob: true,
  json: true,
  jsonOptions: {
    outFile: "docs/src/COMPONENT_API.json",
  },
  typesOptions: {
    outDir: "src",
  },
};

function collectInputFiles(): string[] {
  const files = new Set<string>();

  for (const file of new Glob("**/*.svelte").scanSync({ cwd: "src" })) {
    files.add(file);
  }

  for (const file of new Glob("**/*.d.ts").scanSync({ cwd: "src" })) {
    if (file.endsWith(".svelte.d.ts") || file === "index.d.ts") continue;
    files.add(file);
  }

  for (const file of new Glob("**/index.js").scanSync({ cwd: "src" })) {
    files.add(file);
  }

  return [...files].sort();
}

async function sharedInputs(): Promise<string> {
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
    devDependencies?: { sveld?: string };
  };

  return [
    packageJson.devDependencies?.sveld ?? "",
    JSON.stringify(SVELD_OPTIONS),
  ].join("\0");
}

async function computeInputHash(): Promise<string> {
  const files = collectInputFiles();
  const contents = await Promise.all(
    files.map(async (file) => ({
      file,
      contents: await readFile(`src/${file}`, "utf8"),
    })),
  );
  const hash = createHash("sha256");

  for (const { file, contents: fileContents } of contents) {
    hash.update(file);
    hash.update("\0");
    hash.update(fileContents);
    hash.update("\0");
  }

  hash.update(await sharedInputs());
  return hash.digest("hex");
}

async function isCached(hash: string): Promise<boolean> {
  try {
    const cachedHash = (await readFile(CACHE_FILE, "utf8")).trim();
    if (cachedHash !== hash) return false;
    await access("docs/src/COMPONENT_API.json");
    await access("src/index.d.ts");
    return true;
  } catch {
    return false;
  }
}

console.time("[build-docs]");

await mkdir(CACHE_DIR, { recursive: true });

const hash = await computeInputHash();

if (await isCached(hash)) {
  console.log("[build-docs] (cached)");
} else {
  await $`rm -f src/index.d.ts && find src -name "*.svelte.d.ts" -delete`;
  await sveld(SVELD_OPTIONS);
  await writeFile(CACHE_FILE, `${hash}\n`);
}

console.timeEnd("[build-docs]");
