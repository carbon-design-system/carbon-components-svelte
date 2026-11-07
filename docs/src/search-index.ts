import { createSlugger } from "../scripts/slug.ts";
import type { SearchDocument } from "./search";

/**
 * Search documents are rebuilt from this, so the index doesn't repeat each
 * page's name, ids and URLs in every entry. Lists are space-separated.
 */
export type CompactPage = [
  name: string,
  summary: string,
  components: string,
  keywords: string,
  headings: string[],
];

export function expandSearchIndex(pages: CompactPage[]): SearchDocument[] {
  return pages.flatMap(([name, summary, components, keywords, headings]) => {
    const page: SearchDocument = {
      id: `${name}-page`,
      text: name,
      description: name,
      href: `/components/${name}`,
      isComponent: true,
    };
    if (summary) page.summary = summary;
    if (components) page.components = components;
    if (keywords) page.keywords = keywords;
    // Heading ids as the page renders them, repeats numbered in order.
    const slug = createSlugger();
    return [
      page,
      ...headings.map((heading) => {
        const hash = slug(heading);
        return {
          id: name + hash,
          text: name,
          description: heading,
          href: `/components/${name}#${hash}`,
          isComponent: false,
        };
      }),
    ];
  });
}
