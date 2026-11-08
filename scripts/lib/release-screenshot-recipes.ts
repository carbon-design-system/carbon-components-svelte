import {
  css,
  ev,
  quiet,
  type Recipe,
  tag,
  waitFor,
} from "./release-screenshots";

const BOLD = /Bold/;
const NEXT = /next/i;
const COLUMN = /column/i;
const ANY = /./;
const DUPLICATE = /Duplicate/;
const EDIT_NAME = /Edit project name/;

/**
 * Per-shot recipes, keyed by marker name. These are the v0.113.0 entries;
 * edit them per release. A snippet with no entry is captured as mounted at
 * 420px wide. For `video` markers, capture the end state of the described
 * interaction. See docs/release-screenshots.md.
 */
export const recipes: Record<string, Recipe> = {
  bleed: { width: 480 },
  box: { width: 480 },
  "page-header": { width: 720 },
  "relative-time": {
    volatile: true,
    async act(view) {
      // Native `title` tooltips aren't rendered headlessly; draw an equivalent.
      await ev(
        view,
        `(() => {
          const el = document.querySelector("time"), r = el.getBoundingClientRect();
          const tip = document.createElement("div");
          tip.textContent = el.getAttribute("title");
          Object.assign(tip.style, {
            position: "absolute", left: r.left + 8 + "px", top: r.bottom + 14 + "px",
            font: "13px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
            background: "#f6f6f6", color: "#262626", padding: "3px 8px",
            border: "1px solid #c7c7c7", borderRadius: "4px",
            boxShadow: "0 2px 6px rgba(0,0,0,.25)", whiteSpace: "nowrap",
          });
          document.body.appendChild(tip);
          document.getElementById("app").style.minHeight = "110px";
        })()`,
      );
    },
  },
  "toggle-button-group": {
    async act(view) {
      await view.click(await tag(view, "button", BOLD));
      await quiet(view);
    },
  },
  "big-number": {
    width: 520,
    async act(view) {
      await css(view, "#app{display:flex;gap:64px;align-items:flex-start}");
    },
  },
  carousel: {
    width: 520,
    async act(view) {
      await view.click(await tag(view, "button", NEXT));
      await quiet(view);
    },
  },
  "virtual-list": {
    async act(view) {
      // itemHeight * row
      await ev(
        view,
        `[...document.querySelectorAll("#app *")].find((e) => e.scrollHeight > e.clientHeight + 100).scrollTop = 40 * 1200`,
      );
    },
  },
  "date-picker": {
    async act(view) {
      await view.click("input");
      await waitFor(
        view,
        ".bx--date-picker__calendar.bx--date-picker__calendar--open",
      );
      const day =
        ".bx--date-picker__calendar.bx--date-picker__calendar--open .bx--date-picker__day:not(.bx--date-picker__day--outside-month):not(.bx--date-picker__day--outside-month)";
      await view.click(await tag(view, day, ANY, 8));
      await view.click(await tag(view, day, ANY, 10), {
        modifiers: ["Shift"],
      });
      await css(view, "#app{min-height:470px}");
      await quiet(view);
    },
  },
  "data-table": {
    width: 760,
    async act(view) {
      await view.click(await tag(view, "button", COLUMN));
      await css(view, "#app{min-height:340px}");
      await quiet(view, false);
    },
  },
  "multi-select": {
    async act(view) {
      // The default menu is capped at ~5.5 rows; lift the cap so every group
      // header shows.
      await css(
        view,
        "#app{min-height:480px}.bx--list-box--expanded .bx--list-box__menu{max-height:none!important}",
      );
      await view.click(".bx--list-box__field");
      await quiet(view, false);
    },
  },
  "grid-overlay": { viewport: { width: 1056, height: 270 } },
  // v0.114.0
  "theme-zone": { width: 560 },
  "layout-direction": { width: 480 },
  "chat-log": { width: 560 },
  "chat-button": { width: 560 },
  "date-picker-locale": {
    async act(view) {
      await view.click("input");
      await waitFor(view, ".bx--date-picker__calendar--open");
      await css(view, "#app{min-height:470px}");
      await quiet(view, false);
    },
  },
  "ai-label": {
    async act(view) {
      await css(view, "#app{min-height:220px}");
    },
  },
  "side-panel": { viewport: { width: 1056, height: 640 } },
  "css-grid": { width: 1000 },
  "table-of-contents": { width: 320 },
  card: { width: 360 },
  "tooltip-group": {
    async act(view) {
      await css(view, "#app{min-height:140px}");
      const sel = await tag(view, "button", DUPLICATE);
      const box = await ev<{ x: number; y: number }>(
        view,
        `(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } })()`,
      );
      await view.cdp("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        ...box,
      });
    },
  },
  "inline-edit": {
    async act(view) {
      // The edit button only shows on hover; click it through the DOM.
      await ev(
        view,
        `document.querySelector(${JSON.stringify(await tag(view, "button", EDIT_NAME))}).click()`,
      );
      await quiet(view, false);
    },
  },
  "confirm-modal": { viewport: { width: 800, height: 460 } },
};
