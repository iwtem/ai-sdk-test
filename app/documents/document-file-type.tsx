import {
  Database,
  FileSpreadsheet,
  FileText,
  FileType,
  Mail,
  NotebookPen,
  Presentation,
  Shapes,
} from "lucide-react";

export type FileVisualType =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "outlook"
  | "onenote"
  | "visio"
  | "access"
  | "doc";

export function normalizeExt(ext: string) {
  return ext.replace(/^\./, "").toLowerCase();
}

export function normalizeType(ext: string, mimeType: string): FileVisualType {
  const e = normalizeExt(ext);
  const m = mimeType.toLowerCase();

  if (e === "pdf" || m === "application/pdf") {
    return "pdf";
  }

  const wordExts = ["doc", "docx", "docm", "dot", "dotm", "dotx", "rtf", "odt", "wps", "wpt"];
  if (wordExts.includes(e)) return "word";
  if (
    m === "application/msword" ||
    m.includes("wordprocessingml") ||
    m === "application/rtf" ||
    m === "text/rtf" ||
    m === "application/vnd.oasis.opendocument.text"
  ) {
    return "word";
  }

  const excelExts = [
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
  ];
  if (excelExts.includes(e)) return "excel";
  if (
    m.includes("spreadsheetml") ||
    m === "application/vnd.ms-excel" ||
    m === "text/csv" ||
    m === "text/tab-separated-values" ||
    m === "application/vnd.oasis.opendocument.spreadsheet"
  ) {
    return "excel";
  }

  const pptExts = ["ppt", "pptx", "pptm", "potx", "potm", "pot", "pps", "ppsx", "ppsm", "odp"];
  if (pptExts.includes(e)) return "powerpoint";
  if (
    m.includes("presentationml") ||
    m.includes("ms-powerpoint") ||
    m === "application/vnd.oasis.opendocument.presentation"
  ) {
    return "powerpoint";
  }

  const outlookExts = ["msg", "eml", "pst", "ost", "oft"];
  if (outlookExts.includes(e)) return "outlook";
  if (m === "application/vnd.ms-outlook" || m.startsWith("message/rfc822")) {
    return "outlook";
  }

  if (e === "one" || m.includes("onenote")) return "onenote";

  const visioExts = ["vsdx", "vsdm", "vssx", "vssm", "vstx", "vstm", "vsd", "vss", "vst"];
  if (visioExts.includes(e)) return "visio";
  if (m.includes("visio") || m.includes("visiodrawing")) return "visio";

  const accessExts = ["mdb", "accdb", "accdt", "accdr", "mam", "mdw"];
  if (accessExts.includes(e)) return "access";
  if (m.includes("access")) return "access";

  if (["txt", "log", "md"].includes(e)) return "doc";
  if (m === "text/plain" || m === "text/markdown") return "doc";

  return "doc";
}

export const fileVisualTypeLabels: Record<FileVisualType, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  powerpoint: "PowerPoint",
  outlook: "Outlook",
  onenote: "OneNote",
  visio: "Visio",
  access: "Access",
  doc: "文档",
};

export function FileTypeIcon({ type }: { type: FileVisualType }) {
  const iconClass = "size-5 shrink-0";
  switch (type) {
    case "pdf":
      return <FileType className={`${iconClass} text-red-600 dark:text-red-400`} />;
    case "word":
      return <FileText className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
    case "excel":
      return <FileSpreadsheet className={`${iconClass} text-emerald-600 dark:text-emerald-400`} />;
    case "powerpoint":
      return <Presentation className={`${iconClass} text-orange-600 dark:text-orange-400`} />;
    case "outlook":
      return <Mail className={`${iconClass} text-sky-600 dark:text-sky-400`} />;
    case "onenote":
      return <NotebookPen className={`${iconClass} text-violet-600 dark:text-violet-400`} />;
    case "visio":
      return <Shapes className={`${iconClass} text-indigo-600 dark:text-indigo-400`} />;
    case "access":
      return <Database className={`${iconClass} text-amber-700 dark:text-amber-500`} />;
    default:
      return <FileText className={iconClass} />;
  }
}
