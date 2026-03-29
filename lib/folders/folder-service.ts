import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "~/lib/db";
import { files } from "~/lib/db/schema/files";
import { folders } from "~/lib/db/schema/folders";

export async function getFolderById(id: string) {
  const [row] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, id), isNull(folders.deletedAt)));
  return row ?? null;
}

/** 从 newParentId 沿父链向上，若经过 folderId 则说明 newParentId 在 folderId 子树内，移动会形成环 */
export async function wouldCreateFolderCycle(folderId: string, newParentId: string | null): Promise<boolean> {
  if (newParentId === null) return false;
  let current: string | null = newParentId;
  const seen = new Set<string>();
  while (current) {
    if (current === folderId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    const [row] = await db
      .select({ parentId: folders.parentId })
      .from(folders)
      .where(and(eq(folders.id, current), isNull(folders.deletedAt)));
    if (!row) return false;
    current = row.parentId;
  }
  return false;
}

export async function hasSiblingName(
  parentId: string | null,
  name: string,
  excludeFolderId?: string,
): Promise<boolean> {
  const conditions = [
    isNull(folders.deletedAt),
    eq(folders.name, name),
    parentId === null ? isNull(folders.parentId) : eq(folders.parentId, parentId),
  ];
  if (excludeFolderId) {
    conditions.push(ne(folders.id, excludeFolderId));
  }
  const [row] = await db.select({ id: folders.id }).from(folders).where(and(...conditions)).limit(1);
  return Boolean(row);
}

export async function countChildFolders(parentId: string): Promise<number> {
  const rows = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.parentId, parentId), isNull(folders.deletedAt)));
  return rows.length;
}

export async function countFilesInFolder(folderId: string): Promise<number> {
  const rows = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.folderId, folderId), isNull(files.deletedAt)));
  return rows.length;
}

export async function buildBreadcrumb(folderId: string): Promise<Array<{ id: string; name: string }>> {
  const path: Array<{ id: string; name: string }> = [];
  let current: string | null = folderId;
  const guard = new Set<string>();
  while (current) {
    if (guard.has(current)) break;
    guard.add(current);
    const [row] = await db
      .select({ id: folders.id, name: folders.name, parentId: folders.parentId })
      .from(folders)
      .where(and(eq(folders.id, current), isNull(folders.deletedAt)));
    if (!row) break;
    path.unshift({ id: row.id, name: row.name });
    current = row.parentId;
  }
  return path;
}
