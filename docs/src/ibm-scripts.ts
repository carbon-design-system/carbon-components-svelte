/**
 * IBM's footer (`dds-footer-container`) and analytics, which every page of
 * the site loads in production. They pull in about 90 more files, from
 * IBM's CDN, Tealium, TrustArc and Google, and loaded with the page they
 * held up its first render. They now load once the page has loaded and
 * the browser is idle, or a few seconds after it has loaded, at most.
 */

const FOOTER_SCRIPT =
  "https://1.www.s81c.com/common/carbon-for-ibm-dotcom/tag/v1/latest/footer.min.js";
const STATS_SCRIPT = "https://1.www.s81c.com/common/stats/ibm-common.js";

/** At most this long after the page has loaded, even if never idle. */
const LATEST_MS = 3000;

/** Safari has no `requestIdleCallback`; there, this long after load. */
const FALLBACK_MS = 1000;

/**
 * TrustArc, which IBM's analytics load for the cookie banner, adds its own
 * `@font-face` rules for IBM Plex Sans 400 and 600. They come last, so they
 * win over the faces the page already uses, and all of its text goes blank
 * while TrustArc's copies of the font download. This deletes those rules
 * as their `<style>` is added, before the browser renders it. The banner
 * then uses the page's own IBM Plex Sans, which is the same font.
 */
function deleteTrustArcFonts(style: HTMLStyleElement) {
  const sheet = style.sheet;
  if (!sheet) return;
  for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
    const rule = sheet.cssRules[i];
    if (rule instanceof CSSFontFaceRule && isFromTrustArc(rule)) {
      sheet.deleteRule(i);
    }
  }
}

/** Whether any `url()` in the rule's `src` is on TrustArc's host. */
function isFromTrustArc(rule: CSSFontFaceRule) {
  const src = rule.style.getPropertyValue("src");
  for (const [, url] of src.matchAll(/url\("?([^")]+)/g)) {
    if (new URL(url, location.href).hostname === "consent.trustarc.com") {
      return true;
    }
  }
  return false;
}

function watchForTrustArcFonts() {
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLStyleElement) {
          deleteTrustArcFonts(node);
        } else if (node instanceof Element) {
          for (const style of node.getElementsByTagName("style")) {
            deleteTrustArcFonts(style);
          }
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

type IbmWindow = Window & {
  _ibmAnalytics?: unknown;
  digitalData?: unknown;
};

function addScripts() {
  watchForTrustArcFonts();
  // The analytics read their settings when they load, and count the page
  // view then.
  const win = window as IbmWindow;
  win._ibmAnalytics = {
    settings: {
      name: "CarbonSvelte",
      isSpa: true,
      tealiumProfileName: "ibm-web-app",
    },
    onLoad: [["ibmStats.pageview", []]],
  };
  win.digitalData = {
    page: {
      pageInfo: { ibm: { siteId: "IBM_CarbonSvelte" } },
      category: { primaryCategory: "PC100" },
    },
  };
  const footer = document.createElement("script");
  footer.type = "module";
  footer.src = FOOTER_SCRIPT;
  const stats = document.createElement("script");
  stats.src = STATS_SCRIPT;
  document.head.append(footer, stats);
}

/**
 * Adds IBM's scripts once the page has loaded and the browser is idle.
 * Returns a function that cancels it, if they haven't been added yet.
 */
export function loadIbmScripts(): () => void {
  let cancel = () => {};
  const whenIdle = () => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(addScripts, { timeout: LATEST_MS });
      cancel = () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(addScripts, FALLBACK_MS);
      cancel = () => clearTimeout(id);
    }
  };
  if (document.readyState === "complete") {
    whenIdle();
  } else {
    window.addEventListener("load", whenIdle, { once: true });
    cancel = () => window.removeEventListener("load", whenIdle);
  }
  return () => cancel();
}
