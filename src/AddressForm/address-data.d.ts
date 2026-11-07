export interface AddressFormat {
  /**
   * The format string. `%N` name, `%O` organization, `%A` address lines,
   * `%D` dependent locality, `%C` locality, `%S` region, `%Z` postal code,
   * `%X` sorting code, `%n` a new line.
   */
  fmt: string;
  /** The format string in Latin script, where it differs. */
  lfmt?: string;
  /** Letters of the fields a country requires. Defaults to `"AC"`. */
  require?: string;
  /** Letters of the fields a postal label writes in capitals. */
  upper?: string;
  /** Source of the postal code pattern. */
  zip?: string;
  /** A sample postal code. */
  zipex?: string;
  /** `zip`, `postal`, `pin`, `eircode`, `postcode`, `plz` or `cep`. */
  zipType?: string;
  /** What the region is called: `state`, `province`, `prefecture`... */
  stateType?: string;
  /** What the locality is called: `city`, `post_town`, `district`... */
  localityType?: string;
  /** What the dependent locality is called. */
  subType?: string;
  /** Where the separator of a postal code goes, and what it is. */
  norm?: [number, string];
}

export const DEFAULT_ADDRESS_FORMAT: Required<
  Pick<
    AddressFormat,
    | "fmt"
    | "require"
    | "upper"
    | "zipType"
    | "stateType"
    | "localityType"
    | "subType"
  >
>;

export const ADDRESS_FORMATS: Record<string, AddressFormat>;
