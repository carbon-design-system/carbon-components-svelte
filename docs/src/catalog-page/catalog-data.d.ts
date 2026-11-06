import type { Facet } from "../../../src/FilterPanel/filter-model.js";

export interface CatalogItem {
  id: string;
  name: string;
  provider: string;
  category: string;
  type: string;
  pricing: string;
  /** 3.0 to 5.0, one decimal. */
  rating: number;
  /** The band `rating` falls in; the rating facet filters on it. */
  ratingBand: "top" | "good" | "fair";
  reviews: number;
  installs: number;
  verified: boolean;
  /** ISO UTC, so the server render and the browser agree. */
  updated: string;
  tags: string[];
  description: string;
}

export type SortId = "relevance" | "name" | "newest" | "rating";

export const CATEGORIES: string[];
export const TYPES: string[];
export const PRICING: string[];
export const RATING_BANDS: Array<{ id: string; label: string }>;
export const SORTS: Array<{ id: SortId; text: string }>;
export const FACETS: readonly Facet[];

export function ratingBand(rating: number): "top" | "good" | "fair";

/** The same `size` items on every call. */
export function generateCatalog(size?: number): CatalogItem[];
