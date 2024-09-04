import { TableComponentProps } from "@fabrix-framework/fabrix";
import { Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { SingleValueField } from "./field";

export const ChakraReactTable = (props: TableComponentProps) => {
  const { headers, values, className } = props;
  const columnHelper = createColumnHelper<(typeof values)[0]>();
  const columns = headers.map((header) => {
    return columnHelper.accessor(header.key, {
      header: header.label,
      cell: (value) => value.getValue(),
      meta: {
        type: header.type,
      },
    });
  });

  const table = useReactTable({
    columns,
    data: values,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table className={className} marginTop={2}>
      <Thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <Tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <Th key={header.id} paddingStart={0}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </Th>
            ))}
          </Tr>
        ))}
      </Thead>
      <Tbody>
        {table.getRowModel().rows.map((row) => (
          <Tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <Td key={cell.id} paddingStart={0}>
                <SingleValueField
                  type={cell.column.columnDef.meta?.type}
                  value={cell.getValue()}
                />
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
