// @ts-check
import { csvCore } from "./csv-core.js";
import { runParseWorker } from "./parse-file.js";
import { xlsxCore } from "./xlsx-core.js";

// The module worker for a page whose CSP forbids `blob:` workers:
//   parseFile(file, {
//     worker: () => new Worker(new URL("carbon-components-svelte/src/ImportWizard/csv.worker.js", import.meta.url), { type: "module" }),
//   })
runParseWorker(self, csvCore(), xlsxCore());
