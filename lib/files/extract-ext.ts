/** 从文件名解析扩展名（不含点，小写） */
export function extractExt(name: string): string {
  const index = name.lastIndexOf(".");
  if (index <= 0) return "";
  return name.slice(index + 1).toLowerCase();
}
