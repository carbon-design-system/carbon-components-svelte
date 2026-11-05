export const EDGE_SLACK: number;

export function createAutoScroll(): {
  step(options: {
    doc: Document;
    x: number;
    y: number;
    dt: number;
    now: number;
    scrollers: HTMLElement[];
    rtl: boolean;
  }): boolean;
};
