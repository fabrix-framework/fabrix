import "@tanstack/react-table";
import { TableComponentHeader } from "@fabrix-framework/fabrix";

declare module "@tanstack/react-table" {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  interface ColumnMeta<TData extends RowData, TValue> {
    type: TableComponentHeader["type"] | null;
  }
}
