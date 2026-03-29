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

export const DOCUMENTS_PATH = "/documents";
export const DOCUMENTS_TRASH_PATH = "/documents/trash";

const SORT_VALUES: FileSortField[] = ["name", "updatedAt", "createdAt", "size"];

export const DOCUMENTS_URL_DEFAULTS: Pick<DocumentsUrlState, "sortBy" | "sortOrder" | "viewMode"> =
  {
    sortBy: "createdAt",
    sortOrder: "desc",
    viewMode: "card",
  };

export function normalizeDocumentsPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isDocumentsTrashPathname(pathname: string): boolean {
  return normalizeDocumentsPathname(pathname) === DOCUMENTS_TRASH_PATH;
}

export function parseDocumentsLocation(
  pathname: string,
  searchParams: URLSearchParams,
): DocumentsUrlState {
  const norm = normalizeDocumentsPathname(pathname);
  const trashByPath = norm === DOCUMENTS_TRASH_PATH;
  const legacyTrashOnMain =
    norm === DOCUMENTS_PATH &&
    (searchParams.get("trash") === "1" || searchParams.get("trash") === "true");
  const trashView = trashByPath || legacyTrashOnMain;
  const folderRaw = searchParams.get("folder")?.trim();
  const folderId = trashView ? null : folderRaw ? folderRaw : null;
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

export function buildDocumentsHref(state: DocumentsUrlState): string {
  const base = state.trashView ? DOCUMENTS_TRASH_PATH : DOCUMENTS_PATH;
  const p = new URLSearchParams();
  if (!state.trashView && state.folderId) p.set("folder", state.folderId);
  if (state.q.trim()) p.set("q", state.q.trim());
  if (state.sortBy !== DOCUMENTS_URL_DEFAULTS.sortBy) p.set("sort", state.sortBy);
  if (state.sortOrder !== DOCUMENTS_URL_DEFAULTS.sortOrder) p.set("order", state.sortOrder);
  if (state.viewMode !== DOCUMENTS_URL_DEFAULTS.viewMode) p.set("layout", state.viewMode);
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}
