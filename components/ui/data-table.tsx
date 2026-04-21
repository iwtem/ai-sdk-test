"use client";

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SortOrder = "asc" | "desc";

export type DataTableColumn<TData> = {
  /** Unique key, also used as accessorKey. */
  key: string;
  /** Header label. */
  title: ReactNode;
  /** CSS width, e.g. "38%" or "120px". */
  width?: string;
  /** If set, the column is sortable. Value is the sort field name emitted via onSortChange. */
  sortable?: string;
  /** Default sort direction when first clicking this column. Defaults to "asc". */
  defaultSortOrder?: SortOrder;
  /** Custom cell renderer. Receives the full row data. */
  render?: (record: TData, index: number) => ReactNode;
  /** Text alignment. */
  align?: "left" | "center" | "right";
  /** Extra className on th/td. */
  className?: string;
};

export type DataTableProps<TData> = {
  columns: DataTableColumn<TData>[];
  data: TData[];
  /** Derive a unique key per row. Defaults to (row as any).id */
  rowKey?: (record: TData, index: number) => string;
  /** Current sort field (controlled). */
  sortBy?: string;
  /** Current sort direction (controlled). */
  sortOrder?: SortOrder;
  /** Called when user clicks a sortable header. */
  onSortChange?: (field: string, order: SortOrder) => void;
  /** Disables sort buttons. */
  loading?: boolean;
  /** Footer content rendered below the table body. */
  footer?: ReactNode;
  /** Extra className on the outer wrapper. */
  className?: string;
};

// ---------------------------------------------------------------------------
// Column meta (carried through TanStack for rendering)
// ---------------------------------------------------------------------------

type ColumnMeta = {
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
  sortable?: string;
  defaultSortOrder?: SortOrder;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<TData>({
  columns: userColumns,
  data,
  rowKey,
  sortBy,
  sortOrder,
  onSortChange,
  loading,
  footer,
  className,
}: DataTableProps<TData>) {
  const columns = useMemo<ColumnDef<TData>[]>(
    () =>
      userColumns.map((col) => ({
        id: col.key,
        accessorFn: () => null,
        header: () => col.title,
        cell: col.render
          ? ({ row }) => col.render!(row.original, row.index)
          : ({ row }) => {
              const value = (row.original as Record<string, unknown>)[col.key];
              return value == null ? "" : String(value);
            },
        meta: {
          width: col.width,
          align: col.align,
          className: col.className,
          sortable: col.sortable,
          defaultSortOrder: col.defaultSortOrder,
        } satisfies ColumnMeta,
      })),
    [userColumns],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleHeaderClick = (meta: ColumnMeta) => {
    if (!meta.sortable || !onSortChange) return;
    if (sortBy === meta.sortable) {
      onSortChange(meta.sortable, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(meta.sortable, meta.defaultSortOrder ?? "asc");
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/60 hover:bg-muted/60">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      meta?.align === "center" && "text-center",
                      meta?.align === "right" && "text-right",
                      meta?.className,
                    )}
                    style={meta?.width ? { width: meta.width } : undefined}
                  >
                    {meta?.sortable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        disabled={loading}
                        onClick={() => handleHeaderClick(meta)}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortBy === meta.sortable ? (
                          sortOrder === "asc" ? (
                            <ArrowUp data-icon="inline-end" />
                          ) : (
                            <ArrowDown data-icon="inline-end" />
                          )
                        ) : (
                          <ArrowUpDown data-icon="inline-end" />
                        )}
                      </Button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const key = rowKey
              ? rowKey(row.original, row.index)
              : (row.original as Record<string, unknown>).id != null
                ? String((row.original as Record<string, unknown>).id)
                : row.id;
            return (
              <TableRow key={key} className="text-sm transition-colors hover:bg-muted/40">
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        meta?.align === "center" && "text-center",
                        meta?.align === "right" && "text-right",
                        meta?.className,
                      )}
                      style={meta?.width ? { width: meta.width } : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {footer != null && (
        <div className="border-border border-t px-3 py-2 text-muted-foreground text-xs">
          {footer}
        </div>
      )}
    </div>
  );
}
