// Custom Field Types for BusinessMap API

export interface CustomField {
  name: string;
  color: string;
  type:
    | 'single_line_text'
    | 'multi_line_text'
    | 'dropdown'
    | 'number'
    | 'date'
    | 'checkbox'
    | string;
  is_immutable: number;
  is_always_present: number;
  all_properties_are_locked: number;
  availability: number;
  is_enabled: number;
  display_width: number;
  prefix: string;
  suffix: string;
  uniqueness_of_values: number;
  value_is_required: number;
  default_value: string;
}
