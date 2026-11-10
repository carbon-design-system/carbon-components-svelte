/**
 * A server in another zone and locale than the user's. Nothing the pickers
 * render may follow it, or the server HTML and the first client paint would
 * differ and hydration would not repair the attribute.
 */
export function onServerIn(locale: string, timeZone: string) {
  const resolved = Intl.DateTimeFormat.prototype.resolvedOptions;
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(
    function (this: Intl.DateTimeFormat) {
      return { ...resolved.call(this), locale, timeZone };
    },
  );
}
