import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import { COMPONENTS_PATH, PAGE_EXTENSION } from "./constants";
import { getComponentNames } from "./utils";

const slugger = new GithubSlugger();

const SEARCH_INDEX_PATH = "./src/SEARCH_INDEX.json";
const H2_DELMIMITER = "## ";

type SearchDocument = {
  id: string;
  text: string;
  description: string;
  href: string;
  isComponent: boolean;
};

const documents: SearchDocument[] = [];

for (const componentName of getComponentNames()) {
  slugger.reset();
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
    href: `/components/${componentName}`,
    isComponent: true,
  });

  for (const line of lines) {
    if (line.startsWith(H2_DELMIMITER)) {
      const [, h2] = line.split(H2_DELMIMITER);
      if (!h2) continue;
      const hash = slugger.slug(h2);

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
