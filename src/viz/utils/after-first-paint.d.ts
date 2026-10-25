/**
 * Calls back once the first frame has painted. A chart that animates waits
 * for it before it may: it arrives in place, measured and laid out, and only
 * moves from there when its data changes. Returns a cancel.
 */
export function afterFirstPaint(callback: () => void): () => void;
