import type { ApiResponse } from "./response";

export type ApiParseResult<T> = { ok: true; data: T } | { ok: false; message: string };

function isEnvelope(raw: unknown): raw is ApiResponse {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "success" in raw &&
    typeof (raw as ApiResponse).success === "boolean"
  );
}

/**
 * 解析 `fetch` 已读出的 JSON（请先 `const raw = await res.json()`，避免重复消费 body）。
 * 仅接受服务端统一的 {@link ApiResponse} 信封。
 */
export function parseApiJson<T>(res: Response, raw: unknown): ApiParseResult<T> {
  if (!isEnvelope(raw)) {
    return {
      ok: false,
      message: `响应格式异常（HTTP ${res.status}）`,
    };
  }
  if (!raw.success) {
    return { ok: false, message: raw.message ?? `请求失败（${res.status}）` };
  }
  return { ok: true, data: raw.data as T };
}
