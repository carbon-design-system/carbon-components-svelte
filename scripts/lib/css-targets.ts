import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";

// Baseline Widely available, pinned (#5288). Move it only in a minor
// release, so a patch never drops a browser.
export const BROWSERSLIST = [
  "Chrome >= 124",
  "Edge >= 124",
  "Firefox >= 125",
  "Safari >= 17.4",
  "iOS >= 17.4",
] as const;

export const targets = browserslistToTargets(browserslist([...BROWSERSLIST]));
