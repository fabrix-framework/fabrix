export const fallbackDefault =
  <T>(defaultValue: T) =>
  (value: T | null | undefined) =>
    value ?? defaultValue;
