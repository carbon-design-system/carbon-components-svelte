/**
 * Builds generated code while recording where each piece came from, so a
 * checker's error position maps back to the `.svelte` source.
 *
 * `copy` keeps source text verbatim and maps it character for character.
 * Text written inside `from` maps to that node's start, for errors the
 * checker reports on scaffolding, such as a component's props object.
 * Anything else is generated, and errors there are dropped.
 */
export class Output {
  code = "";
  /** [generated start, source start, length] */
  private copies: [number, number, number][] = [];
  /** [generated start, generated end, source offset] */
  private spans: [number, number, number][] = [];

  readonly source: string;

  constructor(source: string) {
    this.source = source;
  }

  raw(text: string) {
    this.code += text;
    return this;
  }

  copy(start: number, end: number) {
    if (end > start) {
      this.copies.push([this.code.length, start, end - start]);
      this.code += this.source.slice(start, end);
    }
    return this;
  }

  /** Writes `fn`'s output, mapping what it doesn't copy to `offset`. */
  from(offset: number, fn: () => void) {
    const start = this.code.length;
    fn();
    this.spans.push([start, this.code.length, offset]);
    return this;
  }

  /** The source offset for a generated offset, or `null` if generated. */
  toSource(offset: number): number | null {
    let lo = 0;
    let hi = this.copies.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const [gen, src, len] = this.copies[mid];
      if (offset < gen) hi = mid - 1;
      else if (offset >= gen + len) lo = mid + 1;
      else return src + offset - gen;
    }
    let best: [number, number, number] | undefined;
    for (const span of this.spans) {
      if (offset < span[0] || offset >= span[1]) continue;
      if (!best || span[1] - span[0] < best[1] - best[0]) best = span;
    }
    return best ? best[2] : null;
  }
}

/** Line and column (both 1-based) of each offset in `text`. */
export function createLocator(text: string) {
  const starts = [0];
  for (let i = 0; i < text.length; i++)
    if (text[i] === "\n") starts.push(i + 1);
  return {
    position(offset: number) {
      let lo = 0;
      let hi = starts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= offset) lo = mid;
        else hi = mid - 1;
      }
      return { line: lo + 1, column: offset - starts[lo] + 1 };
    },
    offset(line: number, column: number) {
      return (starts[line - 1] ?? text.length) + column - 1;
    },
  };
}
