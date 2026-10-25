const PHYSICAL = /^-?[\d.]+%$/;
const TRACK_LEFT = /^calc\(50% \+ \((-?[\d.e+-]+)% - 50%\)/;
const TRACK_SIGN = /^var\(--ccs-inline-sign, (-?1)\)$/;

/**
 * Where a horizontal slider part sits from the track's left edge, as the
 * styles resolve its inline `left`. The track's `--ccs-slider-sign` reads
 * `--ccs-inline-sign`, which the nearest `dir="rtl"` or `dir="ltr"` sets,
 * else its fallback. jsdom does not resolve custom properties, so this
 * does. A plain percentage is already physical.
 */
export function trackPosition(el: HTMLElement) {
  const { left } = el.style;
  if (PHYSICAL.test(left)) return left;
  const percent = left.match(TRACK_LEFT);
  assert(percent, `not a track position: ${left}`);
  const slider = el.closest<HTMLElement>(".bx--slider");
  assert(slider);
  const sign = slider.style.getPropertyValue("--ccs-slider-sign");
  const fallback = sign.match(TRACK_SIGN);
  assert(fallback, `not a track sign: ${sign}`);
  let rtl = fallback[1] === "-1";
  for (let node: Element | null = slider; node; node = node.parentElement) {
    const dir = node.getAttribute("dir")?.toLowerCase();
    if (dir === "rtl" || dir === "ltr") {
      rtl = dir === "rtl";
      break;
    }
  }
  const value = Number(percent[1]);
  return `${rtl ? 100 - value : value}%`;
}
