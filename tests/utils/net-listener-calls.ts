/**
 * Nets a `vi.spyOn(window, "addEventListener")`/`"removeEventListener"` pair
 * down to the outstanding registrations of one event `type`, so a component
 * that adds and later removes its own listener nets to zero.
 */
export function netListenerCalls(
  add: ReturnType<typeof vi.spyOn>,
  remove: ReturnType<typeof vi.spyOn>,
  type: string,
) {
  return (
    add.mock.calls.filter((c: unknown[]) => c[0] === type).length -
    remove.mock.calls.filter((c: unknown[]) => c[0] === type).length
  );
}
