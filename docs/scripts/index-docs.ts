import fs from "node:fs";
import path from "node:path";
import { COMPONENTS_PATH, PAGE_EXTENSION } from "./constants";
import { createSlugger } from "./slug";
import { getComponentNames } from "./utils";

const SEARCH_INDEX_PATH = "./src/SEARCH_INDEX.json";
const H2_DELMIMITER = "## ";
/** The front matter's `description`, a plain one-line scalar on every page. */
const SUMMARY_RE = /^---\n(?:.*\n)*?description: (.+)\n(?:.*\n)*?---\n/;

type SearchDocument = {
  id: string;
  text: string;
  description: string;
  summary?: string;
  href: string;
  isComponent: boolean;
};

const documents: SearchDocument[] = [];

for (const componentName of getComponentNames()) {
  const slug = createSlugger();
  const filePath = path.join(
    COMPONENTS_PATH,
    `${componentName}${PAGE_EXTENSION}`,
  );
  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent.split("\n");

  documents.push({
    id: `${componentName}-page`,
    text: componentName,
    description: componentName,
    summary: SUMMARY_RE.exec(fileContent)?.[1],
    href: `/components/${componentName}`,
    isComponent: true,
  });

  for (const line of lines) {
    if (line.startsWith(H2_DELMIMITER)) {
      const [, h2] = line.split(H2_DELMIMITER);
      if (!h2) continue;
      const hash = slug(h2);

      documents.push({
        id: componentName + hash,
        text: componentName,
        description: h2,
        href: `/components/${componentName}#${hash}`,
        isComponent: false,
      });
    }
  }
}

fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(documents, null, 2));
