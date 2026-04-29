"use client";

import { usePathname, useSearchParams } from "next/navigation";
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
import { generatePagination } from "~/lib/utils";

interface DataPaginationProps {
  paginationMeta: PageNumberPaginationMeta<true>;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function DataPagination({ paginationMeta }: DataPaginationProps) {
  const { totalCount, pageCount, currentPage, isLastPage, isFirstPage, previousPage, nextPage } =
    paginationMeta;
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm">
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
