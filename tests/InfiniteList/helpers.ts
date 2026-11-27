export type Row = { id: number };

export type RowPage = {
  items: Row[];
  nextCursor?: number;
  total?: number;
};

/**
 * A loader over `total` rows, `pageSize` at a time, with an offset for a
 * cursor. Every request is recorded.
 */
export function pagedLoader({
  pageSize = 5,
  total = 40,
  reportTotal = true,
}: { pageSize?: number; total?: number; reportTotal?: boolean } = {}) {
  const requests: Array<{ cursor: unknown; signal: AbortSignal }> = [];
  const load = vi.fn(
    (request: { cursor: unknown; signal: AbortSignal }): Promise<RowPage> => {
      requests.push(request);
      const start = Number(request.cursor ?? 0);
      const end = Math.min(start + pageSize, total);
      return Promise.resolve({
        items: Array.from({ length: end - start }, (_, i) => ({
          id: start + i + 1,
        })),
        nextCursor: end < total ? end : undefined,
        total: reportTotal ? total : undefined,
      });
    },
  );
  return { load, requests };
}

export function firstPage(pageSize = 5, total = 40): RowPage {
  return {
    items: Array.from({ length: pageSize }, (_, i) => ({ id: i + 1 })),
    nextCursor: pageSize,
    total,
  };
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
