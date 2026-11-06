const VIEW_BOX = /viewBox="0 0 (\d+) \d+"/;
const PATH_DATA = / d="([^"]*)"/;
const RUN = /M(\d+) (\d+)h(\d+)v1h-\d+z/g;

/**
 * Read the module grid back out of rendered QRCode markup: the `viewBox`
 * gives the side in modules, and each `M x y h w v1 h-w z` run in the path
 * is `w` dark modules. Returns the grid without the quiet zone.
 */
export function gridFromSvg(svg: string, quietZone = 4): number[][] {
  const side = Number(VIEW_BOX.exec(svg)?.[1]);
  const d = PATH_DATA.exec(svg)?.[1] ?? "";
  const n = side - quietZone * 2;
  const grid = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (const [, x, y, w] of d.matchAll(RUN)) {
    for (let i = 0; i < Number(w); i++) {
      grid[Number(y) - quietZone][Number(x) - quietZone + i] = 1;
    }
  }
  return grid;
}
