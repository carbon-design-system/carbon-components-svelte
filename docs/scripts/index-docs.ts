import fs from "node:fs";
import path from "node:path";
import { COMPONENTS_PATH, PAGE_EXTENSION } from "./constants";
import { readFrontmatter } from "./frontmatter";
import { createSlugger } from "./slug";
import { getComponentNames } from "./utils";

const SEARCH_INDEX_PATH = "./src/SEARCH_INDEX.json";
const H2_DELMIMITER = "## ";

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
    summary: readFrontmatter(fileContent, filePath).description,
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
