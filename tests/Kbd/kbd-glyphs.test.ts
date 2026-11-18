/// <reference types="vite/client" />
import { KBD_GLYPHS } from "../../src/Kbd/kbd-glyphs.js";

const icons = import.meta.glob<string>("../../src/icons/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const ICON_FOR_KEY = {
  command: "MacCommand",
  option: "MacOption",
  shift: "MacShift",
  control: "ChevronUp",
  return: "Return",
  tab: "PageLast",
  arrowUp: "ArrowUp",
  arrowDown: "ArrowDown",
  arrowLeft: "ArrowLeft",
  arrowRight: "ArrowRight",
} as const;

const PATH = /<path\s+d="([^"]+)"/g;

describe("KBD_GLYPHS", () => {
  it.each(Object.entries(ICON_FOR_KEY))(
    "%s draws the %s icon's paths",
    (key, icon) => {
      const source = icons[`../../src/icons/${icon}.svelte`];
      const paths = [...source.matchAll(PATH)].map((match) => match[1]);
      expect(KBD_GLYPHS[key as keyof typeof ICON_FOR_KEY]).toEqual(paths);
    },
  );
});
