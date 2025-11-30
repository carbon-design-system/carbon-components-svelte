import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["img"];

type $Props = {
  /**
   * Specify the image source.
   * @default ""
   */
  src?: string;

  /**
   * Specify the image alt text.
   * @default ""
   */
  alt?: string;

  /**
   * Specify the aspect ratio for the image wrapper.
   * @default undefined
   */
  ratio?: "2x1" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2";

  /**
   * Set to `true` when `loaded` is `true` and `error` is false.
   * @default false
   */
  loading?: boolean;

  /**
   * Set to `true` when the image is loaded.
   * @default false
   */
  loaded?: boolean;

  /**
   * Set to `true` if an error occurs when loading the image.
   * @default false
   */
  error?: boolean;

  /**
   * Set to `true` to fade in the image on load.
   * The duration uses the `fast-02` value following Carbon guidelines on motion.
   * @default false
   */
  fadeIn?: boolean;

  [key: `data-${string}`]: any;
};

export type ImageLoaderProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ImageLoader extends SvelteComponentTyped<
  ImageLoaderProps,
  { load: CustomEvent<null>; error: CustomEvent<null> },
  { error: Record<string, never>; loading: Record<string, never> }
> {
  /**
   * Method invoked to load the image provided a `src` value
   * @example
   * ```svelte
   * <ImageLoader bind:this={loader} src="default.jpg" />
   * <button on:click={() => loader.loadImage("new-image.jpg")}>
   *   Load New Image
   * </button>
   * ```
   */
  loadImage: (url?: string) => void;
}
