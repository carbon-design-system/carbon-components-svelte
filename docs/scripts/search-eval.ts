/**
 * Scores the site search on queries a reader types, each with the result it
 * should return and the place it should reach. The search menu shows the
 * top 10 results, components above sections, so a result's place is its
 * place in its group there. Prints the misses and exits 1 if any query
 * misses.
 *
 *   cd docs && bun run eval:search
 */
import SEARCH_INDEX from "../src/SEARCH_INDEX.json";
import { createSearch, type SearchDocument } from "../src/search";

/** Query, the id it should find, and the place it should reach or beat. */
export const CASES: [query: string, id: string, place: number][] = [
  // A component's name, as typed or split into words.
  ["button", "Button-page", 1],
  ["accordion", "Accordion-page", 1],
  ["modal", "Modal-page", 1],
  ["tooltip", "Tooltip-page", 1],
  ["slider", "Slider-page", 1],
  ["toggle", "Toggle-page", 1],
  ["breadcrumb", "Breadcrumb-page", 1],
  ["grid", "Grid-page", 1],
  ["tabs", "Tabs-page", 1],
  ["checkbox", "Checkbox-page", 1],
  ["search", "Search-page", 1],
  ["pagination", "Pagination-page", 1],
  ["datatable", "DataTable-page", 1],
  ["DataTable", "DataTable-page", 1],
  ["data table", "DataTable-page", 1],
  ["date picker", "DatePicker-page", 1],
  ["multiselect", "MultiSelect-page", 1],
  ["multi select", "MultiSelect-page", 1],
  ["combo box", "ComboBox-page", 1],
  ["file uploader", "FileUploader-page", 1],
  ["text input", "TextInput-page", 1],
  ["number input", "NumberInput-page", 1],
  ["progress bar", "ProgressBar-page", 1],
  ["side panel", "SidePanel-page", 1],
  ["tree view", "TreeView-page", 1],
  ["overflow menu", "OverflowMenu-page", 1],
  ["time picker", "TimePicker-page", 1],
  ["structured list", "StructuredList-page", 1],
  ["inline notification", "InlineNotification-page", 1],
  ["code snippet", "CodeSnippet-page", 1],
  ["ui shell", "UIShell-page", 1],
  // Part of a component's name.
  ["tab", "Tabs-page", 1],
  ["table", "DataTable-page", 3],
  ["picker", "DatePicker-page", 3],
  ["upload", "FileUploader-page", 3],
  ["uploader", "FileUploader-page", 1],
  ["snippet", "CodeSnippet-page", 1],
  ["avatar", "UserAvatar-page", 3],
  ["check", "Checkbox-page", 2],
  ["progress", "ProgressBar-page", 3],
  ["password", "PasswordInput-page", 1],
  ["notification", "InlineNotification-page", 5],
  ["input", "TextInput-page", 5],
  ["date", "DatePicker-page", 3],
  ["copy", "CopyButton-page", 3],
  // Typos.
  ["modl", "Modal-page", 1],
  ["buton", "Button-page", 1],
  ["acordion", "Accordion-page", 1],
  ["checkbx", "Checkbox-page", 1],
  ["dropdwn", "Dropdown-page", 1],
  ["paginaton", "Pagination-page", 1],
  ["sldier", "Slider-page", 1],
  ["toolitp", "Tooltip-page", 2],
  ["datepciker", "DatePicker-page", 2],
  // Other words for a component.
  ["spinner", "Loading-page", 3],
  ["switch", "Toggle-page", 3],
  ["chip", "Tag-page", 3],
  ["autocomplete", "ComboBox-page", 3],
  ["btn", "Button-page", 1],
  ["drawer", "SidePanel-page", 3],
  ["dark mode", "Theme-page", 3],
  ["navigation", "UIShell-page", 5],
  // A section of a page.
  ["multiselect basic", "MultiSelectbasic", 1],
  ["data table sorting", "DataTablesorting", 1],
  ["button icons", "Buttonicons", 1],
];

if (import.meta.main) {
  const search = createSearch(SEARCH_INDEX as SearchDocument[]);
  const misses: string[] = [];
  for (const [query, id, place] of CASES) {
    const results = search(query).slice(0, 10);
    const isComponent = id.endsWith("-page");
    const group = results.filter((r) => r.isComponent === isComponent);
    const actual = group.findIndex((result) => result.id === id) + 1;
    if (actual === 0 || actual > place) {
      const top = group.slice(0, 3).map((result) => result.id);
      misses.push(
        `  ${JSON.stringify(query)}: ${id} at ${actual || "none"} (want ≤ ${place}); top: ${top.join(", ") || "none"}`,
      );
    }
  }
  console.log(`${CASES.length - misses.length}/${CASES.length} queries pass`);
  if (misses.length > 0) {
    console.log(misses.join("\n"));
    process.exitCode = 1;
  }
}
