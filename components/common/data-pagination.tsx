"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PageNumberPaginationMeta } from "prisma-extension-pagination";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn, generatePagination } from "~/lib/utils";

interface DataPaginationProps {
  paginationMeta: PageNumberPaginationMeta<true>;
  placement?: "sticky" | "inline";
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function DataPagination(props: DataPaginationProps) {
  const { paginationMeta, placement = "sticky", className } = props;
  const { totalCount, pageCount, currentPage, isLastPage, isFirstPage, previousPage, nextPage } =
    paginationMeta;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const pageSize = searchParams.get("size") ?? "10";

  const createPageHref = (page: number | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (page === null || page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }

    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const handlePageSizeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "10" || !value) {
      params.delete("size");
    } else {
      params.set("size", value);
      params.delete("page");
    }

    const qs = params.toString();
    router.push(`${pathname}?${qs}`);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        placement === "sticky" &&
          "fixed bottom-0 left-1/2 z-40 mb-6 w-xl max-w-full translate-x-[-50%] rounded-2xl border-border px-6 py-2 shadow-2xl backdrop-blur-md supports-backdrop-filter:bg-background/80",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Select value={pageSize} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="每页条数" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} 条/页
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-muted-foreground">
          共 <span className="font-medium text-foreground">{totalCount}</span> 条
        </span>
      </div>

      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              text="上一页"
              href={createPageHref(previousPage)}
              className={isFirstPage ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {generatePagination(currentPage, pageCount).map((page) => (
            <PaginationItem key={page}>
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href={createPageHref(page as number)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              text="下一页"
              href={createPageHref(nextPage)}
              className={isLastPage ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
