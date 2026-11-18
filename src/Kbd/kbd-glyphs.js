// @ts-check

/**
 * The path data of the icons `Kbd` draws for named keys, from Carbon's
 * 32×32 icons. One `<svg>` draws any of them, so a `Kbd` doesn't import
 * ten icon components.
 * @type {Readonly<Record<import("./kbd-keys.js").KbdIcon, ReadonlyArray<string>>>}
 */
export const KBD_GLYPHS = {
  // MacCommand
  command: [
    "M24,13a4,4,0,0,0,4-4V8a4,4,0,0,0-4-4H23a4,4,0,0,0-4,4v3H13V8A4,4,0,0,0,9,4H8A4,4,0,0,0,4,8V9a4,4,0,0,0,4,4h3v6H8a4,4,0,0,0-4,4v1a4,4,0,0,0,4,4H9a4,4,0,0,0,4-4V21h6v3a4,4,0,0,0,4,4h1a4,4,0,0,0,4-4V23a4,4,0,0,0-4-4H21V13ZM21,8a2,2,0,0,1,2-2h1a2,2,0,0,1,2,2V9a2,2,0,0,1-2,2H21ZM8,11A2,2,0,0,1,6,9V8A2,2,0,0,1,8,6H9a2,2,0,0,1,2,2v3H8Zm3,13a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2V23a2,2,0,0,1,2-2h3Zm8-5H13V13h6Zm2,2h3a2,2,0,0,1,2,2v1a2,2,0,0,1-2,2H23a2,2,0,0,1-2-2Z",
  ],
  // MacOption
  option: [
    "M18 5H28V7H18z",
    "M10.6 5 4 5 4 7 9.4 7 18.4 27 28 27 28 25 19.6 25z",
  ],
  // MacShift
  shift: [
    "M21,28H11a2.0023,2.0023,0,0,1-2-2V16H4a1,1,0,0,1-.707-1.707l12-12a.9994.9994,0,0,1,1.414,0l12,12A1,1,0,0,1,28,16H23V26A2.0027,2.0027,0,0,1,21,28ZM6.4141,14H11V26H21V14h4.5859L16,4.4141Z",
  ],
  // ChevronUp
  control: ["M16 10 26 20 24.6 21.4 16 12.8 7.4 21.4 6 20z"],
  // Return
  return: [
    "m22,8v2c2.2061,0,4,1.7944,4,4s-1.7939,4-4,4h-12v-5l-6,6,6,6v-5h12c3.3086,0,6-2.6914,6-6s-2.6914-6-6-6Z",
  ],
  // PageLast
  tab: ["M18 16 8 26 6.6 24.6 15.2 16 6.6 7.4 8 6z", "M22 4H24V28H22z"],
  // ArrowUp
  arrowUp: [
    "M16 4L6 14 7.41 15.41 15 7.83 15 28 17 28 17 7.83 24.59 15.41 26 14 16 4z",
  ],
  // ArrowDown
  arrowDown: [
    "M24.59 16.59 17 24.17 17 4 15 4 15 24.17 7.41 16.59 6 18 16 28 26 18 24.59 16.59z",
  ],
  // ArrowLeft
  arrowLeft: [
    "M14 26 15.41 24.59 7.83 17 28 17 28 15 7.83 15 15.41 7.41 14 6 4 16 14 26z",
  ],
  // ArrowRight
  arrowRight: [
    "M18 6 16.57 7.393 24.15 15 4 15 4 17 24.15 17 16.57 24.573 18 26 28 16 18 6z",
  ],
};
