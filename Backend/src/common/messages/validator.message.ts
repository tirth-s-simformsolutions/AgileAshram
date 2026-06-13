export const VALIDATION_MSG = {
  IS_STRING: (key: string): string => `error.VALIDATION.IS_STRING|{"args":{"key":"${key}"}}`,
  NOT_EMPTY: (key: string): string => `error.VALIDATION.NOT_EMPTY|{"args":{"key":"${key}"}}`,
  IS_INT: (key: string): string => `error.VALIDATION.IS_INT|{"args":{"key":"${key}"}}`,
  IS_BOOLEAN: (key: string): string => `error.VALIDATION.IS_BOOLEAN|{"args":{"key":"${key}"}}`,
  IS_NUMBER_STRING: (key: string): string =>
    `error.VALIDATION.IS_NUMBER_STRING|{"args":{"key":"${key}"}}`,
  IS_EMAIL: (key: string): string => `error.VALIDATION.IS_EMAIL|{"args":{"key":"${key}"}}`,
  IS_ENUM: (key: string, enumValues: string): string =>
    `error.VALIDATION.IS_ENUM|{"args":{"key":"${key}","enumValues":"${enumValues}"}}`,
  LENGTH: (key: string, min: number, max: number): string =>
    `error.VALIDATION.LENGTH|{"args":{"key":"${key}","min":"${min}","max":"${max}"}}`,
  IS_NUMBER: (key: string): string => `error.VALIDATION.IS_NUMBER|{"args":{"key":"${key}"}}`,
  IS_ARRAY: (key: string): string => `error.VALIDATION.IS_ARRAY|{"args":{"key":"${key}"}}`,
  IS_NUMBER_ARRAY: (key: string): string =>
    `error.VALIDATION.IS_NUMBER_ARRAY|{"args":{"key":"${key}"}}`,
  MIN_REQUIRED: (key: string): string => `error.VALIDATION.MIN_REQUIRED|{"args":{"key":"${key}"}}`,
  IS_INVALID: (key: string): string => `error.VALIDATION.INVALID|{"args":{"key":"${key}"}}`,
  IS_UNIQUE_ARRAY: (key: string): string =>
    `error.VALIDATION.IS_UNIQUE_ARRAY|{"args":{"key":"${key}"}}`,
  MAX_LENGTH: (key: string, length: number): string =>
    `error.VALIDATION.MAX_LENGTH|{"args":{"key":"${key}","length":"${length}"}}`,
  MIN_LENGTH: (key: string, length: number): string =>
    `error.VALIDATION.MIN_LENGTH|{"args":{"key":"${key}","length":"${length}"}}`,
  SHOULD_VALID_INT: (key: string, comparison: 'greater' | 'less', value: number): string =>
    `error.VALIDATION.SHOULD_VALID_INT|{"args":{"key":"${key}","comparison":"${comparison}","value":"${value}"}}`,
  MIN_VALUE: (key: string, value: number): string =>
    `error.VALIDATION.MIN_VALUE|{"args":{"key":"${key}","value":"${value}"}}`,
  IS_UUID: (key: string): string => `error.VALIDATION.IS_UUID|{"args":{"key":"${key}"}}`,
  IS_DATE: (key: string): string => `error.VALIDATION.IS_DATE|{"args":{"key":"${key}"}}`,
};
