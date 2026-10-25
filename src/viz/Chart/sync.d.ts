/**
 * Shared state between charts that declare the same `syncId`.
 */

export type SyncKind = "hover" | "zoom" | "brush" | "selection";

export type SyncMessage =
  | {
      kind: "hover";
      /** Data-space x, or `null` when the hover clears. */
      x: number | null;
      /** Whether the publisher's tooltip is shown, so a follower's keeps its timing. */
      shown: boolean;
    }
  | { kind: "zoom"; range: [number, number] | null }
  | { kind: "brush"; range: [number, number] | null }
  | {
      kind: "selection";
      /** Data-space x of the selected datum, and its series. */
      x: number | null;
      series: string | number | null;
      /** Every selected datum, for multi-select. `category` names a categorical x, which differs by chart. */
      selection: ReadonlyArray<{
        x: number;
        series: string | number;
        category?: string;
      }>;
    };

/**
 * Join the channel `id`. `listener` hears what the other members publish.
 * `publish` tells them about this member. A member never hears itself.
 */
export function joinSync(
  id: string,
  listener: (message: SyncMessage) => void,
): { publish: (message: SyncMessage) => void; leave: () => void };
