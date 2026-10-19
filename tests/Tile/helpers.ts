/** Returns one `log` spy that records select, deselect and change calls in order, plus the props that feed it to a group fixture. */
export function recordGroupEvents() {
  const log = vi.fn<(type: string, detail: unknown) => void>();
  return {
    log,
    props: {
      onSelect: (detail: string) => log("select", detail),
      onDeselect: (detail: string) => log("deselect", detail),
      onChange: (detail: string[]) => log("change", detail),
    },
  };
}
