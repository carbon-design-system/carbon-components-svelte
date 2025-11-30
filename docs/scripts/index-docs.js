// @ts-check
import fs from "node:fs";
import path from "node:path";
import githubSlugger from "github-slugger";

const { slug } = githubSlugger;

const COMPONENTS_PATH = "./src/pages/components";
const SEARCH_INDEX_PATH = "./src/SEARCH_INDEX.json";
const H2_DELMIMITER = "## ";

const files = fs.readdirSync(COMPONENTS_PATH);

/**
 * @typedef {Object} Document
 * @property {string} id
 * @property {string} text
 * @property {string} description
 * @property {string} href
 * @property {boolean} isComponent
 */

/** @type {Document[]} */
const documents = [];

for (const file of files) {
  const [componentName] = file.split(".");
  const filePath = path.join(COMPONENTS_PATH, file);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent.split("\n");

  // Add base component page entry first (for higher ranking)
  // Use component name in description to boost ranking for MiniSearch.
  documents.push({
    id: `${componentName}-page`,
    text: componentName,
    description: componentName,
    href: `/components/${componentName}`,
    isComponent: true,
  });

  // Add H2 sections
  for (const line of lines) {
    if (line.startsWith(H2_DELMIMITER)) {
      const [, h2] = line.split(H2_DELMIMITER);
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
