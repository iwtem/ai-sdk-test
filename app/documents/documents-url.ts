import type { ViewMode } from "./types";

export type FileSortField = "name" | "updatedAt" | "createdAt" | "size";
export type FileSortOrder = "asc" | "desc";

export type DocumentsUrlState = {
  folderId: string | null;
  trashView: boolean;
  q: string;
  sortBy: FileSortField;
  sortOrder: FileSortOrder;
  viewMode: ViewMode;
};

const SORT_VALUES: FileSortField[] = ["name", "updatedAt", "createdAt", "size"];

export const DOCUMENTS_URL_DEFAULTS: Pick<DocumentsUrlState, "sortBy" | "sortOrder" | "viewMode"> =
  {
    sortBy: "createdAt",
    sortOrder: "desc",
    viewMode: "card",
  };

export function parseDocumentsSearchParams(searchParams: URLSearchParams): DocumentsUrlState {
  const folderRaw = searchParams.get("folder")?.trim();
  const folderId = folderRaw ? folderRaw : null;
  const trashRaw = searchParams.get("trash");
  const trashView = trashRaw === "1" || trashRaw === "true";
  const q = searchParams.get("q") ?? "";
  const sortRaw = searchParams.get("sort");
  const sortBy = SORT_VALUES.includes(sortRaw as FileSortField)
    ? (sortRaw as FileSortField)
    : DOCUMENTS_URL_DEFAULTS.sortBy;
  const orderRaw = searchParams.get("order");
  const sortOrder: FileSortOrder =
    orderRaw === "asc" || orderRaw === "desc" ? orderRaw : DOCUMENTS_URL_DEFAULTS.sortOrder;
  const layoutRaw = searchParams.get("layout");
  const viewMode: ViewMode = layoutRaw === "list" ? "list" : DOCUMENTS_URL_DEFAULTS.viewMode;

  return { folderId, trashView, q, sortBy, sortOrder, viewMode };
}

export function serializeDocumentsUrl(state: DocumentsUrlState): string {
  const p = new URLSearchParams();
  if (state.folderId) p.set("folder", state.folderId);
  if (state.q.trim()) p.set("q", state.q.trim());
  if (state.sortBy !== DOCUMENTS_URL_DEFAULTS.sortBy) p.set("sort", state.sortBy);
  if (state.sortOrder !== DOCUMENTS_URL_DEFAULTS.sortOrder) p.set("order", state.sortOrder);
  if (state.viewMode !== DOCUMENTS_URL_DEFAULTS.viewMode) p.set("layout", state.viewMode);
  if (state.trashView) p.set("trash", "1");
  return p.toString();
}
