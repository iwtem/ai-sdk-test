/** 仅允许「文档类」上传：Office、PDF、纯文本等；禁止图片/音视频/压缩包/代码等 */

function extractExt(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0) return "";
  return name.slice(i + 1).toLowerCase();
}

export function normalizeExt(extOrName: string): string {
  return extOrName.replace(/^\./, "").toLowerCase();
}

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "docm",
  "dot",
  "dotm",
  "dotx",
  "rtf",
  "odt",
  "wps",
  "wpt",
  "xlsx",
  "xls",
  "xlsm",
  "xlsb",
  "xltx",
  "xltm",
  "xlt",
  "csv",
  "ods",
  "numbers",
  "tsv",
  "ppt",
  "pptx",
  "pptm",
  "potx",
  "potm",
  "pot",
  "pps",
  "ppsx",
  "ppsm",
  "odp",
  "msg",
  "eml",
  "pst",
  "ost",
  "oft",
  "one",
  "vsdx",
  "vsdm",
  "vssx",
  "vssm",
  "vstx",
  "vstm",
  "vsd",
  "vss",
  "vst",
  "mdb",
  "accdb",
  "accdt",
  "accdr",
  "mam",
  "mdw",
  "txt",
  "log",
  "md",
]);

function isBlockedNonDocumentMime(m: string): boolean {
  if (m.startsWith("image/")) return true;
  if (m.startsWith("video/")) return true;
  if (m.startsWith("audio/")) return true;
  if (m === "application/zip" || m === "application/x-zip-compressed") return true;
  if (m === "application/x-rar-compressed" || m === "application/vnd.rar") return true;
  if (m === "application/x-7z-compressed") return true;
  return false;
}

function isDocumentMime(m: string): boolean {
  if (m === "application/pdf") return true;
  if (m === "application/msword") return true;
  if (m.includes("wordprocessingml")) return true;
  if (m === "application/rtf" || m === "text/rtf") return true;
  if (m === "application/vnd.oasis.opendocument.text") return true;

  if (m.includes("spreadsheetml") || m === "application/vnd.ms-excel") return true;
  if (m === "text/csv" || m === "text/tab-separated-values") return true;
  if (m === "application/vnd.oasis.opendocument.spreadsheet") return true;

  if (m.includes("presentationml") || m.includes("ms-powerpoint")) return true;
  if (m === "application/vnd.oasis.opendocument.presentation") return true;

  if (m === "application/vnd.ms-outlook" || m.startsWith("message/rfc822")) return true;

  if (m.includes("onenote")) return true;

  if (m.includes("visio") || m.includes("visiodrawing")) return true;

  if (m.includes("access")) return true;

  if (m === "text/plain" || m === "text/markdown") return true;

  return false;
}

export function isDocumentUploadAllowed(fileName: string, mimeType: string): boolean {
  const m = (mimeType || "application/octet-stream").toLowerCase();
  if (isBlockedNonDocumentMime(m)) return false;

  const e = normalizeExt(extractExt(fileName));
  if (e && ALLOWED_EXTENSIONS.has(e)) return true;

  if (m === "application/octet-stream") return false;

  return isDocumentMime(m);
}

export const DOCUMENT_UPLOAD_REJECT_MESSAGE =
  "仅支持文档类文件（如 PDF、Word、Excel、PowerPoint、Outlook、纯文本等），不支持图片、音视频、压缩包等";

/** 用于 <input type="file" accept="...">，减少误选非文档文件 */
export const DOCUMENT_FILE_INPUT_ACCEPT = Array.from(ALLOWED_EXTENSIONS)
  .map((ext) => `.${ext}`)
  .join(",");
