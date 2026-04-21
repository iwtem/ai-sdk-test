"use client";

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

// ---------------------------------------------------------------------------
// 对外类型
// ---------------------------------------------------------------------------

export type SortOrder = "asc" | "desc";

export type DataTableColumn<TData> = {
  /** 唯一键，同时用作 accessorKey。 */
  key: string;
  /** 表头文案。 */
  title: ReactNode;
  /** CSS 宽度，例如 "38%" 或 "120px"。 */
  width?: string;
  /** 若设置则该列可排序，值为通过 onSortChange 抛出的排序字段名。 */
  sortable?: string;
  /** 首次点击该列时的默认排序方向，默认为 "asc"。 */
  defaultSortOrder?: SortOrder;
  /** 自定义单元格渲染函数，接收完整行数据。 */
  render?: (record: TData, index: number) => ReactNode;
  /** 文本对齐方式。 */
  align?: "left" | "center" | "right";
  /** th/td 额外 className。 */
  className?: string;
};

export type DataTableProps<TData> = {
  columns: DataTableColumn<TData>[];
  data: TData[];
  /** 空状态文案。 */
  emptyState?: ReactNode;
  /** 当前排序字段（受控）。 */
  sortBy?: string;
  /** 当前排序方向（受控）。 */
  sortOrder?: SortOrder;
  /** 用户点击可排序表头时触发。 */
  onSortChange?: (field: string, order: SortOrder) => void;
  /** 是否禁用排序按钮。 */
  loading?: boolean;
  /** 渲染在表格主体下方的页脚内容。 */
  footer?: ReactNode;
  /** 外层容器额外 className。 */
  className?: string;
};

// ---------------------------------------------------------------------------
// 列元信息（通过 TanStack 传递给渲染层）
// ---------------------------------------------------------------------------

type ColumnMeta = {
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
  sortable?: string;
  defaultSortOrder?: SortOrder;
};

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

export function DataTable<TData>({
  columns: userColumns,
  data,
  emptyState,
  sortBy,
  sortOrder,
  onSortChange,
  loading,
  footer,
  className,
}: DataTableProps<TData>) {
  const columns = useMemo<ColumnDef<TData>[]>(
    () =>
      userColumns.map((col) => {
        const renderCell = col.render;
        return {
          id: col.key,
          accessorFn: () => null,
          header: () => col.title,
          cell: renderCell
            ? ({ row }) => renderCell(row.original, row.index)
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
        };
      }),
    [userColumns],
  );

  const { getHeaderGroups, getRowModel } = useReactTable({
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

  const rows = getRowModel().rows;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <Table>
        <TableHeader>
          {getHeaderGroups().map((headerGroup) => (
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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={Math.max(userColumns.length, 1)}
                className="py-10 text-center text-muted-foreground"
              >
                {emptyState ?? "暂无数据"}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              return (
                <TableRow key={row.id} className="text-sm transition-colors hover:bg-muted/40">
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
            })
          )}
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
