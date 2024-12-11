import {
  ComponentEntries,
  ComponentRegistryCustomProps,
  FieldComponentProps,
  FieldsComponentProps,
  FormComponentProps,
  FormFieldComponentProps,
  TableCellComponentProps,
  TableComponentProps,
} from "@registry";
import { ComponentType } from "react";

/**
 * Extracts the keys of a record type that are strings.
 *
 * Without this, TypeScript infers the record keys as `string | number | symbol`,
 * but we want to ensure that the keys are strings.
 */
export type KeyOf<T> =
  T extends Record<infer K, unknown> ? Extract<K, string> : never;

/**
 * Merge two objects.
 *
 * If the key exists in both objects, the value from the second object will be used.
 */
export type Merge<
  F extends Record<string, unknown> | undefined,
  S extends Record<string, unknown> | undefined,
> = F extends undefined
  ? S extends undefined
    ? Record<string, never>
    : S
  : S extends undefined
    ? F
    : {
        [K in keyof F | keyof S]: K extends keyof S
          ? S[K]
          : K extends keyof F
            ? F[K]
            : never;
      };

/**
 * Merges the custom component map of two component registries.
 */
export type MergeCustomComponentMap<
  F extends ComponentRegistryCustomProps | undefined,
  S extends ComponentRegistryCustomProps | undefined,
  Key extends keyof ComponentRegistryCustomProps,
> = Merge<
  F extends { [K in Key]: ComponentRegistryCustomProps[Key] }
    ? F[Key] extends ComponentRegistryCustomProps[Key]
      ? F[Key]
      : undefined
    : undefined,
  S extends { [K in Key]: ComponentRegistryCustomProps[Key] }
    ? S[Key] extends ComponentRegistryCustomProps[Key]
      ? S[Key]
      : undefined
    : undefined
>;

/**
 *  Extracts the component type from the component registry by the component name.
 */
export type ComponentTypeByName<T extends ComponentEntries["type"]> =
  ComponentType<
    {
      field: FieldComponentProps;
      fields: FieldsComponentProps;
      formField: FormFieldComponentProps;
      form: FormComponentProps;
      tableCell: TableCellComponentProps;
      table: TableComponentProps;
    }[T]
  >;
