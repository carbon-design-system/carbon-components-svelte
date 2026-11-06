import fs from "node:fs";
import path from "node:path";
import type { CompactPage } from "../src/search-index.ts";
import { COMPONENTS_PATH, PAGE_EXTENSION } from "./constants";
import { readFrontmatter } from "./frontmatter";
import { getComponentNames } from "./utils";

const SEARCH_INDEX_PATH = "./src/SEARCH_INDEX.json";
const H2_DELMIMITER = "## ";

const pages: CompactPage[] = [];

for (const componentName of getComponentNames()) {
  const filePath = path.join(
    COMPONENTS_PATH,
    `${componentName}${PAGE_EXTENSION}`,
  );
  const fileContent = fs.readFileSync(filePath, "utf8");
  const frontmatter = readFrontmatter(fileContent, filePath);
  const headings = fileContent
    .split("\n")
    .filter((line) => line.startsWith(H2_DELMIMITER))
    .map((line) => line.split(H2_DELMIMITER)[1])
    .filter((heading): heading is string => Boolean(heading));

  pages.push([
    componentName,
    frontmatter.description ?? "",
    frontmatter.components?.join(" ") ?? "",
    frontmatter.keywords?.join(" ") ?? "",
    headings,
  ]);
}

fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(pages));
