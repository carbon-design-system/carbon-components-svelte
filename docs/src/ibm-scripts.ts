/**
 * IBM's footer and analytics pull in about 90 files. Loaded with the page,
 * they held up its first render, so they wait for idle.
 */

const FOOTER_SCRIPT =
  "https://1.www.s81c.com/common/carbon-for-ibm-dotcom/tag/v1/latest/footer.min.js";
const STATS_SCRIPT = "https://1.www.s81c.com/common/stats/ibm-common.js";

const LATEST_MS = 3000;

/** Safari has no `requestIdleCallback`. */
const FALLBACK_MS = 1000;

/**
 * TrustArc adds its own IBM Plex Sans `@font-face` rules. They win over the
 * page's, so all text goes blank while they download. Delete them before
 * the browser renders them.
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
  // The analytics read these when they load.
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
