// @ts-check

/**
 * Calls back once the first frame has painted. A chart that animates waits
 * for it before it may: it arrives in place, measured and laid out, and only
 * moves from there when its data changes. Returns a cancel.
 * @param {() => void} callback
 */
export function afterFirstPaint(callback) {
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(callback);
  });
  return () => cancelAnimationFrame(frame);
}
