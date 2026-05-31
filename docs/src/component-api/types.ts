export type ComponentApiProp = {
  name: string;
  description?: string;
  type?: string;
  typesHighlighted?: string[];
  value?: string;
  valueHighlighted?: string;
  exampleCode?: string;
  exampleCodeHighlighted?: string;
  isRequired?: boolean;
  reactive?: boolean;
};

export type ComponentApiTypedef = {
  ts?: string;
  tsHighlighted?: string;
};

export type ComponentApiSlot = {
  default?: boolean;
  name?: string | null;
  slot_props?: string;
  slot_propsHighlighted?: string;
};

export type ComponentApiEvent = {
  type?: string;
  name?: string;
  detail?: string;
  detailHighlighted?: string;
  description?: string;
};

export type ComponentApiRestProps = {
  type: string;
  name: string;
};

export type ComponentApiEntry = {
  moduleName: string;
  filePath: string;
  props: ComponentApiProp[];
  slots: ComponentApiSlot[];
  events: ComponentApiEvent[];
  typedefs: ComponentApiTypedef[];
  typedefsHighlighted?: string;
  rest_props?: ComponentApiRestProps;
};

export type HighlightedPrimitives = Record<string, string>;
