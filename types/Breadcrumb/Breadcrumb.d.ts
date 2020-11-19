/// <reference types="svelte" />
import { BreadcrumbSkeletonProps } from "./BreadcrumbSkeleton";

export interface BreadcrumbProps extends BreadcrumbSkeletonProps {
  /**
   * Set to `true` to hide the breadcrumb trailing slash
   * @default false
   */
  noTrailingSlash?: boolean;

  /**
   * Set to `true` to display skeleton state
   * @default false
   */
  skeleton?: boolean;
}

export default class Breadcrumb {
  $$prop_def: BreadcrumbProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
