export interface LanguageItem {
  /** The BCP 47 tag, such as "pt-BR" or "zh-Hant". */
  id: string;
  /** The name in the UI locale. */
  text: string;
  /** Text the query is matched against. */
  search: string;
}

export interface LanguageDetail {
  /** The BCP 47 tag. */
  value: string;
  /** The name in the UI locale. */
  name: string;
  /** The name in the language itself, or `""` when it is the same as `name`. */
  endonym: string;
  /** The direction the endonym is written in. */
  dir: "ltr" | "rtl";
}

export interface LanguageSource {
  items: LanguageItem[];
  /** Finish the search text now. */
  ensure(): void;
  /** Add the next slice of languages to the search text, until `deadline`. */
  warm(deadline: number): boolean;
  detail(tag: string): LanguageDetail;
  resolve(value: string): string;
  /** The browser's best language that the list has. */
  detect(): string;
}

/** The list of languages for one picker, with each one's names. */
export function createLanguageSource(options: {
  locale: string;
  values?: ReadonlyArray<string>;
  variants?: boolean;
  languageDisplay?: "dialect" | "standard";
}): LanguageSource;
