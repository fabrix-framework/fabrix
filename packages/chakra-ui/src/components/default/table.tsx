import { TableComponentProps } from "@fabrix-framework/fabrix";
import { Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  flexRender,
  Header,
  Cell,
} from "@tanstack/react-table";
import { SingleValueField } from "./field";

const buildTable = (props: TableComponentProps) => {
  const { headers } = props;
  const columnHelper = createColumnHelper<(typeof props)["values"][0]>();
  return {
    columns: headers.map((header) => {
      if (header.type === null) {
        return columnHelper.display({
          id: header.key,
          header: header.label,
          cell: () => <div>TODO</div>,
        });
      }

      return columnHelper.accessor(header.key, {
        header: header.label,
        cell: (value) => (
          <SingleValueField type={header.type} value={value.getValue()} />
        ),
        meta: {
          type: header.type,
        },
      });
    }),

    renderHeader: (header: Header<Record<string, unknown>, unknown>) =>
      header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext()),

    renderCell: (cell: Cell<Record<string, unknown>, unknown>) =>
      flexRender(cell.column.columnDef.cell, cell.getContext()),
  };
};

export const ChakraReactTable = (props: TableComponentProps) => {
  const { className, values } = props;
  const { columns, renderHeader, renderCell } = buildTable(props);
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
                {renderHeader(header)}
              </Th>
            ))}
          </Tr>
        ))}
      </Thead>
      <Tbody>
        {table.getRowModel().rows.map((row) => (
          <Tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <Td
                key={cell.id}
                paddingStart={0}
                paddingTop={2}
                paddingBottom={2}
              >
                {renderCell(cell)}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
