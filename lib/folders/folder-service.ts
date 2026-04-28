import { db } from "~/lib/db";

export async function getFolderById(id: string) {
  return db.folder.findFirst({
    where: { id, deletedAt: null },
  });
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
    const row = await db.folder.findFirst({
      where: { id: current, deletedAt: null },
      select: { parentId: true },
    });
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
  const row = await db.folder.findFirst({
    where: {
      deletedAt: null,
      name,
      parentId,
      ...(excludeFolderId ? { id: { not: excludeFolderId } } : {}),
    },
    select: { id: true },
  });
  return !!row;
}

export async function countChildFolders(parentId: string): Promise<number> {
  return db.folder.count({
    where: {
      parentId,
      deletedAt: null,
    },
  });
}

export async function countFilesInFolder(folderId: string): Promise<number> {
  return db.file.count({
    where: {
      folderId,
      deletedAt: null,
    },
  });
}

export async function buildBreadcrumb(folderId: string): Promise<Array<{ id: string; name: string }>> {
  const path: Array<{ id: string; name: string }> = [];
  let current: string | null = folderId;
  const guard = new Set<string>();
  while (current) {
    if (guard.has(current)) break;
    guard.add(current);
    const row = await db.folder.findFirst({
      where: { id: current, deletedAt: null },
      select: { id: true, name: true, parentId: true },
    });
    if (!row) break;
    path.unshift({ id: row.id, name: row.name });
    current = row.parentId;
  }
  return path;
}
